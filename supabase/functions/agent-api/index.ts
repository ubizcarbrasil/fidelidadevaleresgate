import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const logger = createEdgeLogger("agent-api");

// ── CORS ────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Auth helper ─────────────────────────────────────────────────────────
function requireAgentAuth(req: Request): Response | null {
  const secret = Deno.env.get("AGENT_SECRET");
  if (!secret) return json(500, { ok: false, error: "Server misconfigured" });

  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth || auth !== `Bearer ${secret}`) {
    return json(401, { ok: false, error: "Unauthorized" });
  }
  return null; // auth OK
}

// ── Supabase client (SERVICE_ROLE – bypasses RLS) ───────────────────────
function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// ── Route matching helpers ──────────────────────────────────────────────
function parsePath(url: string): string[] {
  const u = new URL(url);
  // Edge function path: /agent-api/stores/xxx → segments = ["stores","xxx"]
  const parts = u.pathname.replace(/^\/agent-api\/?/, "").split("/").filter(Boolean);
  return parts;
}

function getQuery(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

// ── Pagination helper ───────────────────────────────────────────────────
function applyPagination(
  query: any,
  params: URLSearchParams,
  defaultLimit = 20,
) {
  const limit = Math.min(Number(params.get("limit") || defaultLimit), 100);
  const cursor = params.get("cursor");
  let q = query.order("id", { ascending: true }).limit(limit);
  if (cursor) q = q.gt("id", cursor);
  return { q, limit };
}

function paginatedResult(data: any[], limit: number) {
  const next_cursor =
    data.length === limit ? data[data.length - 1].id : null;
  return { items: data, next_cursor };
}

// ═════════════════════════════════════════════════════════════════════════
// ROUTE HANDLERS
// ═════════════════════════════════════════════════════════════════════════

// 14) GET /health
function handleHealth() {
  return json(200, { ok: true, data: { status: "up", ts: new Date().toISOString() } });
}

// 15) GET /me  (stub – AGENT_SECRET has no user context)
function handleMe() {
  return json(501, {
    ok: false,
    error: "Not Implemented",
    details: {
      missing:
        "AGENT_SECRET is a machine token with no tenant/brand/role context. Use /stores and /offers endpoints directly.",
    },
  });
}

// ── 1) GET /stores ──────────────────────────────────────────────────────
async function listStores(params: URLSearchParams) {
  const sb = getSupabase();
  let query = sb.from("stores").select("*");

  const q = params.get("q");
  if (q) query = query.ilike("name", `%${q}%`);

  const isActive = params.get("is_active");
  if (isActive !== null && isActive !== undefined && isActive !== "") {
    query = query.eq("is_active", isActive === "true");
  }

  const { q: pq, limit } = applyPagination(query, params);
  const { data, error } = await pq;
  if (error) return json(500, { ok: false, error: "Internal error", details: { message: error.message, hint: error.hint } });
  return json(200, { ok: true, data: paginatedResult(data ?? [], limit) });
}

// ── 2) GET /stores/:id ─────────────────────────────────────────────────
async function getStore(storeId: string) {
  const sb = getSupabase();
  const { data, error } = await sb.from("stores").select("*").eq("id", storeId).maybeSingle();
  if (error) return json(500, { ok: false, error: "Internal error", details: { message: error.message } });
  if (!data) return json(404, { ok: false, error: "Not Found" });
  return json(200, { ok: true, data });
}

// ── 3) GET /offers ──────────────────────────────────────────────────────
async function listOffers(params: URLSearchParams) {
  const storeId = params.get("store_id");
  if (!storeId) return json(400, { ok: false, error: "Bad Request", details: { store_id: "required" } });

  const sb = getSupabase();
  let query = sb.from("offers").select("*").eq("store_id", storeId);

  const status = params.get("status");
  if (status) query = query.eq("status", status.toUpperCase());

  const q = params.get("q");
  if (q) query = query.ilike("title", `%${q}%`);

  const { q: pq, limit } = applyPagination(query, params);
  const { data, error } = await pq;
  if (error) return json(500, { ok: false, error: "Internal error", details: { message: error.message } });
  return json(200, { ok: true, data: paginatedResult(data ?? [], limit) });
}

// ── 4) POST /offers ─────────────────────────────────────────────────────
async function createOffer(body: any) {
  const required = ["store_id", "brand_id", "branch_id", "title"];
  const missing: Record<string, string> = {};
  for (const k of required) {
    if (!body[k]) missing[k] = "required";
  }
  if (Object.keys(missing).length) return json(400, { ok: false, error: "Bad Request", details: missing });

  const sb = getSupabase();
  const row = {
    store_id: body.store_id,
    brand_id: body.brand_id,
    branch_id: body.branch_id,
    title: body.title,
    description: body.description ?? null,
    coupon_type: (body.coupon_type ?? "STORE").toUpperCase(),
    discount_percent: body.discount_percent ?? 0,
    value_rescue: body.value_rescue ?? 0,
    allowed_weekdays: body.allowed_weekdays ?? [0, 1, 2, 3, 4, 5, 6],
    status: (body.status ?? "DRAFT").toUpperCase(),
    is_active: (body.status ?? "DRAFT").toUpperCase() === "ACTIVE",
    image_url: body.image_url ?? null,
  };

  const { data, error } = await sb.from("offers").insert(row).select().single();
  if (error) return json(500, { ok: false, error: "Internal error", details: { message: error.message, hint: error.hint } });
  return json(201, { ok: true, data });
}

// ── 5) PATCH /offers/:id ────────────────────────────────────────────────
async function updateOffer(offerId: string, body: any) {
  const allowed = [
    "title", "description", "coupon_type", "discount_percent",
    "value_rescue", "allowed_weekdays", "status", "is_active",
    "image_url", "end_at", "start_at", "min_purchase",
    "max_daily_redemptions", "max_total_uses", "max_uses_per_customer",
    "coupon_category", "allowed_hours", "redemption_type",
  ];
  const updates: Record<string, unknown> = {};
  for (const k of allowed) {
    if (body[k] !== undefined) {
      updates[k] = k === "coupon_type" || k === "status"
        ? String(body[k]).toUpperCase()
        : body[k];
    }
  }
  if (!Object.keys(updates).length) return json(400, { ok: false, error: "Bad Request", details: { message: "No valid fields to update" } });

  const sb = getSupabase();
  const { data, error } = await sb.from("offers").update(updates).eq("id", offerId).select().single();
  if (error) return json(500, { ok: false, error: "Internal error", details: { message: error.message } });
  if (!data) return json(404, { ok: false, error: "Not Found" });
  return json(200, { ok: true, data });
}

// ── 6) PATCH /offers/:id/status ─────────────────────────────────────────
async function toggleOfferStatus(offerId: string, body: any) {
  const status = (body.status ?? "").toUpperCase();
  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    return json(400, { ok: false, error: "Bad Request", details: { status: "must be 'active' or 'inactive'" } });
  }
  const sb = getSupabase();
  const updates = { status, is_active: status === "ACTIVE" };
  const { data, error } = await sb.from("offers").update(updates).eq("id", offerId).select("id,status,is_active").single();
  if (error) return json(500, { ok: false, error: "Internal error", details: { message: error.message } });
  if (!data) return json(404, { ok: false, error: "Not Found" });
  return json(200, { ok: true, data });
}

