import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logger = createEdgeLogger("driver-notifications-cron");

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Convert current UTC time to BRT (UTC-3) */
function nowBRT(): Date {
  const now = new Date();
  return new Date(now.getTime() - 3 * 60 * 60 * 1000);
}

/** Get today's midnight in BRT as ISO string (UTC) */
function todayMidnightBRT_asUTC(): string {
  const brt = nowBRT();
  const midnightBRT = new Date(brt.getFullYear(), brt.getMonth(), brt.getDate());
  // Convert back to UTC by adding 3 hours
  return new Date(midnightBRT.getTime() + 3 * 60 * 60 * 1000).toISOString();
}

/** Get current BRT time as minutes since midnight */
function currentBRTMinutes(): number {
  const brt = nowBRT();
  return brt.getHours() * 60 + brt.getMinutes();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: verify service_role key or AGENT_SECRET
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const agentSecret = Deno.env.get("AGENT_SECRET") || "";

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

  if (token !== serviceRoleKey && token !== agentSecret && token !== anonKey) {
    return json({ error: "Unauthorized" }, 401);
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey,
  );

  try {
    // Fetch integrations with DAILY or EVERY_X_HOURS
    const { data: integrations, error: intError } = await sb
      .from("machine_integrations")
      .select("brand_id, api_key, basic_auth_user, basic_auth_password, driver_message_frequency, driver_message_frequency_value")
      .eq("driver_message_enabled", true)
      .in("driver_message_frequency", ["DAILY", "EVERY_X_HOURS"]);

    if (intError) {
      logger.error("Failed to fetch integrations", { error: String(intError) });
      return json({ error: "Failed to fetch integrations" }, 500);
    }

    if (!integrations || integrations.length === 0) {
      logger.info("No integrations with DAILY or EVERY_X_HOURS found");
      return json({ processed: 0 });
    }

    let totalSent = 0;
    let totalSkipped = 0;

    for (const integration of integrations) {
      try {
        const result = await processIntegration(sb, integration);
        totalSent += result.sent;
        totalSkipped += result.skipped;
      } catch (err) {
        logger.error("Error processing integration", {
          brand_id: integration.brand_id,
          error: String(err),
        });
        await logError(sb, integration.brand_id, `Error processing integration: ${String(err)}`);
      }
    }

    logger.info("Cron completed", { totalSent, totalSkipped, integrations: integrations.length });
    return json({ success: true, totalSent, totalSkipped, integrations: integrations.length });

  } catch (err) {
    logger.error("Unexpected error", { error: String(err) });
    return json({ error: "Internal error" }, 500);
  }
});

interface Integration {
  brand_id: string;
  api_key: string;
  basic_auth_user: string;
  basic_auth_password: string;
  driver_message_frequency: string;
  driver_message_frequency_value: number | null;
}

async function processIntegration(
  sb: ReturnType<typeof createClient>,
  integration: Integration,
): Promise<{ sent: number; skipped: number }> {
  const { brand_id, driver_message_frequency, driver_message_frequency_value } = integration;
  const freqValue = driver_message_frequency_value || 0;

  if (driver_message_frequency === "DAILY") {
    return await processDailyMode(sb, integration, freqValue);
  } else if (driver_message_frequency === "EVERY_X_HOURS") {
    return await processEveryXHoursMode(sb, integration, freqValue);
  }

  return { sent: 0, skipped: 0 };
}

// --- DAILY mode ---
async function processDailyMode(
  sb: ReturnType<typeof createClient>,
  integration: Integration,
  scheduledMinutes: number,
): Promise<{ sent: number; skipped: number }> {
  const currentMinutes = currentBRTMinutes();
  const diff = Math.abs(currentMinutes - scheduledMinutes);

  // Tolerance: 5 minutes
  if (diff > 5 && diff < (24 * 60 - 5)) {
    logger.info("DAILY: not the scheduled time", {
      brand_id: integration.brand_id,
      currentMinutes,
      scheduledMinutes,
      diff,
    });
    return { sent: 0, skipped: 0 };
  }

  logger.info("DAILY: processing", { brand_id: integration.brand_id, scheduledMinutes, currentMinutes });

  const sinceUTC = todayMidnightBRT_asUTC();
  return await sendSummaryNotifications(sb, integration, sinceUTC, "today");
}

// --- EVERY_X_HOURS mode ---
async function processEveryXHoursMode(
  sb: ReturnType<typeof createClient>,
  integration: Integration,
  hours: number,
): Promise<{ sent: number; skipped: number }> {
  if (hours <= 0) {
    logger.warn("EVERY_X_HOURS: invalid hours value", { brand_id: integration.brand_id, hours });
    return { sent: 0, skipped: 0 };
  }

  const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  logger.info("EVERY_X_HOURS: processing", { brand_id: integration.brand_id, hours, sinceDate });

  return await sendSummaryNotifications(sb, integration, sinceDate, `${hours}h`);
}

