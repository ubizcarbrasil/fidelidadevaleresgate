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


function logAudit(
  sb: ReturnType<typeof createClient>,
  action: string,
  opts: { brandId?: string; entityId?: string; ip?: string | null; details?: Record<string, unknown>; changes?: Record<string, unknown> } = {}
) {
  sb.from("audit_logs")
    .insert({
      action,
      entity_type: "MACHINE_WEBHOOK",
      entity_id: opts.entityId || null,
      scope_type: opts.brandId ? "BRAND" : null,
      scope_id: opts.brandId || null,
      ip_address: opts.ip || null,
      details_json: opts.details || {},
      changes_json: opts.changes || {},
    })
    .then(({ error }) => {
      if (error) console.error("audit_log insert error:", error);
    });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const ip = getClientIp(req) || "unknown";

  // Rate limiting
  const rlKey = rateLimitKey("machine-webhook", ip);
  const rlOk = await checkRateLimit(sb, rlKey, 30, 60);
  if (!rlOk) {
    logAudit(sb, "MACHINE_RATE_LIMITED", { ip, details: { reason: "rate_limit" } });
    return rateLimitResponse(corsHeaders);
  }

  try {
    const body = await req.json();
    const { request_id, status_code, brand_id: bodyBrandId } = body;

    if (!request_id || !status_code) {
      logAudit(sb, "MACHINE_WEBHOOK_REJECTED", { ip, details: { reason: "missing_fields", request_id, status_code } });
      return json({ error: "Missing request_id or status_code" }, 400);
    }

    // Only process finalized rides
    if (status_code !== "F") {
      logAudit(sb, "MACHINE_WEBHOOK_IGNORED", { ip, details: { request_id, status_code, reason: "not_finalized" } });
      return json({ message: "Ignored non-finalized event", status_code });
    }

    // Find the integration config
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
      logAudit(sb, "MACHINE_WEBHOOK_AUTH_FAILED", { ip, details: { request_id, reason: "integration_not_found" } });
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
      logAudit(sb, "MACHINE_RIDE_DUPLICATE", { brandId, entityId: machineRideId, ip, details: { reason: "already_processed" } });
      return json({ message: "Ride already processed", machine_ride_id: machineRideId });
    }

    logAudit(sb, "MACHINE_WEBHOOK_RECEIVED", { brandId, entityId: machineRideId, ip, details: { status_code } });

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
      logAudit(sb, "MACHINE_API_ERROR", { brandId, entityId: machineRideId, ip, details: { endpoint: "solicitacaoStatus", status: statusRes.status } });
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
      logAudit(sb, "MACHINE_API_ERROR", { brandId, entityId: machineRideId, ip, details: { endpoint: "recibo", status: receiptRes.status } });
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
      await sb.from("machine_rides").insert({
        brand_id: brandId,
        machine_ride_id: machineRideId,
        ride_value: 0,
        ride_status: "NO_VALUE",
        points_credited: 0,
        finalized_at: new Date().toISOString(),
      });
      logAudit(sb, "MACHINE_RIDE_NO_VALUE", { brandId, entityId: machineRideId, ip, details: { ride_value: 0 } });
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

    // If we have a CPF, find or create customer and credit points
    let pointsCredited = false;
    let customerId: string | null = null;
    if (passengerCpf && points > 0) {
      let customer: any = null;

      const { data: existing } = await sb
        .from("customers")
        .select("id, branch_id, points_balance")
        .eq("brand_id", brandId)
        .eq("cpf", passengerCpf)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (existing) {
        customer = existing;
      } else {
        // Auto-create: find first branch of brand
        const { data: branch } = await sb
          .from("branches")
          .select("id")
          .eq("brand_id", brandId)
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (branch) {
          const customerName = `Passageiro •••${passengerCpf.slice(-4)}`;
          const { data: created } = await sb
            .from("customers")
            .insert({
              brand_id: brandId,
              branch_id: branch.id,
              cpf: passengerCpf,
              name: customerName,
              points_balance: 0,
              money_balance: 0,
            })
            .select("id, branch_id, points_balance")
            .single();

          if (created) {
            customer = created;
            logAudit(sb, "MACHINE_CUSTOMER_CREATED", {
              brandId,
              entityId: created.id,
              ip,
              details: { cpf_masked: `***${passengerCpf.slice(-4)}`, branch_id: branch.id },
            });
          }
        }
      }

      if (customer) {
        customerId = customer.id;
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

        await sb
          .from("customers")
          .update({ points_balance: (customer.points_balance || 0) + points })
          .eq("id", customer.id);

        pointsCredited = true;
      }
    }

    // Update integration counters
    const { error: updateErr } = await sb
      .from("machine_integrations")
      .update({
        total_rides: integration.total_rides + 1,
        total_points: integration.total_points + (pointsCredited ? points : 0),
        last_ride_processed_at: new Date().toISOString(),
      })
      .eq("id", integration.id);

    if (updateErr) console.error("Update integration counters error:", updateErr);

    // Audit: ride processed successfully
    logAudit(sb, "MACHINE_RIDE_PROCESSED", {
      brandId,
      entityId: machineRideId,
      ip,
      details: {
        ride_value: rideValue,
        points,
        points_credited: pointsCredited,
        customer_id: customerId,
        passenger_cpf: passengerCpf ? `***${passengerCpf.slice(-4)}` : null,
      },
    });

    return json({
      success: true,
      machine_ride_id: machineRideId,
      ride_value: rideValue,
      points_credited: pointsCredited ? points : 0,
      customer_found: pointsCredited,
    });
  } catch (err) {
    console.error("machine-webhook error:", err);
    logAudit(sb, "MACHINE_WEBHOOK_ERROR", { ip, details: { error: String(err) } });
    return json({ error: "Internal server error" }, 500);
  }
});
