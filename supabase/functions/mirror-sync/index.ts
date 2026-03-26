import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------- helpers ----------

function cleanPrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d,\.]/g, "").replace(/\./g, "").replace(",", ".");
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

// ---------- Vitrine page price scraping ----------

interface VitrinePriceEntry {
  uuid: string;
  price: number | null;
  originalPrice: number | null;
}

async function scrapeVitrinePrices(originUrl: string, sitename: string): Promise<Map<string, VitrinePriceEntry>> {
  const priceMap = new Map<string, VitrinePriceEntry>();

  const pagesToScrape = [
    `${originUrl}/promocoes-do-dia`,
  ];

  for (const pageUrl of pagesToScrape) {
    try {
      console.log(`[Scrape] Fetching vitrine: ${pageUrl}`);
      const res = await fetch(pageUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MirrorSync/1.0)" },
      });
      if (!res.ok) {
        console.warn(`[Scrape] ${pageUrl} returned ${res.status}`);
        continue;
      }
      const html = await res.text();

      const cardRegex = new RegExp(
        `<a[^>]*href="[^"]*/${sitename}/p/([a-zA-Z0-9_-]+)"[^>]*>(.*?)</a>`,
        "gs"
      );

      let match;
      while ((match = cardRegex.exec(html)) !== null) {
        const uuid = match[1];
        const cardHtml = match[2];

        const priceMatches = cardHtml.match(/R\$[\s\u00a0]*[\d.,]+/g);
        if (priceMatches && priceMatches.length > 0) {
          const parsedPrices = priceMatches
            .map((p) => cleanPrice(p))
            .filter((p): p is number => p !== null && p > 0);

          if (parsedPrices.length >= 2) {
            const sorted = [...parsedPrices].sort((a, b) => b - a);
            priceMap.set(uuid, {
              uuid,
              originalPrice: sorted[0],
              price: sorted[1],
            });
          } else if (parsedPrices.length === 1) {
            priceMap.set(uuid, {
              uuid,
              price: parsedPrices[0],
              originalPrice: null,
            });
          }
        }
      }

      console.log(`[Scrape] Extracted ${priceMap.size} prices from ${pageUrl}`);
    } catch (e: any) {
      console.error(`[Scrape] Error fetching ${pageUrl}: ${e.message}`);
    }
  }

  return priceMap;
}

// ---------- DVLinks scraping ----------

interface DvlinksDeal {
  title: string;
  imageUrl: string | null;
  price: number | null;
  originalPrice: number | null;
  affiliateUrl: string;
  storeName: string | null;
}