// --- Shared: find drivers with rides in period, check for existing notifs, send ---
async function sendSummaryNotifications(
  sb: ReturnType<typeof createClient>,
  integration: Integration,
  sinceUTC: string,
  periodLabel: string,
): Promise<{ sent: number; skipped: number }> {
  const { brand_id } = integration;
  let sent = 0;
  let skipped = 0;

  // Get all finalized rides in the period for this brand, grouped by driver
  const { data: rides, error: ridesErr } = await sb
    .from("machine_rides")
    .select("driver_customer_id, driver_name, driver_points_credited, branch_id, id")
    .eq("brand_id", brand_id)
    .eq("ride_status", "FINALIZED")
    .gt("finalized_at", sinceUTC)
    .not("driver_customer_id", "is", null);

  if (ridesErr || !rides || rides.length === 0) {
    if (ridesErr) logger.error("Error fetching rides", { error: String(ridesErr), brand_id });
    return { sent: 0, skipped: 0 };
  }

  // Group rides by driver_customer_id
  const driverMap = new Map<string, {
    totalRides: number;
    totalPoints: number;
    driverName: string | null;
    branchId: string | null;
    lastRideId: string;
  }>();

  for (const ride of rides) {
    if (!ride.driver_customer_id) continue;
    const existing = driverMap.get(ride.driver_customer_id);
    if (existing) {
      existing.totalRides++;
      existing.totalPoints += (ride.driver_points_credited || 0);
      existing.lastRideId = ride.id;
    } else {
      driverMap.set(ride.driver_customer_id, {
        totalRides: 1,
        totalPoints: ride.driver_points_credited || 0,
        driverName: ride.driver_name,
        branchId: ride.branch_id,
        lastRideId: ride.id,
      });
    }
  }

  // For each driver, check if already notified in this period
  for (const [driverCustomerId, stats] of driverMap.entries()) {
    if (stats.totalPoints <= 0) {
      skipped++;
      continue;
    }

    // Check existing notification in this period
    const { data: existingNotif } = await sb
      .from("machine_ride_notifications")
      .select("id")
      .eq("customer_id", driverCustomerId)
      .eq("notification_type", "DRIVER")
      .gt("created_at", sinceUTC)
      .limit(1)
      .maybeSingle();

    if (existingNotif) {
      skipped++;
      continue;
    }

    // Get driver info
    const { data: customer } = await sb
      .from("customers")
      .select("points_balance, name, external_driver_id")
      .eq("id", driverCustomerId)
      .maybeSingle();

    if (!customer || !customer.external_driver_id) {
      skipped++;
      continue;
    }

    const cleanName = (customer.name || stats.driverName || "Motorista")
      .replace(/^\[MOTORISTA\]\s*/i, "");
    const currentBalance = customer.points_balance || 0;

    const mensagem = `Oi ${cleanName}! Hoje você fez ${stats.totalRides} corridas e acumulou +${stats.totalPoints} pontos. Seu saldo agora é ${currentBalance} pts. Continue acumulando para resgatar ofertas exclusivas!`;

    // Send via TaxiMachine API
    const sendOk = await sendDriverMessage(
      integration,
      customer.external_driver_id,
      mensagem,
      { brand_id, driverCustomerId },
    );

    if (!sendOk) {
      await logError(sb, brand_id, `Failed to send cron notification to driver ${driverCustomerId}`);
      skipped++;
      continue;
    }

    // Record notification
    await sb.from("machine_ride_notifications").insert({
      brand_id,
      branch_id: stats.branchId || null,
      machine_ride_id: stats.lastRideId,
      customer_id: driverCustomerId,
      customer_name: cleanName,
      driver_name: stats.driverName || null,
      points_credited: stats.totalPoints,
      ride_value: 0,
      finalized_at: new Date().toISOString(),
      notification_type: "DRIVER",
    });

    sent++;
    logger.info("Cron notification sent", {
      brand_id,
      driverCustomerId,
      totalRides: stats.totalRides,
      totalPoints: stats.totalPoints,
    });
  }

  return { sent, skipped };
}

// --- Send message via TaxiMachine ---
async function sendDriverMessage(
  integration: Integration,
  externalDriverId: string,
  mensagem: string,
  meta: { brand_id: string; driverCustomerId: string },
): Promise<boolean> {
  const destinatarioId = parseInt(externalDriverId, 10);
  if (isNaN(destinatarioId)) {
    logger.error("Invalid external_driver_id", { ...meta, externalDriverId });
    return false;
  }

  const basicToken = btoa(`${integration.basic_auth_user}:${integration.basic_auth_password}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const apiResponse = await fetch("https://api.taximachine.com.br/api/integracao/enviarMensagem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": integration.api_key,
        "Authorization": `Basic ${basicToken}`,
      },
      body: JSON.stringify({
        tipo_chat: "P",
        destinatario_id: destinatarioId,
        mensagem,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const responseText = await apiResponse.text();

    if (!apiResponse.ok) {
      logger.error("TaxiMachine API error (cron)", {
        status: apiResponse.status,
        response: responseText.slice(0, 300),
        ...meta,
      });
      return false;
    }

    return true;
  } catch (err) {
    logger.error("Fetch error sending message", { error: String(err), ...meta });
    return false;
  }
}

// --- Log error ---
async function logError(sb: ReturnType<typeof createClient>, brandId: string, message: string) {
  try {
    await sb.from("error_logs").insert({
      source: "driver-notifications-cron",
      message,
      severity: "error",
      brand_id: brandId,
    });
  } catch (_) { /* ignore */ }
}
