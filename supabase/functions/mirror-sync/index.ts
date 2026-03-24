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

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ---------- Category matching ----------

interface DealCategory {
  id: string;
  name: string;
  keywords: string[];
  is_active: boolean;
}

function matchDealToCategory(
  title: string,
  description: string | null,
  category: string | null,
  storeName: string | null,
  categories: DealCategory[]
): string | null {
  // 1. Prioridade máxima: match direto do campo "category" da API contra o nome da categoria
  if (category) {
    const normCat = normalize(category);
    for (const cat of categories) {
      if (normalize(cat.name) === normCat) {
        return cat.id;
      }
    }
    // Match parcial: nome da categoria contido no campo category ou vice-versa
    for (const cat of categories) {
      const normName = normalize(cat.name);
      if (normCat.includes(normName) || normName.includes(normCat)) {
        return cat.id;
      }
    }
  }

  // 2. Fallback: keyword scoring
  const text = normalize(
    [title, description, category, storeName].filter(Boolean).join(" ")
  );

  let bestCatId: string | null = null;
  let bestScore = 0;
  const MIN_SCORE = 4; // score mínimo aumentado para evitar matches fracos

  for (const cat of categories) {
    let score = 0;
    for (const kw of cat.keywords) {
      const nkw = normalize(kw);
      if (nkw.length === 0) continue;
      const escaped = nkw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:^|\\s|[^a-z0-9])${escaped}(?:$|\\s|[^a-z0-9])`, "i");
      if (regex.test(` ${text} `)) {
        score += nkw.length;
      }
    }
    if (score > bestScore && score >= MIN_SCORE) {
      bestScore = score;
      bestCatId = cat.id;
    }
  }

  return bestCatId;
}

// ---------- API types ----------

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

// ---------- Auto-categorization phase ----------

async function runAutoCategorization(supabase: any, brandId: string) {
  const MIN_DEALS_PER_CATEGORY = 4;
  const catStats = {
    matched_by_keywords: 0,
    sent_to_variadas: 0,
    categories_activated: [] as string[],
    categories_deactivated: [] as string[],
    deals_moved_to_variadas: 0,
  };

  // 1. Load all categories (active + inactive)
  const { data: allCategories } = await supabase
    .from("affiliate_deal_categories")
    .select("id, name, keywords, is_active")
    .eq("brand_id", brandId);

  const categories: DealCategory[] = allCategories || [];

  // 2. Load all active deals for this brand (mirrored)
  const { data: allDeals } = await supabase
    .from("affiliate_deals")
    .select("id, title, description, category, store_name, category_id, is_active")
    .eq("brand_id", brandId)
    .eq("origin", "divulgador_inteligente")
    .eq("is_active", true);

  const deals = allDeals || [];

  // 3. Phase 3 — Recategorizar TODOS os deals (não apenas sem category_id)
  const dealsToMatch = deals;
  const categoryUpdates = new Map<string, string[]>(); // category_id -> deal_ids

  for (const deal of dealsToMatch) {
    const matchedCatId = matchDealToCategory(
      deal.title,
      deal.description,
      deal.category,
      deal.store_name,
      categories
    );
    if (matchedCatId) {
      catStats.matched_by_keywords++;
      if (!categoryUpdates.has(matchedCatId)) {
        categoryUpdates.set(matchedCatId, []);
      }
      categoryUpdates.get(matchedCatId)!.push(deal.id);
    }
  }

  // Batch update category_id for matched deals
  for (const [catId, dealIds] of categoryUpdates) {
    await supabase
      .from("affiliate_deals")
      .update({ category_id: catId })
      .in("id", dealIds);
  }

  // 4. Phase 4 — Category lifecycle management
  // Re-count deals per category after matching
  const { data: refreshedDeals } = await supabase
    .from("affiliate_deals")
    .select("id, category_id")
    .eq("brand_id", brandId)
    .eq("origin", "divulgador_inteligente")
    .eq("is_active", true);

  const countByCategory = new Map<string, number>();
  const dealsByCategory = new Map<string, string[]>();
  const uncategorized: string[] = [];

  for (const d of refreshedDeals || []) {
    if (d.category_id) {
      countByCategory.set(d.category_id, (countByCategory.get(d.category_id) || 0) + 1);
      if (!dealsByCategory.has(d.category_id)) dealsByCategory.set(d.category_id, []);
      dealsByCategory.get(d.category_id)!.push(d.id);
    } else {
      uncategorized.push(d.id);
    }
  }

  // Auto-activate inactive categories with 4+ deals
  for (const cat of categories) {
    const count = countByCategory.get(cat.id) || 0;
    if (!cat.is_active && count >= MIN_DEALS_PER_CATEGORY) {
      await supabase
        .from("affiliate_deal_categories")
        .update({ is_active: true })
        .eq("id", cat.id);
      catStats.categories_activated.push(cat.name);
    }
  }

  // Auto-deactivate active categories with < 4 deals, move deals to uncategorized
  for (const cat of categories) {
    if (cat.name === "Ofertas Variadas") continue; // never deactivate fallback
    const count = countByCategory.get(cat.id) || 0;
    if (cat.is_active && count < MIN_DEALS_PER_CATEGORY && count > 0) {
      await supabase
        .from("affiliate_deal_categories")
        .update({ is_active: false })
        .eq("id", cat.id);
      catStats.categories_deactivated.push(cat.name);

      // Move deals to uncategorized
      const idsToMove = dealsByCategory.get(cat.id) || [];
      if (idsToMove.length > 0) {
        await supabase
          .from("affiliate_deals")
          .update({ category_id: null })
          .in("id", idsToMove);
        uncategorized.push(...idsToMove);
        catStats.deals_moved_to_variadas += idsToMove.length;
      }
    }
  }

  // 5. Ensure "Ofertas Variadas" exists
  let variadasId: string | null = null;
  const existing = categories.find((c) => c.name === "Ofertas Variadas");
  if (existing) {
    variadasId = existing.id;
    // Make sure it's active
    if (!existing.is_active) {
      await supabase
        .from("affiliate_deal_categories")
        .update({ is_active: true })
        .eq("id", existing.id);
    }
  } else {
    // Get max order_index
    const maxOrder = categories.reduce((m, c) => Math.max(m, 0), 0);
    const { data: created } = await supabase
      .from("affiliate_deal_categories")
      .insert({
        brand_id: brandId,
        name: "Ofertas Variadas",
        icon_name: "Package",
        color: "#6b7280",
        order_index: maxOrder + 1,
        is_active: true,
        keywords: [],
      })
      .select("id")
      .single();
    variadasId = created?.id || null;
  }

  // 6. Assign all uncategorized deals to "Ofertas Variadas"
  if (variadasId && uncategorized.length > 0) {
    catStats.sent_to_variadas = uncategorized.length;
    // Batch in chunks of 100
    for (let i = 0; i < uncategorized.length; i += 100) {
      const chunk = uncategorized.slice(i, i + 100);
      await supabase
        .from("affiliate_deals")
        .update({ category_id: variadasId })
        .in("id", chunk);
    }
  }

  return catStats;
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

    // ========== Phase 3 & 4: Auto-categorization ==========
    console.log("[Categorization] Starting auto-categorization...");
    let categorizationStats = null;
    try {
      categorizationStats = await runAutoCategorization(supabase, brand_id);
      console.log("[Categorization] Done:", JSON.stringify(categorizationStats));
    } catch (e: any) {
      console.error("[Categorization] Error:", e.message);
      categorizationStats = { error: e.message };
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
      categorization: categorizationStats,
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
        categorization: categorizationStats,
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