// ── 7) POST /coupons ────────────────────────────────────────────────────
async function createCoupon(body: any) {
  const required = ["store_id", "type", "value"];
  const missing: Record<string, string> = {};
  for (const k of required) {
    if (body[k] === undefined || body[k] === null) missing[k] = "required";
  }
  if (!body.expires_at && !body.expires_in_hours) {
    missing.expires_at = "expires_at or expires_in_hours required";
  }
  if (Object.keys(missing).length) return json(400, { ok: false, error: "Bad Request", details: missing });

  // Resolve expiration
  let expiresAt: string;
  if (body.expires_at) {
    expiresAt = body.expires_at;
  } else {
    const d = new Date();
    d.setHours(d.getHours() + Number(body.expires_in_hours));
    expiresAt = d.toISOString();
  }

  // Resolve brand_id and branch_id from store if not provided
  let brandId = body.brand_id;
  let branchId = body.branch_id;
  if (!brandId || !branchId) {
    const sb = getSupabase();
    const { data: store } = await sb.from("stores").select("brand_id,branch_id").eq("id", body.store_id).single();
    if (store) {
      brandId = brandId || store.brand_id;
      branchId = branchId || store.branch_id;
    }
  }
  if (!brandId || !branchId) {
    return json(400, { ok: false, error: "Bad Request", details: { message: "Could not resolve brand_id/branch_id from store" } });
  }

  const sb = getSupabase();
  const row = {
    store_id: body.store_id,
    brand_id: brandId,
    branch_id: branchId,
    offer_id: body.offer_id ?? null,
    type: String(body.type).toUpperCase(),
    value: Number(body.value),
    expires_at: expiresAt,
  };

  const { data, error } = await sb.from("coupons").insert(row).select().single();
  if (error) return json(500, { ok: false, error: "Internal error", details: { message: error.message, hint: error.hint } });
  return json(201, { ok: true, data });
}

