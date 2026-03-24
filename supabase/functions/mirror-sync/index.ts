import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------- helpers ----------

function cleanPrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d,\.]/g, "").replace(",", ".");
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function extractSitename(originUrl: string): string {
  try {
    const u = new URL(originUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[0] || "ubizresgata";
  } catch {
    return "ubizresgata";
  }
}

// ---------- API-based product fetching ----------

interface ApiProduct {
  id: number;
  attributes: {
    title: string;
    image: string | null;
    price: string | null;
    price_from: string | null;
    link: string | null;
    uuid: string;
    seller: string | null;
    coupon: string | null;
    free_shipping: boolean | null;
    installment: string | null;
    category: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    description: string | null;
    store_image: string | null;
  };
}

interface SyncResult {
  slug: string;
  title: string;
  action: "created" | "updated" | "skipped" | "error";
  error?: string;
}

// ---------- main handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { brand_id, mode } = body;
    const isDiagnose = mode === "diagnose";

    // Handle auto-sync from cron
    if (brand_id === "auto") {
      const { data: configs } = await supabase
        .from("mirror_sync_config")
        .select("brand_id")
        .eq("auto_sync_enabled", true);

      const results = [];
      for (const cfg of configs || []) {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/mirror-sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
            body: JSON.stringify({ brand_id: cfg.brand_id }),
          });
          const data = await res.json();
          results.push({ brand_id: cfg.brand_id, ...data });
        } catch (e: any) {
          results.push({ brand_id: cfg.brand_id, error: e.message });
        }
      }
      return new Response(
        JSON.stringify({ success: true, auto_sync: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!brand_id) {
      return new Response(
        JSON.stringify({ success: false, error: "brand_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const startedAt = new Date().toISOString();

    // Load config
    const { data: config } = await supabase
      .from("mirror_sync_config")
      .select("*")
      .eq("brand_id", brand_id)
      .single();

    const originUrl = config?.origin_url || "https://www.divulgadorinteligente.com/ubizresgata";
    const autoActivate = config?.auto_activate !== false;
    const autoVisibleDriver = config?.auto_visible_driver !== false;
    const sitename = extractSitename(originUrl);

    // ========== Fetch products from API ==========
    const apiUrl = `https://api.divulgadorinteligente.com/api/products?sitename=${sitename}&limit=500`;
    console.log(`[API] Fetching products from: ${apiUrl}`);

    const apiStart = Date.now();
    const apiResponse = await fetch(apiUrl);
    const apiDurationMs = Date.now() - apiStart;

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      throw new Error(`API returned ${apiResponse.status}: ${errText.substring(0, 200)}`);
    }

    const apiData = await apiResponse.json();
    const products: ApiProduct[] = apiData?.data || [];

    console.log(`[API] Fetched ${products.length} products in ${apiDurationMs}ms`);

    // ========== Load existing deals for deduplication ==========
    const { data: existingDeals } = await supabase
      .from("affiliate_deals")
      .select("id, origin_external_id, affiliate_url, title, price, image_url")
      .eq("brand_id", brand_id)
      .eq("origin", "divulgador_inteligente");

    const existingBySlug = new Map<string, any>();
    for (const deal of existingDeals || []) {
      if (deal.origin_external_id) {
        existingBySlug.set(deal.origin_external_id, deal);
      }
    }

    // ========== Diagnose mode ==========
    if (isDiagnose) {
      const newCount = products.filter(p => !existingBySlug.has(p.attributes.uuid)).length;
      const existingCount = products.filter(p => existingBySlug.has(p.attributes.uuid)).length;

      // Sample of sellers
      const sellerCounts: Record<string, number> = {};
      for (const p of products) {
        const seller = p.attributes.seller || "unknown";
        sellerCounts[seller] = (sellerCounts[seller] || 0) + 1;
      }

      const result = {
        success: true,
        mode: "diagnose",
        api: {
          url: apiUrl,
          total_products: products.length,
          duration_ms: apiDurationMs,
          sellers: sellerCounts,
        },
        discovery: {
          total_from_api: products.length,
          already_in_db: existingCount,
          new_to_import: newCount,
          existing_in_db_total: existingDeals?.length || 0,
        },
        sample_products: products.slice(0, 15).map(p => ({
          uuid: p.attributes.uuid,
          title: p.attributes.title,
          price: p.attributes.price,
          price_from: p.attributes.price_from,
          seller: p.attributes.seller,
          coupon: p.attributes.coupon,
          has_image: !!p.attributes.image,
          is_new: !existingBySlug.has(p.attributes.uuid),
        })),
        new_products_sample: products
          .filter(p => !existingBySlug.has(p.attributes.uuid))
          .slice(0, 10)
          .map(p => ({
            uuid: p.attributes.uuid,
            title: p.attributes.title,
            seller: p.attributes.seller,
            link: p.attributes.link?.substring(0, 80),
          })),
      };

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== Sync mode: upsert products ==========
    let persistedNew = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const syncResults: SyncResult[] = [];

    for (const product of products) {
      const attrs = product.attributes;
      const slug = attrs.uuid;

      if (!slug || !attrs.title) {
        skipped++;
        continue;
      }

      const price = cleanPrice(attrs.price);
      const originalPrice = cleanPrice(attrs.price_from);
      const affiliateUrl = attrs.link || `${originUrl}/p/${slug}`;
      const badgeLabel = attrs.coupon ? `Cupom: ${attrs.coupon}` : null;

      const dealData: Record<string, any> = {
        brand_id,
        title: attrs.title,
        image_url: attrs.image || null,
        price,
        original_price: originalPrice,
        affiliate_url: affiliateUrl,
        origin: "divulgador_inteligente",
        origin_external_id: slug,
        origin_url: `${originUrl}/p/${slug}`,
        store_name: attrs.seller || null,
        store_logo_url: attrs.store_image || null,
        badge_label: badgeLabel,
        category: attrs.category || null,
        description: attrs.description || null,
        last_synced_at: new Date().toISOString(),
        sync_status: "ok",
        sync_error: null,
        updated_at: new Date().toISOString(),
      };

      const existing = existingBySlug.get(slug);

      try {
        if (existing) {
          // Update existing — only update fields that might have changed
          const { error } = await supabase
            .from("affiliate_deals")
            .update({
              title: dealData.title,
              image_url: dealData.image_url,
              price: dealData.price,
              original_price: dealData.original_price,
              affiliate_url: dealData.affiliate_url,
              store_name: dealData.store_name,
              store_logo_url: dealData.store_logo_url,
              badge_label: dealData.badge_label,
              category: dealData.category,
              description: dealData.description,
              last_synced_at: dealData.last_synced_at,
              sync_status: "ok",
              sync_error: null,
              updated_at: dealData.updated_at,
            })
            .eq("id", existing.id);

          if (error) throw error;
          updated++;
          syncResults.push({ slug, title: attrs.title, action: "updated" });
        } else {
          // Insert new
          const { error } = await supabase
            .from("affiliate_deals")
            .insert({
              ...dealData,
              is_active: autoActivate,
              visible_driver: autoVisibleDriver,
              click_count: 0,
              order_index: 0,
              first_imported_at: new Date().toISOString(),
            });

          if (error) throw error;
          persistedNew++;
          syncResults.push({ slug, title: attrs.title, action: "created" });
        }
      } catch (e: any) {
        errors++;
        syncResults.push({ slug, title: attrs.title, action: "error", error: e.message });
        console.error(`[Sync] Error for ${slug}: ${e.message}`);
      }
    }

    // ========== Log the sync ==========
    const finishedAt = new Date().toISOString();
    const details = {
      api: {
        url: apiUrl,
        total_products: products.length,
        duration_ms: apiDurationMs,
      },
      discovery: {
        total_from_api: products.length,
        already_in_db: existingBySlug.size,
        new_to_import: products.length - existingBySlug.size,
      },
      totals: {
        total_read: products.length,
        persisted_new: persistedNew,
        updated,
        skipped,
        errors,
      },
      samples: syncResults.slice(0, 20),
    };

    await supabase.from("mirror_sync_logs").insert({
      brand_id,
      started_at: startedAt,
      finished_at: finishedAt,
      status: errors > 0 ? "partial" : "success",
      total_read: products.length,
      total_persisted: persistedNew + updated,
      new_count: persistedNew,
      updated_count: updated,
      error_count: errors,
      details,
    });

    console.log(`[Sync] Done: ${persistedNew} new, ${updated} updated, ${skipped} skipped, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        total_from_api: products.length,
        persisted_new: persistedNew,
        updated,
        skipped,
        errors,
        duration_ms: Date.now() - apiStart,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("[mirror-sync] Fatal error:", e.message);
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
