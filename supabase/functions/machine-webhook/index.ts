import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-api-secret",
};

const logger = createEdgeLogger("machine-webhook");

const STATUS_MAP: Record<string, string> = {
  P: "PENDING",
  A: "ACCEPTED",
  S: "IN_PROGRESS",
  F: "FINALIZED",
  C: "CANCELLED",
  N: "DENIED",
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
  const details = { ...opts.details };
  if (opts.entityId) {
    details.machine_ride_id = opts.entityId;
  }
  sb.from("audit_logs")
    .insert({
      action,
      entity_type: "MACHINE_WEBHOOK",
      entity_id: null,
      scope_type: opts.brandId ? "BRAND" : null,
      scope_id: opts.brandId || null,
      ip_address: opts.ip || null,
      details_json: details,
      changes_json: opts.changes || {},
    })
    .then(({ error }) => {
      if (error) logger.error("audit_log insert error", { error });
    });
}

async function findIntegration(sb: ReturnType<typeof createClient>, req: Request, body: Record<string, unknown>) {
  const apiSecret = req.headers.get("x-api-secret") || req.headers.get("x-api-key");
  const url = new URL(req.url);
  const queryBrandId = url.searchParams.get("brand_id");
  const queryBranchId = url.searchParams.get("branch_id");
  const bodyBrandId = typeof body.brand_id === "string" ? body.brand_id : null;
  const bodyBranchId = typeof body.branch_id === "string" ? body.branch_id : null;

  // 1. Try by api_key first
  if (apiSecret) {
    const { data } = await sb
      .from("machine_integrations")
      .select("*")
      .eq("api_key", apiSecret)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  // 2. Try by brand_id + branch_id
  const brandId = bodyBrandId || queryBrandId;
  const branchId = bodyBranchId || queryBranchId;

  if (brandId && branchId) {
    const { data } = await sb
      .from("machine_integrations")
      .select("*")
      .eq("brand_id", brandId)
      .eq("branch_id", branchId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  // 3. Fallback: brand_id only — pick first active integration for this brand
  if (brandId) {
    const { data } = await sb
      .from("machine_integrations")
      .select("*")
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  // 4. Legacy: single active integration across all brands
  const { data: activeIntegrations } = await sb
    .from("machine_integrations")
    .select("*")
    .eq("is_active", true)
    .limit(2);

  if (activeIntegrations && activeIntegrations.length === 1) {
    return activeIntegrations[0];
  }

  return null;
}

async function processFinalized(
  sb: ReturnType<typeof createClient>,
  integration: any,
  brandId: string,
  branchId: string | null,
  machineRideId: string,
  ip: string
) {
  if (!integration.basic_auth_user || !integration.basic_auth_password) {
    logger.error("Missing basic auth credentials", { brandId });
    logAudit(sb, "MACHINE_RIDE_NO_CREDENTIALS", { brandId, entityId: machineRideId, ip, details: { reason: "basic_auth_empty" } });
    await sb.from("machine_rides").upsert({
      brand_id: brandId,
      branch_id: branchId,
      machine_ride_id: machineRideId,
      ride_status: "CREDENTIAL_ERROR",
      ride_value: 0,
      points_credited: 0,
      finalized_at: new Date().toISOString(),
    }, { onConflict: "brand_id,machine_ride_id", ignoreDuplicates: false });
    return { error: "Basic auth credentials not configured. Please set user/password in integration settings.", status: 400 };
  }

  const basicAuth = btoa(`${(integration.basic_auth_user || "").trim()}:${(integration.basic_auth_password || "").trim()}`);
  const machineBaseUrl = "https://api.taximachine.com.br";

  const [statusRes, receiptRes] = await Promise.all([
    fetch(`${machineBaseUrl}/api/integracao/solicitacaoStatus?id_mch=${machineRideId}`, {
      headers: { Authorization: `Basic ${basicAuth}` },
    }),
    fetch(`${machineBaseUrl}/api/integracao/recibo?id_mch=${machineRideId}`, {
      headers: { Authorization: `Basic ${basicAuth}` },
    }),
  ]);

  if (!statusRes.ok) {
    const statusBody = await statusRes.text();
    logger.error("TaxiMachine solicitacaoStatus error", { body: statusBody });
    logAudit(sb, "MACHINE_API_ERROR", { brandId, entityId: machineRideId, ip, details: { endpoint: "solicitacaoStatus", status: statusRes.status } });
    if (statusRes.status === 401) {
      return { error: "Credenciais TaxiMachine inválidas. Verifique usuário e senha na configuração da integração.", status: 400 };
    }
    return { error: "Failed to fetch ride status from TaxiMachine", status: 502 };
  }
  if (!receiptRes.ok) {
    const receiptBody = await receiptRes.text();
    logger.error("TaxiMachine recibo error", { body: receiptBody });
    logAudit(sb, "MACHINE_API_ERROR", { brandId, entityId: machineRideId, ip, details: { endpoint: "recibo", status: receiptRes.status } });
    if (receiptRes.status === 401) {
      return { error: "Credenciais TaxiMachine inválidas. Verifique usuário e senha na configuração da integração.", status: 400 };
    }
    return { error: "Failed to fetch receipt from TaxiMachine", status: 502 };
  }

  const [statusData, receiptData] = await Promise.all([statusRes.json(), receiptRes.json()]);

  const rideValue = Number(
    receiptData?.dados_solicitacao?.valor ||
    receiptData?.valor ||
    statusData?.dados_solicitacao?.valor ||
    0
  );

  if (rideValue <= 0) {
    await sb.from("machine_rides").upsert({
      brand_id: brandId,
      branch_id: branchId,
      machine_ride_id: machineRideId,
      ride_value: 0,
      ride_status: "NO_VALUE",
      points_credited: 0,
      finalized_at: new Date().toISOString(),
    }, { onConflict: "brand_id,machine_ride_id", ignoreDuplicates: false });
    logAudit(sb, "MACHINE_RIDE_NO_VALUE", { brandId, entityId: machineRideId, ip, details: { ride_value: 0 } });
    return { data: { message: "Ride has no value", machine_ride_id: machineRideId, points_credited: 0 } };
  }

  const passengerCpf = (
    statusData?.cliente?.cpf ||
    statusData?.dados_solicitacao?.cpf_passageiro ||
    receiptData?.cliente?.cpf ||
    ""
  ).replace(/\D/g, "");

  const points = Math.floor(rideValue);

  await sb.from("machine_rides").upsert({
    brand_id: brandId,
    branch_id: branchId,
    machine_ride_id: machineRideId,
    passenger_cpf: passengerCpf || null,
    ride_value: rideValue,
    ride_status: "FINALIZED",
    points_credited: points,
    finalized_at: new Date().toISOString(),
  }, { onConflict: "brand_id,machine_ride_id", ignoreDuplicates: false });

  // Credit points if CPF found
  let pointsCredited = false;
  let customerId: string | null = null;

  // Resolve the branch to use for customer creation
  const customerBranchId = branchId || integration.branch_id;

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
    } else if (customerBranchId) {
      const customerName = `Passageiro •••${passengerCpf.slice(-4)}`;
      const { data: created } = await sb
        .from("customers")
        .insert({
          brand_id: brandId,
          branch_id: customerBranchId,
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
          details: { cpf_masked: `***${passengerCpf.slice(-4)}`, branch_id: customerBranchId },
        });
      }
    } else {
      // Fallback: find first branch
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
        entry_type: "CREDIT",
        points_amount: points,
        money_amount: rideValue,
        reason: `Corrida TaxiMachine #${machineRideId} - R$ ${rideValue.toFixed(2)}`,
        reference_type: "MACHINE_RIDE",
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

  if (updateErr) logger.error("Update integration counters error", { error: updateErr });

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
      branch_id: branchId,
    },
  });

  // Insert into machine_ride_notifications for realtime dashboard
  if (pointsCredited) {
    // Fetch branch info for city name
    let resolvedCityName: string | null = null;
    if (branchId || integration.branch_id) {
      const { data: branchData } = await sb
        .from("branches")
        .select("city, state")
        .eq("id", branchId || integration.branch_id)
        .maybeSingle();
      if (branchData?.city) {
        resolvedCityName = `${branchData.city}${branchData.state ? ` - ${branchData.state}` : ""}`;
      }
    }

    // Fetch customer phone if available
    let customerPhone: string | null = null;
    let customerFullName: string | null = null;
    if (customerId) {
      const { data: custData } = await sb
        .from("customers")
        .select("name, phone")
        .eq("id", customerId)
        .maybeSingle();
      if (custData) {
        customerFullName = custData.name || null;
        customerPhone = custData.phone || null;
      }
    }

    await sb.from("machine_ride_notifications").insert({
      brand_id: brandId,
      branch_id: branchId,
      machine_ride_id: machineRideId,
      customer_name: customerFullName || (passengerCpf ? `Passageiro •••${passengerCpf.slice(-4)}` : null),
      customer_phone: customerPhone,
      customer_cpf_masked: passengerCpf ? `•••${passengerCpf.slice(-4)}` : null,
      city_name: resolvedCityName,
      points_credited: points,
      ride_value: rideValue,
      finalized_at: new Date().toISOString(),
    });

    // Send Telegram notification if chat_id configured (fire-and-forget)
    if (integration.telegram_chat_id) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        fetch(`${supabaseUrl}/functions/v1/send-telegram-ride-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            chat_id: integration.telegram_chat_id,
            customer_name: customerFullName || (passengerCpf ? `Passageiro •••${passengerCpf.slice(-4)}` : null),
            customer_phone: customerPhone,
            city_name: resolvedCityName,
            ride_value: rideValue,
            points_credited: points,
            finalized_at: new Date().toISOString(),
            machine_ride_id: machineRideId,
          }),
        }).catch((e) => logger.error("Telegram notification error", { error: String(e) }));
      } catch (e) {
        logger.error("Telegram notification setup error", { error: String(e) });
      }
    }
  }

  // Fire callback URL if configured (fire-and-forget)
  if (pointsCredited && integration.callback_url) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      fetch(integration.callback_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          event: "points_credited",
          machine_ride_id: machineRideId,
          ride_value: rideValue,
          points,
          cpf_masked: passengerCpf ? `***${passengerCpf.slice(-4)}` : null,
          customer_id: customerId,
          brand_id: brandId,
          branch_id: branchId,
          timestamp: new Date().toISOString(),
        }),
      })
        .then(() => clearTimeout(timeout))
        .catch((e) => {
          clearTimeout(timeout);
          logger.error("Callback URL error", { url: integration.callback_url, error: String(e) });
        });
    } catch (e) {
      logger.error("Callback URL setup error", { error: String(e) });
    }
  }

  return {
    data: {
      success: true,
      machine_ride_id: machineRideId,
      ride_value: rideValue,
      points_credited: pointsCredited ? points : 0,
      customer_found: pointsCredited,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") || "unknown";

  // Rate limiting
  const rlKey = rateLimitKey("machine-webhook", req);
  const rlResult = await checkRateLimit(sb, rlKey, { maxRequests: 30, windowSeconds: 60 });
  if (!rlResult.allowed) {
    logAudit(sb, "MACHINE_RATE_LIMITED", { ip, details: { reason: "rate_limit" } });
    return rateLimitResponse(rlResult, corsHeaders);
  }

  try {
    const body = await req.json();
    const { request_id, status_code } = body;

    if (!request_id || !status_code) {
      logAudit(sb, "MACHINE_WEBHOOK_REJECTED", { ip, details: { reason: "missing_fields", request_id, status_code } });
      return json({ error: "Missing request_id or status_code" }, 400);
    }

    // Find integration
    const integration = await findIntegration(sb, req, body);
    if (!integration) {
      logAudit(sb, "MACHINE_WEBHOOK_AUTH_FAILED", { ip, details: { request_id, reason: "integration_not_found" } });
      return json({ error: "Integration not found or inactive" }, 401);
    }

    const brandId = integration.brand_id;
    const branchId = integration.branch_id || null;
    const machineRideId = String(request_id);
    const mappedStatus = STATUS_MAP[status_code] || status_code;

    // Update last_webhook_at
    sb.from("machine_integrations")
      .update({ last_webhook_at: new Date().toISOString() })
      .eq("id", integration.id)
      .then();

    // 1. Always log the event for real-time tracking
    await sb.from("machine_ride_events").insert({
      brand_id: brandId,
      machine_ride_id: machineRideId,
      status_code,
      raw_payload: body,
      ip_address: ip,
    });

    logAudit(sb, "MACHINE_WEBHOOK_RECEIVED", { brandId, entityId: machineRideId, ip, details: { status_code, mapped: mappedStatus, branch_id: branchId } });

    // 2. Upsert ride status (for non-finalized, just track status)
    if (status_code !== "F") {
      await sb.from("machine_rides").upsert({
        brand_id: brandId,
        branch_id: branchId,
        machine_ride_id: machineRideId,
        ride_status: mappedStatus,
        ride_value: 0,
        points_credited: 0,
      }, { onConflict: "brand_id,machine_ride_id", ignoreDuplicates: false });

      return json({
        success: true,
        machine_ride_id: machineRideId,
        status: mappedStatus,
        message: "Event recorded",
      });
    }

    // 3. Finalized ride — full processing with points
    // Anti-duplication check
    const { data: existing } = await sb
      .from("machine_rides")
      .select("id, ride_status")
      .eq("brand_id", brandId)
      .eq("machine_ride_id", machineRideId)
      .maybeSingle();

    if (existing?.ride_status === "FINALIZED") {
      logAudit(sb, "MACHINE_RIDE_DUPLICATE", { brandId, entityId: machineRideId, ip, details: { reason: "already_finalized" } });
      return json({ message: "Ride already processed", machine_ride_id: machineRideId });
    }

    const result = await processFinalized(sb, integration, brandId, branchId, machineRideId, ip);
    if (result.error) {
      return json({ error: result.error }, result.status);
    }
    return json(result.data!);
  } catch (err) {
    logger.error("machine-webhook error", { error: String(err) });
    logAudit(sb, "MACHINE_WEBHOOK_ERROR", { ip, details: { error: String(err) } });
    return json({ error: "Internal server error" }, 500);
  }
});
