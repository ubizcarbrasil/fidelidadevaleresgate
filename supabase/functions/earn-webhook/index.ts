import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    null
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = getClientIp(req);

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return json({ ok: false, error: "Missing x-api-key header" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceRoleKey);

  // Helper to log audit events (fire-and-forget)
  function logAudit(
    action: string,
    opts: {
      brandId?: string;
      entityId?: string;
      details?: Record<string, unknown>;
      changes?: Record<string, unknown>;
    } = {}
  ) {
    sb.from("audit_logs")
      .insert({
        action,
        entity_type: "EARN_WEBHOOK",
        entity_id: opts.entityId || null,
        scope_type: opts.brandId ? "BRAND" : null,
        scope_id: opts.brandId || null,
        ip_address: clientIp,
        details_json: opts.details || {},
        changes_json: opts.changes || {},
      })
      .then(({ error }) => {
        if (error) console.error("audit_log insert error:", error);
      });
  }

  // 1. Validate API key
  const keyHash = await sha256(apiKey);
  const { data: keyRow, error: keyErr } = await sb
    .from("brand_api_keys")
    .select("id, brand_id, is_active")
    .eq("api_key_hash", keyHash)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (keyErr || !keyRow) {
    logAudit("EARN_WEBHOOK_AUTH_FAILED", {
      details: { reason: "Invalid or inactive API key", key_prefix: apiKey.substring(0, 11) },
    });
    return json({ ok: false, error: "Invalid or inactive API key" }, 403);
  }

  // Update last_used_at (fire-and-forget)
  sb.from("brand_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id).then();

  const brandId = keyRow.brand_id;

  // 2. Parse body
  let body: { cpf?: string; store_id?: string; purchase_value?: number; receipt_code?: string };
  try {
    body = await req.json();
  } catch {
    logAudit("EARN_WEBHOOK_REJECTED", {
      brandId,
      details: { reason: "Invalid JSON body", api_key_id: keyRow.id },
    });
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const { cpf, store_id, purchase_value, receipt_code } = body;
  if (!cpf || !store_id || !purchase_value || typeof purchase_value !== "number" || purchase_value <= 0) {
    logAudit("EARN_WEBHOOK_REJECTED", {
      brandId,
      details: { reason: "Missing required fields", payload: { cpf: !!cpf, store_id: !!store_id, purchase_value }, api_key_id: keyRow.id },
    });
    return json({ ok: false, error: "Required fields: cpf (string), store_id (uuid), purchase_value (number > 0)" }, 400);
  }

  // Sanitize CPF (digits only)
  const cleanCpf = cpf.replace(/\D/g, "");
  if (cleanCpf.length < 11 || cleanCpf.length > 14) {
    logAudit("EARN_WEBHOOK_REJECTED", {
      brandId,
      details: { reason: "Invalid CPF format", cpf_length: cleanCpf.length, api_key_id: keyRow.id },
    });
    return json({ ok: false, error: "Invalid CPF format" }, 400);
  }

  // 3. Validate store belongs to brand
  const { data: store, error: storeErr } = await sb
    .from("stores")
    .select("id, name, branch_id, brand_id, is_active")
    .eq("id", store_id)
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .maybeSingle();

  if (storeErr || !store) {
    logAudit("EARN_WEBHOOK_REJECTED", {
      brandId,
      details: { reason: "Store not found or inactive", store_id, api_key_id: keyRow.id },
    });
    return json({ ok: false, error: "Store not found or inactive for this brand" }, 404);
  }

  // 4. Find customer by CPF + brand
  const { data: customer, error: custErr } = await sb
    .from("customers")
    .select("id, name, points_balance, money_balance, branch_id")
    .eq("brand_id", brandId)
    .eq("cpf", cleanCpf)
    .eq("is_active", true)
    .maybeSingle();

  if (custErr || !customer) {
    logAudit("EARN_WEBHOOK_REJECTED", {
      brandId,
      details: { reason: "Customer not found", cpf_masked: `***${cleanCpf.slice(-4)}`, store_id, api_key_id: keyRow.id },
    });
    return json({ ok: false, error: "Customer not found for this CPF" }, 404);
  }

  // 5. Get active points rule
  const { data: rules } = await sb
    .from("points_rules")
    .select("*")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .or(`branch_id.eq.${store.branch_id},branch_id.is.null`)
    .order("branch_id", { ascending: false, nullsFirst: false })
    .limit(1);

  const rule = rules?.[0];
  if (!rule) {
    logAudit("EARN_WEBHOOK_REJECTED", {
      brandId,
      details: { reason: "No active points rule", store_id, api_key_id: keyRow.id },
    });
    return json({ ok: false, error: "No active points rule for this brand/branch" }, 422);
  }

  // 5b. Check store custom rule if allowed
  let effectivePointsPerReal = Number(rule.points_per_real);
  if (rule.allow_store_custom_rule) {
    const now = new Date().toISOString();
    const { data: storeRules } = await sb
      .from("store_points_rules")
      .select("points_per_real")
      .eq("store_id", store_id)
      .eq("status", "ACTIVE")
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order("created_at", { ascending: false })
      .limit(1);
    const sr = storeRules?.[0];
    if (sr) {
      effectivePointsPerReal = Math.min(
        Math.max(Number(sr.points_per_real), Number(rule.store_points_per_real_min)),
        Number(rule.store_points_per_real_max)
      );
    }
  }

  // 6. Min purchase check
  if (purchase_value < Number(rule.min_purchase_to_earn)) {
    logAudit("EARN_WEBHOOK_REJECTED", {
      brandId,
      details: { reason: "Below minimum purchase", purchase_value, min_required: Number(rule.min_purchase_to_earn), store_id, customer_id: customer.id, api_key_id: keyRow.id },
    });
    return json({
      ok: false,
      error: `Minimum purchase is R$ ${Number(rule.min_purchase_to_earn).toFixed(2)}`,
    }, 422);
  }

  // 7. Calculate points
  let points = 0;
  if (rule.rule_type === "PER_REAL") {
    points = Math.floor(purchase_value * effectivePointsPerReal);
  } else if (rule.rule_type === "FIXED") {
    points = Number(rule.points_per_real);
  }
  points = Math.min(points, rule.max_points_per_purchase);
  const money = points * Number(rule.money_per_point);

  // 8. Anti-fraud checks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Customer daily limit
  const { data: custToday } = await sb
    .from("earning_events")
    .select("points_earned")
    .eq("customer_id", customer.id)
    .eq("status", "APPROVED")
    .gte("created_at", todayISO);
  const custDayTotal = (custToday || []).reduce((s: number, e: any) => s + e.points_earned, 0);
  if (custDayTotal + points > rule.max_points_per_customer_per_day) {
    logAudit("EARN_WEBHOOK_ANTIFRAUD", {
      brandId,
      details: { reason: "Customer daily limit reached", customer_id: customer.id, day_total: custDayTotal, attempted: points, limit: rule.max_points_per_customer_per_day, store_id, api_key_id: keyRow.id },
    });
    return json({ ok: false, error: "Customer daily points limit reached" }, 429);
  }

  // Store daily limit
  const { data: storeToday } = await sb
    .from("earning_events")
    .select("points_earned")
    .eq("store_id", store_id)
    .eq("status", "APPROVED")
    .gte("created_at", todayISO);
  const storeDayTotal = (storeToday || []).reduce((s: number, e: any) => s + e.points_earned, 0);
  if (storeDayTotal + points > rule.max_points_per_store_per_day) {
    logAudit("EARN_WEBHOOK_ANTIFRAUD", {
      brandId,
      details: { reason: "Store daily limit reached", store_id, day_total: storeDayTotal, attempted: points, limit: rule.max_points_per_store_per_day, api_key_id: keyRow.id },
    });
    return json({ ok: false, error: "Store daily points limit reached" }, 429);
  }

  // Receipt uniqueness
  if (receipt_code) {
    const { data: existing } = await sb
      .from("earning_events")
      .select("id")
      .eq("store_id", store_id)
      .eq("receipt_code", receipt_code)
      .limit(1);
    if (existing && existing.length > 0) {
      logAudit("EARN_WEBHOOK_ANTIFRAUD", {
        brandId,
        details: { reason: "Duplicate receipt code", receipt_code, store_id, api_key_id: keyRow.id },
      });
      return json({ ok: false, error: "Receipt code already used for this store" }, 409);
    }
  } else if (rule.require_receipt_code) {
    logAudit("EARN_WEBHOOK_REJECTED", {
      brandId,
      details: { reason: "Receipt code required but missing", store_id, api_key_id: keyRow.id },
    });
    return json({ ok: false, error: "Receipt code is required" }, 400);
  }

  // 9. Insert earning_event
  const branchId = store.branch_id;
  const ruleSnapshot = {
    points_per_real: effectivePointsPerReal,
    rule_type: rule.rule_type,
    money_per_point: rule.money_per_point,
    source: "API",
  };

  const { data: event, error: eventErr } = await sb
    .from("earning_events")
    .insert({
      brand_id: brandId,
      branch_id: branchId,
      store_id: store_id,
      customer_id: customer.id,
      purchase_value,
      receipt_code: receipt_code || null,
      points_earned: points,
      money_earned: money,
      source: "API",
      created_by_user_id: keyRow.id,
      status: "APPROVED",
      rule_snapshot_json: ruleSnapshot,
    })
    .select("id")
    .single();

  if (eventErr) {
    console.error("earning_events insert error:", eventErr);
    logAudit("EARN_WEBHOOK_ERROR", {
      brandId,
      details: { reason: "earning_events insert failed", error: eventErr.message, store_id, customer_id: customer.id, api_key_id: keyRow.id },
    });
    return json({ ok: false, error: "Failed to create earning event" }, 500);
  }

  // 10. Insert ledger entry
  const { error: ledgerErr } = await sb.from("points_ledger").insert({
    brand_id: brandId,
    branch_id: branchId,
    customer_id: customer.id,
    entry_type: "CREDIT",
    points_amount: points,
    money_amount: money,
    reason: `API: Compra no parceiro ${store.name}`,
    reference_type: "EARNING_EVENT",
    reference_id: event.id,
    created_by_user_id: keyRow.id,
  });

  if (ledgerErr) {
    console.error("points_ledger insert error:", ledgerErr);
  }

  // 11. Update customer balance
  const newPoints = Number(customer.points_balance) + points;
  const newMoney = Number(customer.money_balance) + money;
  await sb
    .from("customers")
    .update({ points_balance: newPoints, money_balance: newMoney })
    .eq("id", customer.id);

  // 12. Ganha-Ganha billing (fire-and-forget)
  try {
    const { data: ggConfig } = await sb
      .from("ganha_ganha_config")
      .select("is_active, fee_mode, fee_per_point_earned")
      .eq("brand_id", brandId)
      .maybeSingle();

    if (ggConfig?.is_active) {
      let feePerPoint = Number(ggConfig.fee_per_point_earned);
      if (ggConfig.fee_mode === "CUSTOM") {
        const { data: storeFee } = await sb
          .from("ganha_ganha_store_fees")
          .select("fee_per_point_earned")
          .eq("store_id", store_id)
          .eq("brand_id", brandId)
          .maybeSingle();
        if (storeFee) feePerPoint = Number(storeFee.fee_per_point_earned);
      }
      await sb.from("ganha_ganha_billing_events").insert({
        brand_id: brandId,
        store_id: store_id,
        event_type: "EARN",
        points_amount: points,
        fee_per_point: feePerPoint,
        fee_total: points * feePerPoint,
        reference_id: event.id,
        reference_type: "EARNING_EVENT",
      });
    }
  } catch (e) {
    console.error("GG billing error (non-fatal):", e);
  }

  // 13. Audit log — success
  logAudit("EARN_WEBHOOK_SUCCESS", {
    brandId,
    entityId: event.id,
    details: {
      api_key_id: keyRow.id,
      store_id,
      store_name: store.name,
      customer_id: customer.id,
      customer_name: customer.name,
      purchase_value,
      receipt_code: receipt_code || null,
    },
    changes: {
      points_earned: points,
      money_earned: money,
      new_balance: newPoints,
    },
  });

  return json({
    ok: true,
    data: {
      earning_event_id: event.id,
      points_earned: points,
      money_earned: money,
      new_balance: newPoints,
      customer_name: customer.name,
    },
  });
});
