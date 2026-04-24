import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logger = createEdgeLogger("notify-driver-points");

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json();
    const {
      machine_ride_id,
      brand_id,
      branch_id,
      driver_customer_id,
      driver_id,
      driver_points_credited,
      ride_value,
      driver_name,
      finalized_at,
    } = body;

    // Validate required fields
    if (!machine_ride_id || !brand_id || !driver_id || !driver_customer_id) {
      return json({ error: "Missing required fields" }, 400);
    }

    if (!driver_points_credited || driver_points_credited <= 0) {
      return json({ error: "No points to notify", skipped: true }, 200);
    }

    // Fetch integration config (API key + frequency settings)
    const { data: integration } = await sb
      .from("machine_integrations")
      .select("api_key, basic_auth_user, basic_auth_password, driver_message_frequency, driver_message_frequency_value")
      .eq("brand_id", brand_id)
      .maybeSingle();

    if (!integration?.api_key) {
      logger.error("API key not found in machine_integrations", { brand_id });
      return json({ error: "API key not configured for brand" }, 500);
    }

    const frequency = integration.driver_message_frequency || "EVERY_RIDE";
    const frequencyValue = integration.driver_message_frequency_value || 1;

    // Early return for modes not yet implemented
    if (frequency === "DAILY" || frequency === "EVERY_X_HOURS") {
      logger.info("Frequency mode not yet implemented, skipping", { frequency, machine_ride_id });
      return json({ skipped: true, reason: "frequency_mode_not_implemented", frequency }, 200);
    }

    // Check for duplicate DRIVER notification for this specific ride
    const { data: existing } = await sb
      .from("machine_ride_notifications")
      .select("id")
      .eq("machine_ride_id", machine_ride_id)
      .eq("brand_id", brand_id)
      .eq("notification_type", "DRIVER")
      .limit(1)
      .maybeSingle();

    if (existing) {
      logger.info("Duplicate driver notification skipped", { machine_ride_id, brand_id });
      return json({ skipped: true, reason: "already_notified" }, 200);
    }

    // Fetch current driver balance and name
    const { data: driverCustomer } = await sb
      .from("customers")
      .select("points_balance, name")
      .eq("id", driver_customer_id)
      .maybeSingle();

    if (!driverCustomer) {
      logger.error("Driver customer not found", { driver_customer_id });
      return json({ error: "Driver customer not found" }, 404);
    }

    const cleanName = (driverCustomer.name || driver_name || "Motorista")
      .replace(/^\[MOTORISTA\]\s*/i, "");
    const currentBalance = driverCustomer.points_balance || 0;

    // --- Frequency logic ---
    if (frequency === "EVERY_RIDE") {
      // Original behavior: send notification for every ride
      const rideValueFormatted = Number(ride_value || 0).toFixed(2);
      const mensagem = `Oi ${cleanName}! Você acaba de ganhar +${driver_points_credited} pontos pela corrida de R$${rideValueFormatted}. Seu saldo agora é ${currentBalance} pts. Continue acumulando para resgatar ofertas exclusivas!`;

      const sendResult = await sendDriverMessage(sb, integration, driver_id, mensagem, {
        machine_ride_id, driver_id, brand_id, driver_points_credited,
      });

      if (!sendResult.success) {
        await logError(sb, brand_id, machine_ride_id, driver_id, sendResult);
        return json({ error: "TaxiMachine API error", status: sendResult.httpStatus }, 502);
      }

      // Record notification
      await sb.from("machine_ride_notifications").insert({
        brand_id,
        branch_id: branch_id || null,
        machine_ride_id,
        customer_id: driver_customer_id,
        customer_name: cleanName,
        driver_name: driver_name || null,
        points_credited: driver_points_credited,
        ride_value: ride_value || 0,
        finalized_at: finalized_at || new Date().toISOString(),
        notification_type: "DRIVER",
      });

      return json({ success: true, machine_ride_id, driver_id: parseInt(driver_id, 10), frequency });
    }

    // --- Accumulation modes (EVERY_X_RIDES / EVERY_X_POINTS) ---

    // Find the last DRIVER notification for this driver
    const { data: lastNotif } = await sb
      .from("machine_ride_notifications")
      .select("created_at")
      .eq("customer_id", driver_customer_id)
      .eq("notification_type", "DRIVER")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sinceDate = lastNotif?.created_at || "1970-01-01T00:00:00Z";

    // Query rides since last notification
    let ridesQuery = sb
      .from("machine_rides")
      .select("id, driver_points_credited")
      .eq("brand_id", brand_id)
      .eq("driver_customer_id", driver_customer_id)
      .eq("ride_status", "FINALIZED")
      .gt("finalized_at", sinceDate);

    const { data: ridesSince, error: ridesError } = await ridesQuery;

    if (ridesError) {
      logger.error("Error querying rides since last notification", { error: String(ridesError) });
      return json({ error: "Failed to query accumulated rides" }, 500);
    }

    const totalRides = ridesSince?.length || 0;
    const totalPointsPeriod = (ridesSince || []).reduce(
      (sum: number, r: { driver_points_credited: number | null }) => sum + (r.driver_points_credited || 0),
      0,
    );

    let shouldSend = false;

    if (frequency === "EVERY_X_RIDES") {
      shouldSend = totalRides >= frequencyValue;
      logger.info("EVERY_X_RIDES check", { totalRides, threshold: frequencyValue, shouldSend });
    } else if (frequency === "EVERY_X_POINTS") {
      shouldSend = totalPointsPeriod >= frequencyValue;
      logger.info("EVERY_X_POINTS check", { totalPointsPeriod, threshold: frequencyValue, shouldSend });
    }

    if (!shouldSend) {
      logger.info("Threshold not reached, skipping notification", {
        frequency, totalRides, totalPointsPeriod, threshold: frequencyValue, driver_customer_id,
      });
      return json({
        skipped: true,
        reason: "threshold_not_reached",
        frequency,
        totalRides,
        totalPointsPeriod,
        threshold: frequencyValue,
      }, 200);
    }

    // Build summary message
    let mensagem: string;
    if (frequency === "EVERY_X_RIDES") {
      mensagem = `Oi ${cleanName}! Nas últimas ${totalRides} corridas você acumulou +${totalPointsPeriod} pontos. Seu saldo agora é ${currentBalance} pts. Continue acumulando para resgatar ofertas exclusivas!`;
    } else {
      mensagem = `Oi ${cleanName}! Você acumulou +${totalPointsPeriod} pontos nas últimas ${totalRides} corridas. Seu saldo agora é ${currentBalance} pts. Continue acumulando para resgatar ofertas exclusivas!`;
    }

    const sendResult = await sendDriverMessage(sb, integration, driver_id, mensagem, {
      machine_ride_id, driver_id, brand_id, driver_points_credited: totalPointsPeriod,
    });

    if (!sendResult.success) {
      await logError(sb, brand_id, machine_ride_id, driver_id, sendResult);
      return json({ error: "TaxiMachine API error", status: sendResult.httpStatus }, 502);
    }

    // Record summary notification
    await sb.from("machine_ride_notifications").insert({
      brand_id,
      branch_id: branch_id || null,
      machine_ride_id,
      customer_id: driver_customer_id,
      customer_name: cleanName,
      driver_name: driver_name || null,
      points_credited: totalPointsPeriod,
      ride_value: ride_value || 0,
      finalized_at: finalized_at || new Date().toISOString(),
      notification_type: "DRIVER",
    });

    logger.info("Summary notification sent", {
      frequency, totalRides, totalPointsPeriod, driver_customer_id, machine_ride_id,
    });

    return json({
      success: true,
      machine_ride_id,
      driver_id: parseInt(driver_id, 10),
      frequency,
      totalRides,
      totalPointsPeriod,
    });

  } catch (err) {
    logger.error("Unexpected error", { error: String(err) });

    try {
      await sb.from("error_logs").insert({
        source: "notify-driver-points",
        message: `Unexpected error: ${String(err)}`,
        severity: "error",
      });
    } catch (_) { /* ignore */ }

    return json({ error: "Internal error" }, 500);
  }
});