// ── 8) GET /coupons ─────────────────────────────────────────────────────
async function listCoupons(params: URLSearchParams) {
  const storeId = params.get("store_id");
  if (!storeId) return json(400, { ok: false, error: "Bad Request", details: { store_id: "required" } });

  const sb = getSupabase();
  let query = sb.from("coupons").select("*").eq("store_id", storeId);

  const status = params.get("status");
  if (status) query = query.eq("status", status.toUpperCase());
  const type = params.get("type");
  if (type) query = query.eq("type", type.toUpperCase());

  const { q: pq, limit } = applyPagination(query, params);
  const { data, error } = await pq;
  if (error) return json(500, { ok: false, error: "Internal error", details: { message: error.message } });
  return json(200, { ok: true, data: paginatedResult(data ?? [], limit) });
}

// ── 9) PATCH /coupons/:id/status ────────────────────────────────────────
async function toggleCouponStatus(couponId: string, body: any) {
  const status = (body.status ?? "").toUpperCase();
  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    return json(400, { ok: false, error: "Bad Request", details: { status: "must be 'active' or 'inactive'" } });
  }
  const sb = getSupabase();
  const { data, error } = await sb.from("coupons").update({ status }).eq("id", couponId).select("id,status,code").single();
  if (error) return json(500, { ok: false, error: "Internal error", details: { message: error.message } });
  if (!data) return json(404, { ok: false, error: "Not Found" });
  return json(200, { ok: true, data });
}

// ── 10) POST /redemptions ───────────────────────────────────────────────
async function validateRedemption(body: any) {
  const required = ["brand_id", "branch_id", "store_id", "customer_cpf", "pin"];
  const missing: Record<string, string> = {};
  for (const k of required) {
    if (!body[k]) missing[k] = "required";
  }
  if (!body.offer_id && !body.coupon_id) missing.offer_id = "offer_id or coupon_id required";
  if (Object.keys(missing).length) return json(400, { ok: false, error: "Bad Request", details: missing });

  const sb = getSupabase();

  // Find customer by CPF
  const { data: customer, error: custErr } = await sb
    .from("customers")
    .select("id,name,points_balance,money_balance")
    .eq("cpf", body.customer_cpf)
    .eq("brand_id", body.brand_id)
    .maybeSingle();

  if (custErr) return json(500, { ok: false, error: "Internal error", details: { message: custErr.message } });
  if (!customer) return json(404, { ok: false, error: "Not Found", details: { message: "Customer not found for this CPF" } });

  // Find PENDING redemption by PIN (token)
  let rdQuery = sb
    .from("redemptions")
    .select("*")
    .eq("token", body.pin)
    .eq("status", "PENDING")
    .eq("customer_id", customer.id);

  if (body.offer_id) rdQuery = rdQuery.eq("offer_id", body.offer_id);

  const { data: redemption, error: rdErr } = await rdQuery.maybeSingle();
  if (rdErr) return json(500, { ok: false, error: "Internal error", details: { message: rdErr.message } });
  if (!redemption) {
    return json(404, { ok: false, error: "Not Found", details: { message: "No pending redemption found for this PIN" } });
  }

  // Check expiration
  if (redemption.expires_at && new Date(redemption.expires_at) < new Date()) {
    await sb.from("redemptions").update({ status: "EXPIRED" }).eq("id", redemption.id);
    return json(400, { ok: false, error: "Bad Request", details: { message: "Redemption PIN has expired" } });
  }

  // Mark as USED
  const { data: updated, error: updErr } = await sb
    .from("redemptions")
    .update({
      status: "USED",
      used_at: new Date().toISOString(),
      purchase_value: body.purchase_value ?? null,
    })
    .eq("id", redemption.id)
    .select()
    .single();

  if (updErr) return json(500, { ok: false, error: "Internal error", details: { message: updErr.message } });
  return json(200, { ok: true, data: { redemption: updated, customer: { id: customer.id, name: customer.name } } });
}

