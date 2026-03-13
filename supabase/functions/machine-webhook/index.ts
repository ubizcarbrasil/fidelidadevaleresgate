import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-api-secret",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getClientIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Rate limiting
  const ip = getClientIp(req) || "unknown";
  const rlKey = rateLimitKey("machine-webhook", ip);
  const rlOk = await checkRateLimit(sb, rlKey, 30, 60);
  if (!rlOk) return rateLimitResponse(corsHeaders);

  try {
    const body = await req.json();
    const { request_id, status_code, brand_id: bodyBrandId } = body;

    if (!request_id || !status_code) {
      return json({ error: "Missing request_id or status_code" }, 400);
    }

    // Only process finalized rides
    if (status_code !== "F") {
      return json({ message: "Ignored non-finalized event", status_code });
    }

    // Find the integration config — use brand_id from body or x-api-secret header
    const apiSecret = req.headers.get("x-api-secret");
    let integration: any = null;

    if (apiSecret) {
      const { data } = await sb
        .from("machine_integrations")
        .select("*")
        .eq("api_key", apiSecret)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      integration = data;
    } else if (bodyBrandId) {
      const { data } = await sb
        .from("machine_integrations")
        .select("*")
        .eq("brand_id", bodyBrandId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      integration = data;
    }

    if (!integration) {
      return json({ error: "Integration not found or inactive" }, 401);
    }

    const brandId = integration.brand_id;

    // Update last_webhook_at
    sb.from("machine_integrations")
      .update({ last_webhook_at: new Date().toISOString() })
      .eq("id", integration.id)
      .then();

    // Anti-duplication check
    const machineRideId = String(request_id);
    const { data: existing } = await sb
      .from("machine_rides")
      .select("id")
      .eq("brand_id", brandId)
      .eq("machine_ride_id", machineRideId)
      .maybeSingle();

    if (existing) {
      return json({ message: "Ride already processed", machine_ride_id: machineRideId });
    }

    // Call TaxiMachine API to get ride details
    const basicAuth = btoa(`${integration.basic_auth_user}:${integration.basic_auth_password}`);
    const machineBaseUrl = "https://api.taximachine.com.br";

    // 1. Get ride status
    const statusRes = await fetch(
      `${machineBaseUrl}/api/integracao/solicitacaoStatus?id_mch=${machineRideId}`,
      { headers: { Authorization: `Basic ${basicAuth}` } }
    );
    if (!statusRes.ok) {
      const errText = await statusRes.text();
      console.error("TaxiMachine solicitacaoStatus error:", errText);
      return json({ error: "Failed to fetch ride status from TaxiMachine" }, 502);
    }
    const statusData = await statusRes.json();

    // 2. Get receipt
    const receiptRes = await fetch(
      `${machineBaseUrl}/api/integracao/recibo?id_mch=${machineRideId}`,
      { headers: { Authorization: `Basic ${basicAuth}` } }
    );
    if (!receiptRes.ok) {
      const errText = await receiptRes.text();
      console.error("TaxiMachine recibo error:", errText);
      return json({ error: "Failed to fetch receipt from TaxiMachine" }, 502);
    }
    const receiptData = await receiptRes.json();

    // Extract ride value
    const rideValue = Number(
      receiptData?.dados_solicitacao?.valor ||
      receiptData?.valor ||
      statusData?.dados_solicitacao?.valor ||
      0
    );

    if (rideValue <= 0) {
      // Store ride but no points
      await sb.from("machine_rides").insert({
        brand_id: brandId,
        machine_ride_id: machineRideId,
        ride_value: 0,
        ride_status: "NO_VALUE",
        points_credited: 0,
        finalized_at: new Date().toISOString(),
      });
      return json({ message: "Ride has no value", machine_ride_id: machineRideId });
    }

    // Extract passenger CPF
    const passengerCpf = (
      statusData?.cliente?.cpf ||
      statusData?.dados_solicitacao?.cpf_passageiro ||
      receiptData?.cliente?.cpf ||
      ""
    ).replace(/\D/g, "");

    // Calculate points: 1 Real = 1 point
    const points = Math.floor(rideValue);

    // Insert machine_ride record
    await sb.from("machine_rides").insert({
      brand_id: brandId,
      machine_ride_id: machineRideId,
      passenger_cpf: passengerCpf || null,
      ride_value: rideValue,
      ride_status: "FINALIZED",
      points_credited: points,
      finalized_at: new Date().toISOString(),
    });

    // If we have a CPF, try to credit points to the customer
    let pointsCredited = false;
    if (passengerCpf && points > 0) {
      // Find customer by CPF in this brand
      const { data: customer } = await sb
        .from("customers")
        .select("id, branch_id, points_balance")
        .eq("brand_id", brandId)
        .eq("cpf", passengerCpf)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (customer) {
        // Credit points via points_ledger
        await sb.from("points_ledger").insert({
          brand_id: brandId,
          branch_id: customer.branch_id,
          customer_id: customer.id,
          points,
          type: "EARN",
          source: "MACHINE_RIDE",
          description: `Corrida TaxiMachine #${machineRideId} - R$ ${rideValue.toFixed(2)}`,
          reference_id: machineRideId,
        });

        // Update customer balance
        await sb
          .from("customers")
          .update({ points_balance: (customer.points_balance || 0) + points })
          .eq("id", customer.id);

        pointsCredited = true;
      }
    }

    // Update integration counters
    await sb.rpc("", {}).catch(() => {}); // fallback: direct update
    const { error: updateErr } = await sb
      .from("machine_integrations")
      .update({
        total_rides: integration.total_rides + 1,
        total_points: integration.total_points + (pointsCredited ? points : 0),
        last_ride_processed_at: new Date().toISOString(),
      })
      .eq("id", integration.id);

    if (updateErr) console.error("Update integration counters error:", updateErr);

    return json({
      success: true,
      machine_ride_id: machineRideId,
      ride_value: rideValue,
      points_credited: pointsCredited ? points : 0,
      customer_found: pointsCredited,
    });
  } catch (err) {
    console.error("machine-webhook error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