// --- Helper: send message via TaxiMachine API ---
async function sendDriverMessage(
  _sb: ReturnType<typeof createClient>,
  integration: { api_key: string; basic_auth_user: string; basic_auth_password: string },
  driverIdRaw: string,
  mensagem: string,
  meta: { machine_ride_id: string; driver_id: string; brand_id: string; driver_points_credited: number },
): Promise<{ success: boolean; httpStatus?: number; response?: string }> {
  const destinatarioId = parseInt(driverIdRaw, 10);
  if (isNaN(destinatarioId)) {
    logger.error("Invalid driver_id (not a number)", { driver_id: driverIdRaw });
    return { success: false, httpStatus: 400, response: "Invalid driver_id" };
  }

  logger.info("Sending driver notification", {
    machine_ride_id: meta.machine_ride_id,
    driver_id: destinatarioId,
    points: meta.driver_points_credited,
  });

  const basicToken = btoa(`${integration.basic_auth_user}:${integration.basic_auth_password}`);

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
  });

  const apiData = await apiResponse.text();

  if (!apiResponse.ok) {
    logger.error("TaxiMachine API error", { status: apiResponse.status, response: apiData });
    return { success: false, httpStatus: apiResponse.status, response: apiData };
  }

  logger.info("Driver notification sent successfully", {
    machine_ride_id: meta.machine_ride_id,
    driver_id: destinatarioId,
  });

  return { success: true };
}

// --- Helper: log error ---
async function logError(
  sb: ReturnType<typeof createClient>,
  brandId: string,
  machineRideId: string,
  driverId: string,
  sendResult: { httpStatus?: number; response?: string },
) {
  try {
    await sb.from("error_logs").insert({
      source: "notify-driver-points",
      message: `Failed to send driver notification: HTTP ${sendResult.httpStatus}`,
      severity: "error",
      brand_id: brandId,
      metadata_json: {
        machine_ride_id: machineRideId,
        driver_id: driverId,
        http_status: sendResult.httpStatus,
        response: sendResult.response?.slice(0, 500),
      },
    });
  } catch (_) { /* ignore */ }
}