// ── 11) GET /redemptions ────────────────────────────────────────────────
async function listRedemptions(params: URLSearchParams) {
  const storeId = params.get("store_id");
  if (!storeId) return json(400, { ok: false, error: "Bad Request", details: { store_id: "required" } });

  const sb = getSupabase();
  // redemptions don't have store_id directly; join via offer
  let query = sb
    .from("redemptions")
    .select("*, offers!inner(store_id,title)")
    .eq("offers.store_id", storeId);

  const cpf = params.get("cpf");
  if (cpf) query = query.eq("customer_cpf", cpf);

  const dateFrom = params.get("date_from");
  if (dateFrom) query = query.gte("created_at", dateFrom);

  const dateTo = params.get("date_to");
  if (dateTo) query = query.lte("created_at", dateTo);

  const { q: pq, limit } = applyPagination(query, params);
  const { data, error } = await pq;
  if (error) return json(500, { ok: false, error: "Internal error", details: { message: error.message, hint: error.hint } });
  return json(200, { ok: true, data: paginatedResult(data ?? [], limit) });
}

// ── Tier classification helper ──────────────────────────────────────────
const DEFAULT_TIERS = [
  { name: "INICIANTE", min_events: 0, max_events: 0 },
  { name: "BRONZE", min_events: 1, max_events: 10 },
  { name: "PRATA", min_events: 11, max_events: 30 },
  { name: "OURO", min_events: 31, max_events: 50 },
  { name: "DIAMANTE", min_events: 51, max_events: 100 },
  { name: "LENDARIO", min_events: 101, max_events: 500 },
  { name: "GALATICO", min_events: 501, max_events: null },
];

function classifyTier(rideCount: number, tiers: typeof DEFAULT_TIERS = DEFAULT_TIERS): string {
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (rideCount >= tiers[i].min_events) return tiers[i].name;
  }
  return "INICIANTE";
}

function getTierInfo(tierName: string, tiers: typeof DEFAULT_TIERS = DEFAULT_TIERS) {
  return tiers.find((t) => t.name === tierName) ?? tiers[0];
}

// ── 12) GET /customers ──────────────────────────────────────────────────
async function findCustomerByCpf(params: URLSearchParams) {
  const cpf = params.get("cpf");
  if (!cpf) return json(400, { ok: false, error: "Bad Request", details: { cpf: "required" } });

  const sb = getSupabase();
  const { data, error } = await sb
    .from("customers")
    .select("id,name,cpf,phone,points_balance,money_balance,brand_id,branch_id,is_active,created_at,customer_tier,ride_count")
    .eq("cpf", cpf);

  if (error) return json(500, { ok: false, error: "Internal error", details: { message: error.message } });
  if (!data || data.length === 0) return json(404, { ok: false, error: "Not Found" });

  // Enrich with tier_info
  const enriched = data.map((c: any) => ({
    ...c,
    tier_info: getTierInfo(c.customer_tier ?? "INICIANTE"),
  }));

  return json(200, { ok: true, data: enriched.length === 1 ? enriched[0] : enriched });
}