async function scrapeDvlinks(baseUrl: string, maxPages: number): Promise<DvlinksDeal[]> {
  const deals: DvlinksDeal[] = [];
  const seenUrls = new Set<string>();

  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
    console.log(`[DVLinks] Fetching page ${page}: ${url}`);

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MirrorSync/1.0)" },
      });
      if (!res.ok) {
        console.warn(`[DVLinks] Page ${page} returned ${res.status}`);
        break;
      }
      const html = await res.text();

      // Each card is a div with class "bg-white rounded-2xl shadow-md"
      // Structure:
      //   <a href="AFFILIATE_LINK"><img src="IMAGE_URL"></a>
      //   <h2>TITLE</h2>
      //   <span class="line-through">R$ORIGINAL</span>
      //   <span class="font-bold">R$PRICE</span>
      //   <a href="AFFILIATE_LINK">Ir à loja STORE_NAME</a>

      const cardRegex = /<div[^>]*class="[^"]*bg-white[^"]*rounded-2xl[^"]*shadow-md[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*bg-white[^"]*rounded-2xl|<\/div>\s*<\/main|\s*$)/g;

      let cardMatch;
      let cardsFound = 0;

      // Alternative: split by card divs
      // Use a simpler approach — find all product cards by their structure
      const cardBlocks = html.split(/(?=<div[^>]*class="[^"]*bg-white[^"]*rounded-2xl[^"]*shadow-md)/);

      for (const block of cardBlocks) {
        if (!block.includes('bg-white') || !block.includes('rounded-2xl')) continue;

        // Extract affiliate URL from first <a href="...">
        const linkMatch = block.match(/<a\s+href="(https?:\/\/[^"]+)"[^>]*target="_blank"[^>]*class="block"/);
        if (!linkMatch) continue;

        const affiliateUrl = linkMatch[1];
        if (seenUrls.has(affiliateUrl)) continue;
        seenUrls.add(affiliateUrl);

        // Extract image
        const imgMatch = block.match(/<img\s+src="([^"]+)"/);
        const imageUrl = imgMatch ? imgMatch[1] : null;

        // Extract title from h2
        const titleMatch = block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : null;
        if (!title) continue;

        // Extract prices
        const originalPriceMatch = block.match(/<span[^>]*class="[^"]*line-through[^"]*"[^>]*>\s*(R\$[\s\S]*?)\s*<\/span>/);
        const currentPriceMatch = block.match(/<span[^>]*class="[^"]*font-bold[^"]*"[^>]*>\s*(R\$[\s\S]*?)\s*<\/span>/);

        const originalPrice = originalPriceMatch ? cleanPrice(originalPriceMatch[1]) : null;
        const price = currentPriceMatch ? cleanPrice(currentPriceMatch[1]) : null;

        // Extract store name from button text "Ir à loja STORE_NAME"
        const storeMatch = block.match(/Ir à loja\s+(\S+)/i);
        const storeName = storeMatch ? storeMatch[1] : null;

        deals.push({
          title,
          imageUrl,
          price,
          originalPrice,
          affiliateUrl,
          storeName,
        });
        cardsFound++;
      }

      console.log(`[DVLinks] Page ${page}: found ${cardsFound} deals`);

      // If no cards found or page says "no products", stop pagination
      if (cardsFound === 0) break;
      if (html.includes("Nenhum produto encontrado")) {
        console.log(`[DVLinks] Page ${page}: detected empty page marker, stopping`);
        break;
      }

    } catch (e: any) {
      console.error(`[DVLinks] Error on page ${page}: ${e.message}`);
      break;
    }
  }

  console.log(`[DVLinks] Total deals scraped: ${deals.length}`);
  return deals;
}

// ---------- Category matching ----------

const API_CATEGORY_MAP: Record<string, string[]> = {
  home: ["casa"],
  kitchen: ["cozinha"],
  babies: ["bebe"],
  sports: ["esportes"],
  electronics: ["eletronicos"],
  beauty: ["beleza"],
  fashion: ["moda"],
  pets: ["pet"],
  automotive: ["automotivo"],
  computers: ["eletronicos"],
  phones: ["eletronicos"],
  games: ["games"],
  tools: ["ferramentas"],
  bags: ["moda"],
  books: ["livros"],
  health: ["saude"],
  stationery: ["papelaria"],
  grocery: ["mercado"],
  food: ["mercado"],
};

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
  categories: DealCategory[],
  minScore?: number
): string | null {
  if (category) {
    const normApiCat = normalize(category);
    const mappedNames = API_CATEGORY_MAP[normApiCat];
    if (mappedNames) {
      for (const mappedName of mappedNames) {
        for (const cat of categories) {
          if (normalize(cat.name) === mappedName) return cat.id;
        }
      }
    }
    for (const cat of categories) {
      if (normalize(cat.name) === normApiCat) return cat.id;
    }
    for (const cat of categories) {
      const normName = normalize(cat.name);
      if (normApiCat.includes(normName) || normName.includes(normApiCat)) return cat.id;
    }
  }

  const text = normalize(
    [title, description, category, storeName].filter(Boolean).join(" ")
  );

  let bestCatId: string | null = null;
  let bestScore = 0;
  const MIN_SCORE = minScore ?? 4;

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
  price_source?: string;
  price_api?: number | null;
  price_page?: number | null;
  price_used?: number | null;
}

