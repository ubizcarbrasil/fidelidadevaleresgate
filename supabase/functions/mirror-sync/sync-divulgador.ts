// Handler do source Divulgador Inteligente — API JSON + scraping vitrine
// pra pegar preços reais (API às vezes vem desatualizada).

import { runAutoCategorization } from "./auto-categorization.ts";
import {
  computeSyncGroupCounters,
  detectRemovedOffers,
  reactivateReappearedOffers,
  updateSyncGroup,
} from "./governance.ts";
import { cleanPrice, extractSitename } from "./helpers.ts";
import { scrapeVitrinePrices } from "./scrape-vitrine.ts";
import type { ApiProduct, SyncResult } from "./types.ts";

export async function syncDivulgador(supabase: any, brandId: string, config: any, isDiagnose: boolean) {
  const startedAt = new Date().toISOString();

  const originUrl = config?.origin_url || "https://www.divulgadorinteligente.com/ubizresgata";
  const autoActivate = config?.auto_activate !== false;
  const autoVisibleDriver = config?.auto_visible_driver !== false;
  const sitename = extractSitename(originUrl);

  // Fase 1: scrape vitrine
  console.log("[Scrape] Starting vitrine price scraping...");
  const scrapeStart = Date.now();
  const vitrinePrices = await scrapeVitrinePrices(originUrl, sitename);
  const scrapeDurationMs = Date.now() - scrapeStart;
  console.log(`[Scrape] Got ${vitrinePrices.size} prices in ${scrapeDurationMs}ms`);

  // Fase 2: API JSON
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

  const { data: existingDeals } = await supabase
    .from("affiliate_deals")
    .select("id, origin_external_id, affiliate_url, title, price, image_url")
    .eq("brand_id", brandId)
    .eq("origin", "divulgador_inteligente");

  const existingBySlug = new Map<string, any>();
  for (const deal of existingDeals || []) {
    if (deal.origin_external_id) {
      existingBySlug.set(deal.origin_external_id, deal);
    }
  }

  if (isDiagnose) {
    const newCount = products.filter(p => !existingBySlug.has(p.attributes.uuid)).length;
    const existingCount = products.filter(p => existingBySlug.has(p.attributes.uuid)).length;

    const sellerCounts: Record<string, number> = {};
    for (const p of products) {
      const seller = p.attributes.seller || "unknown";
      sellerCounts[seller] = (sellerCounts[seller] || 0) + 1;
    }

    const priceDiagnostics: any[] = [];
    for (const p of products.slice(0, 30)) {
      const uuid = p.attributes.uuid;
      const priceApi = cleanPrice(p.attributes.price);
      const originalPriceApi = cleanPrice(p.attributes.price_from);
      const vitrineEntry = vitrinePrices.get(uuid);

      const pricePage = vitrineEntry?.price ?? null;
      const originalPricePage = vitrineEntry?.originalPrice ?? null;

      const priceUsed = pricePage ?? priceApi;
      const originalPriceUsed = originalPricePage ?? originalPriceApi;
      const source = pricePage !== null ? "vitrine" : "api";

      const hasDivergence = priceApi !== null && pricePage !== null && Math.abs(priceApi - pricePage) > 0.02;

      priceDiagnostics.push({
        uuid,
        title: p.attributes.title?.substring(0, 60),
        seller: p.attributes.seller,
        price_api: priceApi,
        price_api_raw: p.attributes.price,
        price_page: pricePage,
        original_price_api: originalPriceApi,
        original_price_page: originalPricePage,
        price_used: priceUsed,
        original_price_used: originalPriceUsed,
        source,
        has_divergence: hasDivergence,
        is_new: !existingBySlug.has(uuid),
      });
    }

    const divergentCount = priceDiagnostics.filter(d => d.has_divergence).length;

    return {
      success: true,
      mode: "diagnose",
      source_type: "divulgador_inteligente",
      scrape: {
        vitrine_prices_found: vitrinePrices.size,
        duration_ms: scrapeDurationMs,
      },
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
      price_diagnostics: {
        total_compared: priceDiagnostics.length,
        divergent_count: divergentCount,
        items: priceDiagnostics,
      },
    };
  }

  // Sync mode
  let persistedNew = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let priceFromVitrine = 0;
  let priceFromApi = 0;
  const syncResults: SyncResult[] = [];

  for (const product of products) {
    const attrs = product.attributes;
    const slug = attrs.uuid;

    if (!slug || !attrs.title) {
      skipped++;
      continue;
    }

    const priceApi = cleanPrice(attrs.price);
    const originalPriceApi = cleanPrice(attrs.price_from);
    const vitrineEntry = vitrinePrices.get(slug);

    const price = vitrineEntry?.price ?? priceApi;
    const originalPrice = vitrineEntry?.originalPrice ?? originalPriceApi;
    const priceSource = vitrineEntry?.price !== undefined && vitrineEntry?.price !== null ? "vitrine" : "api";

    if (priceSource === "vitrine") priceFromVitrine++;
    else priceFromApi++;

    const affiliateUrl = attrs.link || `${originUrl}/p/${slug}`;
    const badgeLabel = attrs.coupon ? `Cupom: ${attrs.coupon}` : null;

    const dealData: Record<string, any> = {
      brand_id: brandId,
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
            current_status: "active",
            updated_at: dealData.updated_at,
          })
          .eq("id", existing.id);

        if (error) throw error;
        updated++;
        syncResults.push({
          slug, title: attrs.title, action: "updated",
          price_source: priceSource, price_api: priceApi, price_page: vitrineEntry?.price ?? null, price_used: price,
        });
      } else {
        const { error } = await supabase
          .from("affiliate_deals")
          .insert({
            ...dealData,
            current_status: "active",
            is_active: autoActivate,
            visible_driver: autoVisibleDriver,
            click_count: 0,
            order_index: 0,
            first_imported_at: new Date().toISOString(),
          });

        if (error) throw error;
        persistedNew++;
        syncResults.push({
          slug, title: attrs.title, action: "created",
          price_source: priceSource, price_api: priceApi, price_page: vitrineEntry?.price ?? null, price_used: price,
        });
      }
    } catch (e: any) {
      errors++;
      syncResults.push({ slug, title: attrs.title, action: "error", error: e.message });
      console.error(`[Sync] Error for ${slug}: ${e.message}`);
    }
  }

  // Governança
  const syncedExtIdsDi = new Set(products.filter(p => p.attributes.uuid).map(p => p.attributes.uuid));

  console.log("[DI] Detecting removed offers...");
  const removedCountDi = await detectRemovedOffers(supabase, brandId, "divulgador_inteligente", syncedExtIdsDi);
  console.log(`[DI] Marked ${removedCountDi} offers as removed_from_source`);

  const reactivatedCountDi = await reactivateReappearedOffers(supabase, brandId, "divulgador_inteligente", syncedExtIdsDi);
  console.log(`[DI] Reactivated ${reactivatedCountDi} offers`);

  console.log("[Categorization] Starting auto-categorization...");
  let categorizationStats = null;
  try {
    categorizationStats = await runAutoCategorization(supabase, brandId, "divulgador_inteligente");
    console.log("[Categorization] Done:", JSON.stringify(categorizationStats));
  } catch (e: any) {
    console.error("[Categorization] Error:", e.message);
    categorizationStats = { error: e.message };
  }

  const countersDi = await computeSyncGroupCounters(supabase, brandId, "divulgador_inteligente");
  const syncStatusDi = errors > 0 ? "partial" : "success";
  await updateSyncGroup(supabase, brandId, "divulgador_inteligente", originUrl, "Divulgador Inteligente", syncStatusDi, countersDi);

  const finishedAt = new Date().toISOString();
  const details = {
    source_type: "divulgador_inteligente",
    scrape: {
      vitrine_prices_found: vitrinePrices.size,
      duration_ms: scrapeDurationMs,
    },
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
    price_sources: {
      from_vitrine: priceFromVitrine,
      from_api: priceFromApi,
    },
    categorization: categorizationStats,
    samples: syncResults.slice(0, 30),
  };

  await supabase.from("mirror_sync_logs").insert({
    brand_id: brandId,
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

  console.log(`[Sync] Done: ${persistedNew} new, ${updated} updated, ${skipped} skipped, ${errors} errors | Prices: ${priceFromVitrine} vitrine, ${priceFromApi} api`);

  return {
    success: true,
    source_type: "divulgador_inteligente",
    total_from_api: products.length,
    persisted_new: persistedNew,
    updated,
    skipped,
    errors,
    price_sources: {
      from_vitrine: priceFromVitrine,
      from_api: priceFromApi,
      vitrine_prices_found: vitrinePrices.size,
    },
    categorization: categorizationStats,
    duration_ms: Date.now() - apiStart,
  };
}