// ── 13) GET /customers/:id/points-ledger ────────────────────────────────
async function getPointsLedger(customerId: string, params: URLSearchParams) {
  const sb = getSupabase();
  let query = sb.from("points_ledger").select("*").eq("customer_id", customerId);

  const dateFrom = params.get("date_from");
  if (dateFrom) query = query.gte("created_at", dateFrom);
  const dateTo = params.get("date_to");
  if (dateTo) query = query.lte("created_at", dateTo);

  const { q: pq, limit } = applyPagination(query, params);
  const { data, error } = await pq;
  if (error) return json(500, { ok: false, error: "Internal error", details: { message: error.message } });
  return json(200, { ok: true, data: paginatedResult(data ?? [], limit) });
}

// ═════════════════════════════════════════════════════════════════════════
// MAIN ROUTER
// ═════════════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Auth gate
  const authErr = requireAgentAuth(req);
  if (authErr) return authErr;

  // Rate limiting: 100 requests per 60s per IP
  const rlSb = getSupabase();
  const rlKey = rateLimitKey("agent-api", req);
  const rl = await checkRateLimit(rlSb, rlKey, { maxRequests: 100, windowSeconds: 60 });
  if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);

  const segments = parsePath(req.url);
  const method = req.method;
  const params = getQuery(req.url);

  try {
    // ── health ────────────────────────────────
    if (segments[0] === "health" && method === "GET") {
      return handleHealth();
    }

    // ── me ────────────────────────────────────
    if (segments[0] === "me" && method === "GET") {
      return handleMe();
    }

    // ── stores ────────────────────────────────
    if (segments[0] === "stores") {
      if (method === "GET" && segments.length === 1) return await listStores(params);
      if (method === "GET" && segments.length === 2) return await getStore(segments[1]);
    }

    // ── offers ────────────────────────────────
    if (segments[0] === "offers") {
      if (method === "GET" && segments.length === 1) return await listOffers(params);
      if (method === "POST" && segments.length === 1) {
        const body = await req.json();
        return await createOffer(body);
      }
      if (method === "PATCH" && segments.length === 3 && segments[2] === "status") {
        const body = await req.json();
        return await toggleOfferStatus(segments[1], body);
      }
      if (method === "PATCH" && segments.length === 2) {
        const body = await req.json();
        return await updateOffer(segments[1], body);
      }
    }

    // ── coupons ───────────────────────────────
    if (segments[0] === "coupons") {
      if (method === "GET" && segments.length === 1) return await listCoupons(params);
      if (method === "POST" && segments.length === 1) {
        const body = await req.json();
        return await createCoupon(body);
      }
      if (method === "PATCH" && segments.length === 3 && segments[2] === "status") {
        const body = await req.json();
        return await toggleCouponStatus(segments[1], body);
      }
    }

    // ── redemptions ───────────────────────────
    if (segments[0] === "redemptions") {
      if (method === "GET" && segments.length === 1) return await listRedemptions(params);
      if (method === "POST" && segments.length === 1) {
        const body = await req.json();
        return await validateRedemption(body);
      }
    }

    // ── customers ─────────────────────────────
    if (segments[0] === "customers") {
      if (method === "GET" && segments.length === 1) return await findCustomerByCpf(params);
      if (method === "GET" && segments.length === 3 && segments[2] === "points-ledger") {
        return await getPointsLedger(segments[1], params);
      }
    }

    // ── 404 fallback ──────────────────────────
    return json(404, { ok: false, error: "Not Found", details: { path: `/${segments.join("/")}`, method } });
  } catch (err) {
    logger.error("Unhandled error", { error: String(err) });
    return json(500, { ok: false, error: "Internal error", details: { message: String(err) } });
  }
});
