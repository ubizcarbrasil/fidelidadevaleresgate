// Handler do source DVLinks — scraping HTML + upsert em affiliate_deals.

import { runAutoCategorization } from "./auto-categorization.ts";
import { matchDealToCategory } from "./category-matcher.ts";
import {
  computeSyncGroupCounters,
  detectRemovedOffers,
  reactivateReappearedOffers,
  updateSyncGroup,
} from "./governance.ts";
import { scrapeDvlinks } from "./scrape-dvlinks.ts";
import type { DealCategory, SyncResult } from "./types.ts";

export async function syncDvlinks(supabase: any, brandId: string, config: any, isDiagnose: boolean) {
  const baseUrl = config?.origin_url || "https://dvlinks.com.br/g/achadinhosresgata-69a302fc25d02";
  const maxPages = config?.max_pages || 40;
  const autoActivate = config?.auto_activate !== false;
  const autoVisibleDriver = config?.auto_visible_driver !== false;
  const originValue = "dvlinks";

  const startedAt = new Date().toISOString();

  const scrapeStart = Date.now();
  const dvDeals = await scrapeDvlinks(baseUrl, maxPages);
  const scrapeDurationMs = Date.now() - scrapeStart;

  const { data: existingDeals } = await supabase
    .from("affiliate_deals")
    .select("id, origin_external_id, affiliate_url, title, price, image_url")
    .eq("brand_id", brandId)
    .eq("origin", originValue);

  const existingByExtId = new Map<string, any>();
  for (const deal of existingDeals || []) {
    if (deal.origin_external_id) {
      existingByExtId.set(deal.origin_external_id, deal);
    }
  }

  if (isDiagnose) {
    const newCount = dvDeals.filter(d => !existingByExtId.has(d.affiliateUrl)).length;
    const existingCount = dvDeals.filter(d => existingByExtId.has(d.affiliateUrl)).length;

    const storeCounts: Record<string, number> = {};
    for (const d of dvDeals) {
      const store = d.storeName || "unknown";
      storeCounts[store] = (storeCounts[store] || 0) + 1;
    }

    return {
      success: true,
      mode: "diagnose",
      source_type: "dvlinks",
      scrape: {
        total_deals_scraped: dvDeals.length,
        duration_ms: scrapeDurationMs,
        base_url: baseUrl,
        max_pages: maxPages,
      },
      discovery: {
        total_scraped: dvDeals.length,
        already_in_db: existingCount,
        new_to_import: newCount,
        existing_in_db_total: existingDeals?.length || 0,
      },
      stores: storeCounts,
      samples: dvDeals.slice(0, 20).map(d => ({
        title: d.title.substring(0, 60),
        price: d.price,
        original_price: d.originalPrice,
        store: d.storeName,
        affiliate_url: d.affiliateUrl,
        image: d.imageUrl ? "yes" : "no",
        is_new: !existingByExtId.has(d.affiliateUrl),
      })),
    };
  }

  const { data: allCategories } = await supabase
    .from("affiliate_deal_categories")
    .select("id, name, keywords, is_active")
    .eq("brand_id", brandId);
  const categories: DealCategory[] = allCategories || [];

  let persistedNew = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  const syncResults: SyncResult[] = [];

  for (const deal of dvDeals) {
    if (!deal.title || !deal.affiliateUrl) {
      skipped++;
      continue;
    }

    const extId = deal.affiliateUrl;

    const dealData: Record<string, any> = {
      brand_id: brandId,
      title: deal.title,
      image_url: deal.imageUrl,
      price: deal.price,
      original_price: deal.originalPrice,
      affiliate_url: deal.affiliateUrl,
      origin: originValue,
      origin_external_id: extId,
      origin_url: baseUrl,
      store_name: deal.storeName,
      store_logo_url: null,
      badge_label: null,
      category: null,
      description: null,
      last_synced_at: new Date().toISOString(),
      sync_status: "ok",
      sync_error: null,
      updated_at: new Date().toISOString(),
    };

    // DVLinks: threshold mais permissivo (3 em vez de 4) — store name + title
    // são pistas mais fracas que API category do DI.
    const matchedCatId = matchDealToCategory(
      deal.title, null, null, deal.storeName, categories, 3
    );
    if (matchedCatId) {
      dealData.category_id = matchedCatId;
    }

    const existing = existingByExtId.get(extId);

    try {
      if (existing) {
      const updateFields: Record<string, any> = {
            title: dealData.title,
            image_url: dealData.image_url,
            price: dealData.price,
            original_price: dealData.original_price,
            affiliate_url: dealData.affiliate_url,
            store_name: dealData.store_name,
            last_synced_at: dealData.last_synced_at,
            sync_status: "ok",
            sync_error: null,
            current_status: "active",
            updated_at: dealData.updated_at,
        };
        if (matchedCatId) updateFields.category_id = matchedCatId;

        const { error } = await supabase
          .from("affiliate_deals")
          .update(updateFields)
          .eq("id", existing.id);

        if (error) throw error;
        updated++;
        syncResults.push({ slug: extId, title: deal.title, action: "updated" });
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
        syncResults.push({ slug: extId, title: deal.title, action: "created" });
      }
    } catch (e: any) {
      errors++;
      syncResults.push({ slug: extId, title: deal.title, action: "error", error: e.message });
      console.error(`[DVLinks Sync] Error for "${deal.title}": ${e.message}`);
    }
  }

  // Governança: detectar removidas + reativadas
  const syncedExtIdsDv = new Set(dvDeals.filter(d => d.affiliateUrl).map(d => d.affiliateUrl));

  console.log("[DVLinks] Detecting removed offers...");
  const removedCountDv = await detectRemovedOffers(supabase, brandId, originValue, syncedExtIdsDv);
  console.log(`[DVLinks] Marked ${removedCountDv} offers as removed_from_source`);

  const reactivatedCountDv = await reactivateReappearedOffers(supabase, brandId, originValue, syncedExtIdsDv);
  console.log(`[DVLinks] Reactivated ${reactivatedCountDv} offers`);

  console.log("[DVLinks] Starting auto-categorization...");
  let categorizationStats = null;
  try {
    categorizationStats = await runAutoCategorization(supabase, brandId, originValue);
    console.log("[DVLinks] Categorization done:", JSON.stringify(categorizationStats));
  } catch (e: any) {
    console.error("[DVLinks] Categorization error:", e.message);
    categorizationStats = { error: e.message };
  }

  const countersDv = await computeSyncGroupCounters(supabase, brandId, originValue);
  const syncStatusDv = errors > 0 ? "partial" : "success";
  await updateSyncGroup(supabase, brandId, originValue, baseUrl, "DVLinks", syncStatusDv, countersDv);

  const finishedAt = new Date().toISOString();
  const details = {
    source_type: "dvlinks",
    scrape: {
      total_deals_scraped: dvDeals.length,
      duration_ms: scrapeDurationMs,
      base_url: baseUrl,
    },
    totals: {
      total_read: dvDeals.length,
      persisted_new: persistedNew,
      updated,
      skipped,
      errors,
    },
    categorization: categorizationStats,
    samples: syncResults.slice(0, 30),
  };

  await supabase.from("mirror_sync_logs").insert({
    brand_id: brandId,
    started_at: startedAt,
    finished_at: finishedAt,
    status: errors > 0 ? "partial" : "success",
    total_read: dvDeals.length,
    total_persisted: persistedNew + updated,
    new_count: persistedNew,
    updated_count: updated,
    error_count: errors,
    details,
  });

  console.log(`[DVLinks Sync] Done: ${persistedNew} new, ${updated} updated, ${skipped} skipped, ${errors} errors`);

  return {
    success: true,
    source_type: "dvlinks",
    total_scraped: dvDeals.length,
    persisted_new: persistedNew,
    updated,
    skipped,
    errors,
    categorization: categorizationStats,
    duration_ms: Date.now() - scrapeStart,
  };
}
