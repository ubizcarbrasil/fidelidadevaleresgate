import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

    // Fetch API key from machine_integrations
    const { data: integration } = await sb
      .from("machine_integrations")
      .select("api_key")
      .eq("brand_id", brand_id)
      .maybeSingle();

    if (!integration?.api_key) {
      logger.error("API key not found in machine_integrations", { brand_id });
      return json({ error: "API key not configured for brand" }, 500);
    }

    // Check for duplicate DRIVER notification
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

    // Fetch current driver balance
    const { data: driverCustomer } = await sb
      .from("customers")
      .select("points_balance, name")
      .eq("id", driver_customer_id)
      .maybeSingle();

    if (!driverCustomer) {
      logger.error("Driver customer not found", { driver_customer_id });
      return json({ error: "Driver customer not found" }, 404);
    }

    // Build message
    const cleanName = (driverCustomer.name || driver_name || "Motorista")
      .replace(/^\[MOTORISTA\]\s*/i, "");
    const rideValueFormatted = Number(ride_value || 0).toFixed(2);
    const currentBalance = driverCustomer.points_balance || 0;

    const mensagem = `Oi ${cleanName}! Você acaba de ganhar +${driver_points_credited} pontos pela corrida de R$${rideValueFormatted}. Seu saldo agora é ${currentBalance} pts. Continue acumulando para resgatar ofertas exclusivas!`;

    // Send message via TaxiMachine API
    const destinatarioId = parseInt(driver_id, 10);
    if (isNaN(destinatarioId)) {
      logger.error("Invalid driver_id (not a number)", { driver_id });
      return json({ error: "Invalid driver_id" }, 400);
    }

    logger.info("Sending driver notification", { machine_ride_id, driver_id: destinatarioId, points: driver_points_credited });

    const apiResponse = await fetch("https://api-vendas.taximachine.com.br/api/integracao/enviarMensagem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": TAXIMACHINE_API_KEY,
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

      // Log error
      await sb.from("error_logs").insert({
        source: "notify-driver-points",
        message: `Failed to send driver notification: HTTP ${apiResponse.status}`,
        severity: "error",
        brand_id: brand_id,
        metadata_json: {
          machine_ride_id,
          driver_id,
          http_status: apiResponse.status,
          response: apiData?.slice(0, 500),
        },
      });

      return json({ error: "TaxiMachine API error", status: apiResponse.status }, 502);
    }

    logger.info("Driver notification sent successfully", { machine_ride_id, driver_id: destinatarioId });

    // Record DRIVER notification to prevent duplicates
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

    return json({ success: true, machine_ride_id, driver_id: destinatarioId });
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