// ---------- Auto-categorization phase ----------

async function runAutoCategorization(supabase: any, brandId: string, originFilter: string) {
  const MIN_DEALS_PER_CATEGORY = 4;
  const catStats = {
    matched_by_keywords: 0,
    sent_to_variadas: 0,
    categories_activated: [] as string[],
    categories_deactivated: [] as string[],
    deals_moved_to_variadas: 0,
  };

  const { data: allCategories } = await supabase
    .from("affiliate_deal_categories")
    .select("id, name, keywords, is_active")
    .eq("brand_id", brandId);

  const categories: DealCategory[] = allCategories || [];

  const { data: allDeals } = await supabase
    .from("affiliate_deals")
    .select("id, title, description, category, store_name, category_id, is_active")
    .eq("brand_id", brandId)
    .eq("origin", originFilter)
    .eq("is_active", true);

  const deals = allDeals || [];

  const categoryUpdates = new Map<string, string[]>();

  for (const deal of deals) {
    const matchedCatId = matchDealToCategory(
      deal.title,
      deal.description,
      deal.category,
      deal.store_name,
      categories
    );
    if (matchedCatId) {
      catStats.matched_by_keywords++;
      if (!categoryUpdates.has(matchedCatId)) categoryUpdates.set(matchedCatId, []);
      categoryUpdates.get(matchedCatId)!.push(deal.id);
    }
  }

  for (const [catId, dealIds] of categoryUpdates) {
    await supabase
      .from("affiliate_deals")
      .update({ category_id: catId })
      .in("id", dealIds);
  }

  const { data: refreshedDeals } = await supabase
    .from("affiliate_deals")
    .select("id, category_id")
    .eq("brand_id", brandId)
    .eq("origin", originFilter)
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

  for (const cat of categories) {
    if (cat.name === "Ofertas Variadas") continue;
    const count = countByCategory.get(cat.id) || 0;
    if (cat.is_active && count < MIN_DEALS_PER_CATEGORY && count > 0) {
      await supabase
        .from("affiliate_deal_categories")
        .update({ is_active: false })
        .eq("id", cat.id);
      catStats.categories_deactivated.push(cat.name);

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

  let variadasId: string | null = null;
  const existing = categories.find((c) => c.name === "Ofertas Variadas");
  if (existing) {
    variadasId = existing.id;
    if (!existing.is_active) {
      await supabase
        .from("affiliate_deal_categories")
        .update({ is_active: true })
        .eq("id", existing.id);
    }
  } else {
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

  if (variadasId && uncategorized.length > 0) {
    catStats.sent_to_variadas = uncategorized.length;
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

// ---------- DVLinks sync handler ----------

async function syncDvlinks(supabase: any, brandId: string, config: any, isDiagnose: boolean) {
  const baseUrl = config?.origin_url || "https://dvlinks.com.br/g/achadinhosresgata-69a302fc25d02";
  const maxPages = config?.max_pages || 40;
  const autoActivate = config?.auto_activate !== false;
  const autoVisibleDriver = config?.auto_visible_driver !== false;
  const originValue = "dvlinks";

  const startedAt = new Date().toISOString();

  // Scrape DVLinks pages
  const scrapeStart = Date.now();
  const dvDeals = await scrapeDvlinks(baseUrl, maxPages);
  const scrapeDurationMs = Date.now() - scrapeStart;

  // Load existing deals for dedup
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

  // Diagnose mode
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

  // Load categories for immediate matching
  const { data: allCategories } = await supabase
    .from("affiliate_deal_categories")
    .select("id, name, keywords, is_active")
    .eq("brand_id", brandId);
  const categories: DealCategory[] = allCategories || [];

  // Sync mode
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

    const extId = deal.affiliateUrl; // Use affiliate URL as unique identifier

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

    const existing = existingByExtId.get(extId);

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
            last_synced_at: dealData.last_synced_at,
            sync_status: "ok",
            sync_error: null,
            updated_at: dealData.updated_at,
          })
          .eq("id", existing.id);

        if (error) throw error;
        updated++;
        syncResults.push({ slug: extId, title: deal.title, action: "updated" });
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
        syncResults.push({ slug: extId, title: deal.title, action: "created" });
      }
    } catch (e: any) {
      errors++;
      syncResults.push({ slug: extId, title: deal.title, action: "error", error: e.message });
      console.error(`[DVLinks Sync] Error for "${deal.title}": ${e.message}`);
    }
  }

  // Auto-categorization
  console.log("[DVLinks] Starting auto-categorization...");
  let categorizationStats = null;
  try {
    categorizationStats = await runAutoCategorization(supabase, brandId, originValue);
    console.log("[DVLinks] Categorization done:", JSON.stringify(categorizationStats));
  } catch (e: any) {
    console.error("[DVLinks] Categorization error:", e.message);
    categorizationStats = { error: e.message };
  }

  // Log the sync
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
    const { brand_id, mode, source_type: requestedSource } = body;
    const isDiagnose = mode === "diagnose";

    // Handle auto-sync from cron
    if (brand_id === "auto") {
      const { data: configs } = await supabase
        .from("mirror_sync_config")
        .select("brand_id, source_type")
        .eq("auto_sync_enabled", true);

      const results = [];
      for (const cfg of configs || []) {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/mirror-sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
            body: JSON.stringify({ brand_id: cfg.brand_id, source_type: cfg.source_type }),
          });
          const data = await res.json();
          results.push({ brand_id: cfg.brand_id, source_type: cfg.source_type, ...data });
        } catch (e: any) {
          results.push({ brand_id: cfg.brand_id, source_type: cfg.source_type, error: e.message });
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

    // Determine source type
    const sourceType = requestedSource || "divulgador_inteligente";

    // Load config for this source
    const { data: config } = await supabase
      .from("mirror_sync_config")
      .select("*")
      .eq("brand_id", brand_id)
      .eq("source_type", sourceType)
      .maybeSingle();

    // Route to appropriate handler
    if (sourceType === "dvlinks") {
      const result = await syncDvlinks(supabase, brand_id, config, isDiagnose);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== Default: Divulgador Inteligente flow ==========
    const startedAt = new Date().toISOString();

    const originUrl = config?.origin_url || "https://www.divulgadorinteligente.com/ubizresgata";
    const autoActivate = config?.auto_activate !== false;
    const autoVisibleDriver = config?.auto_visible_driver !== false;
    const sitename = extractSitename(originUrl);

    // ========== Phase 1: Scrape vitrine page for real prices ==========
    console.log("[Scrape] Starting vitrine price scraping...");
    const scrapeStart = Date.now();
    const vitrinePrices = await scrapeVitrinePrices(originUrl, sitename);
    const scrapeDurationMs = Date.now() - scrapeStart;
    console.log(`[Scrape] Got ${vitrinePrices.size} prices in ${scrapeDurationMs}ms`);

    // ========== Phase 2: Fetch products from API ==========
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

      const result = {
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
          syncResults.push({
            slug, title: attrs.title, action: "updated",
            price_source: priceSource, price_api: priceApi, price_page: vitrineEntry?.price ?? null, price_used: price,
          });
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

    // ========== Phase 3 & 4: Auto-categorization ==========
    console.log("[Categorization] Starting auto-categorization...");
    let categorizationStats = null;
    try {
      categorizationStats = await runAutoCategorization(supabase, brand_id, "divulgador_inteligente");
      console.log("[Categorization] Done:", JSON.stringify(categorizationStats));
    } catch (e: any) {
      console.error("[Categorization] Error:", e.message);
      categorizationStats = { error: e.message };
    }

    // ========== Log the sync ==========
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

    console.log(`[Sync] Done: ${persistedNew} new, ${updated} updated, ${skipped} skipped, ${errors} errors | Prices: ${priceFromVitrine} vitrine, ${priceFromApi} api`);

    return new Response(
      JSON.stringify({
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
