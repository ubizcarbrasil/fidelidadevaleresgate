import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------- helpers ----------

function md5Hex(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const chr = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

function extractSlug(href: string): string | null {
  const match = href.match(/\/p\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function cleanPrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d,\.]/g, "").replace(",", ".");
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

// ---------- listing page parser ----------

interface ParsedDeal {
  title: string;
  price: number | null;
  original_price: number | null;
  image_url: string | null;
  affiliate_url: string;
  badge_label: string | null;
  origin_external_id: string | null;
  origin_url: string;
  raw_html: string;
  store_name: string | null;
}

function parseDealsFromHtml(html: string, baseUrl: string): ParsedDeal[] {
  const deals: ParsedDeal[] = [];

  const cardRegex = /<a[^>]*href="((?:https?:\/\/[^"]*)?\/ubizresgata\/p\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let cardMatch;

  while ((cardMatch = cardRegex.exec(html)) !== null) {
    try {
      const href = cardMatch[1];
      const cardHtml = cardMatch[2];
      const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
      const slug = extractSlug(href);

      const imgMatch = cardHtml.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
      const imageUrl = imgMatch ? imgMatch[1] : null;

      const discountBadgeMatch = cardHtml.match(/>-(?:<!-- -->)?(\d+)(?:<!-- -->)?%</);
      const badgeLabel = discountBadgeMatch ? `-${discountBadgeMatch[1]}%` : null;

      const storeMatch = cardHtml.match(/\/lojas\/([^"\/\s]+)/i);
      const storeName = storeMatch
        ? decodeURIComponent(storeMatch[1]).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
        : null;

      const priceRegex = /R\$(?:&nbsp;|\s)*([\d.,]+)/g;
      let priceMatch;
      const rawPrices: number[] = [];
      while ((priceMatch = priceRegex.exec(cardHtml)) !== null) {
        const val = cleanPrice(priceMatch[1]);
        if (val !== null && val > 0) rawPrices.push(val);
      }

      const textParts: string[] = [];
      const textRegex = /<(?:p|span|div|h[1-6])[^>]*>([^<]{4,})<\/(?:p|span|div|h[1-6])>/gi;
      let textMatch;
      while ((textMatch = textRegex.exec(cardHtml)) !== null) {
        const text = textMatch[1].trim();
        if (text && !text.match(/R\$/) && !text.match(/^-?\d+%$/) && !text.match(/^\d+[.,]\d{2}$/)) {
          textParts.push(text);
        }
      }

      let title = "";
      for (const part of textParts) {
        if (part.length > title.length) title = part;
      }

      let price: number | null = null;
      let originalPrice: number | null = null;

      if (rawPrices.length >= 2) {
        const sorted = [...rawPrices].sort((a, b) => a - b);
        price = sorted[0];
        originalPrice = sorted[sorted.length - 1];
        if (price === originalPrice) originalPrice = null;
      } else if (rawPrices.length === 1) {
        price = rawPrices[0];
      }

      if (!title && !price && !imageUrl) continue;
      if (!title) title = "Oferta sem título";

      deals.push({
        title,
        price,
        original_price: originalPrice,
        image_url: imageUrl,
        affiliate_url: fullUrl,
        badge_label: badgeLabel,
        origin_external_id: slug,
        origin_url: fullUrl,
        raw_html: cardHtml.substring(0, 2000),
        store_name: storeName,
      });
    } catch (e) {
      console.error("Error parsing card:", e);
    }
  }

  return deals;
}

// ---------- product detail page parser ----------

function parseProductPage(html: string, url: string): ParsedDeal | null {
  try {
    const slug = extractSlug(url);

    // Extract title from og:title or <title> or <h1>
    let title = "";
    const ogTitleMatch = html.match(/property="og:title"\s+content="([^"]+)"/i) ||
                         html.match(/content="([^"]+)"\s+property="og:title"/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1];
    } else {
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match) title = h1Match[1].trim();
      else {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) title = titleMatch[1].trim();
      }
    }

    // Extract image from og:image or first large img
    let imageUrl: string | null = null;
    const ogImgMatch = html.match(/property="og:image"\s+content="([^"]+)"/i) ||
                       html.match(/content="([^"]+)"\s+property="og:image"/i);
    if (ogImgMatch) {
      imageUrl = ogImgMatch[1];
    } else {
      const imgMatch = html.match(/<img[^>]*src="(https?:\/\/[^"]+(?:\.jpg|\.jpeg|\.png|\.webp)[^"]*)"/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }

    // Extract prices
    const priceRegex = /R\$(?:&nbsp;|\s)*([\d.,]+)/g;
    let priceMatch;
    const rawPrices: number[] = [];
    while ((priceMatch = priceRegex.exec(html)) !== null) {
      const val = cleanPrice(priceMatch[1]);
      if (val !== null && val > 0 && val < 100000) rawPrices.push(val);
    }

    // Deduplicate prices
    const uniquePrices = [...new Set(rawPrices)].sort((a, b) => a - b);

    let price: number | null = null;
    let originalPrice: number | null = null;

    if (uniquePrices.length >= 2) {
      price = uniquePrices[0];
      originalPrice = uniquePrices[uniquePrices.length - 1];
      if (price === originalPrice) originalPrice = null;
    } else if (uniquePrices.length === 1) {
      price = uniquePrices[0];
    }

    // Extract discount badge
    const discountMatch = html.match(/-(\d+)%/);
    const badgeLabel = discountMatch ? `-${discountMatch[1]}%` : null;

    // Extract store name from /lojas/XXX or og:site_name
    let storeName: string | null = null;
    const storeMatch = html.match(/\/lojas\/([^"\/\s?]+)/i);
    if (storeMatch) {
      storeName = decodeURIComponent(storeMatch[1]).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    } else {
      const siteNameMatch = html.match(/property="og:site_name"\s+content="([^"]+)"/i);
      if (siteNameMatch) storeName = siteNameMatch[1];
    }

    if (!title && !price && !imageUrl) return null;
    if (!title) title = "Oferta sem título";

    return {
      title,
      price,
      original_price: originalPrice,
      image_url: imageUrl,
      affiliate_url: url,
      badge_label: badgeLabel,
      origin_external_id: slug,
      origin_url: url,
      raw_html: "",
      store_name: storeName,
    };
  } catch (e) {
    console.error("Error parsing product page:", e);
    return null;
  }
}

// ---------- main handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

  if (!firecrawlKey) {
    return new Response(
      JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { brand_id } = body;

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
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceKey}`,
            },
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

    // Load config
    const { data: config } = await supabase
      .from("mirror_sync_config")
      .select("*")
      .eq("brand_id", brand_id)
      .single();

    const originUrl = config?.origin_url || "https://www.divulgadorinteligente.com/ubizresgata";
    const autoActivate = config?.auto_activate !== false;
    const autoVisibleDriver = config?.auto_visible_driver !== false;
    const debugMode = config?.debug_mode === true;

    // Build list of URLs to scrape (multi-page)
    const defaultPages = [
      "/promocoes-do-dia",
      "/lojas/shopee",
      "/lojas/mercadolivre",
      "/lojas/amazon",
      "/lojas/magalu",
    ];
    const extraPages: string[] = (config?.extra_pages as string[]) || [];
    const pagePaths = extraPages.length > 0 ? extraPages : defaultPages;
    const urls = [
      originUrl,
      ...pagePaths.map((p: string) => p.startsWith("http") ? p : `${originUrl}${p}`),
    ];

    // Create log entry
    const { data: logEntry } = await supabase
      .from("mirror_sync_logs")
      .insert({ brand_id, origin: "divulgador_inteligente", status: "running" })
      .select("id")
      .single();

    const logId = logEntry?.id;

    let totalRead = 0;
    let totalNew = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const errorDetails: any[] = [];

    try {
      const baseUrl = new URL(originUrl).origin;
      const allParsedDeals: ParsedDeal[] = [];
      const seenSlugs = new Set<string>();

      // ========== PHASE 1: Scrape listing pages ==========
      for (const url of urls) {
        try {
          console.log(`Scraping listing: ${url}`);
          const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url,
              formats: ["html"],
              waitFor: 3000,
              onlyMainContent: false,
            }),
          });

          const scrapeData = await scrapeResponse.json();

          if (!scrapeResponse.ok) {
            console.error(`Firecrawl error for ${url}:`, JSON.stringify(scrapeData));
            errorDetails.push({ phase: "scrape", url, error: scrapeData?.error || `HTTP ${scrapeResponse.status}` });
            continue;
          }

          const html = scrapeData?.data?.html || scrapeData?.html || "";
          if (!html) {
            console.warn(`No HTML returned for ${url}`);
            continue;
          }

          console.log(`HTML length for ${url}: ${html.length}`);
          const pageParsed = parseDealsFromHtml(html, baseUrl);
          console.log(`Parsed ${pageParsed.length} deals from ${url}`);

          for (const deal of pageParsed) {
            const dedupeKey = deal.origin_external_id || deal.affiliate_url;
            if (!seenSlugs.has(dedupeKey)) {
              seenSlugs.add(dedupeKey);
              allParsedDeals.push(deal);
            }
          }
        } catch (urlError: any) {
          console.error(`Error scraping ${url}:`, urlError);
          errorDetails.push({ phase: "scrape", url, error: urlError.message });
        }
      }

      console.log(`Phase 1 (listings): ${allParsedDeals.length} unique deals from ${urls.length} pages`);

      // ========== PHASE 2: Map API discovery ==========
      let mapDiscoveredUrls: string[] = [];
      try {
        console.log(`Phase 2: Map API discovery for ${originUrl}`);
        const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: originUrl,
            search: "ubizresgata/p/",
            limit: 500,
            includeSubdomains: false,
          }),
        });

        const mapData = await mapResponse.json();

        if (mapResponse.ok) {
          mapDiscoveredUrls = (mapData?.links || []).filter((link: string) =>
            link.includes("/ubizresgata/p/") || link.includes("/p/")
          );
          console.log(`Map API discovered ${mapDiscoveredUrls.length} product URLs`);
        } else {
          console.error("Map API error:", JSON.stringify(mapData));
          errorDetails.push({ phase: "map", error: mapData?.error || `HTTP ${mapResponse.status}` });
        }
      } catch (mapError: any) {
        console.error("Map API error:", mapError);
        errorDetails.push({ phase: "map", error: mapError.message });
      }

      // ========== PHASE 3: Scrape individual product pages for new slugs ==========
      // Find slugs discovered by Map that we don't already have from listings
      const newProductUrls = mapDiscoveredUrls.filter(url => {
        const slug = extractSlug(url);
        return slug && !seenSlugs.has(slug);
      });

      console.log(`Phase 3: ${newProductUrls.length} new product URLs to scrape individually`);

      // Batch individual scrapes (limit concurrency to avoid rate limits)
      const BATCH_SIZE = 5;
      for (let i = 0; i < newProductUrls.length; i += BATCH_SIZE) {
        const batch = newProductUrls.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batch.map(async (productUrl) => {
            try {
              const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${firecrawlKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  url: productUrl,
                  formats: ["html"],
                  waitFor: 2000,
                  onlyMainContent: false,
                }),
              });

              const scrapeData = await scrapeResp.json();
              if (!scrapeResp.ok) {
                console.error(`Product scrape error for ${productUrl}`);
                return null;
              }

              const html = scrapeData?.data?.html || scrapeData?.html || "";
              if (!html) return null;

              return parseProductPage(html, productUrl);
            } catch (e: any) {
              console.error(`Error scraping product ${productUrl}:`, e);
              return null;
            }
          })
        );

        for (const result of batchResults) {
          if (result.status === "fulfilled" && result.value) {
            const deal = result.value;
            const dedupeKey = deal.origin_external_id || deal.affiliate_url;
            if (!seenSlugs.has(dedupeKey)) {
              seenSlugs.add(dedupeKey);
              allParsedDeals.push(deal);
            }
          }
        }
      }

      const parsedDeals = allParsedDeals;
      totalRead = parsedDeals.length;
      console.log(`Total unique deals (listings + map): ${totalRead}`);

      // Load existing for deduplication
      const { data: existingDeals } = await supabase
        .from("affiliate_deals")
        .select("id, origin_hash, origin_external_id, affiliate_url, title, price, image_url")
        .eq("brand_id", brand_id)
        .eq("origin", "divulgador_inteligente");

      const hashMap = new Map<string, any>();
      const slugMap = new Map<string, any>();
      const urlMap = new Map<string, any>();

      for (const d of existingDeals || []) {
        if (d.origin_hash) hashMap.set(d.origin_hash, d);
        if (d.origin_external_id) slugMap.set(d.origin_external_id, d);
        if (d.affiliate_url) urlMap.set(d.affiliate_url, d);
      }

      // Get default category
      const { data: defaultCat } = await supabase
        .from("affiliate_deal_categories")
        .select("id")
        .eq("brand_id", brand_id)
        .eq("is_active", true)
        .order("order_index")
        .limit(1)
        .single();

      for (const deal of parsedDeals) {
        try {
          const hash = md5Hex(`${deal.title}|${deal.price}|${deal.affiliate_url}`);

          const existingBySlug = deal.origin_external_id ? slugMap.get(deal.origin_external_id) : null;
          const existingByHash = hashMap.get(hash);
          const existingByUrl = urlMap.get(deal.affiliate_url);
          const existing = existingBySlug || existingByHash || existingByUrl;

          if (existing) {
            const needsUpdate =
              existing.price !== deal.price ||
              existing.image_url !== deal.image_url ||
              existing.title !== deal.title ||
              (existing.price === null && deal.price !== null);

            if (needsUpdate) {
              await supabase
                .from("affiliate_deals")
                .update({
                  title: deal.title,
                  price: deal.price,
                  original_price: deal.original_price,
                  image_url: deal.image_url,
                  badge_label: deal.badge_label,
                  store_name: deal.store_name,
                  last_synced_at: new Date().toISOString(),
                  sync_status: "synced",
                  sync_error: null,
                  ...(debugMode ? { raw_payload: { html: deal.raw_html } } : {}),
                })
                .eq("id", existing.id);
              totalUpdated++;
            } else {
              await supabase
                .from("affiliate_deals")
                .update({
                  last_synced_at: new Date().toISOString(),
                  sync_status: "synced",
                })
                .eq("id", existing.id);
              totalSkipped++;
            }
          } else {
            const now = new Date().toISOString();
            await supabase.from("affiliate_deals").insert({
              brand_id,
              title: deal.title,
              description: deal.title,
              price: deal.price,
              original_price: deal.original_price,
              image_url: deal.image_url,
              affiliate_url: deal.affiliate_url,
              badge_label: deal.badge_label,
              store_name: deal.store_name,
              is_active: autoActivate,
              origin: "divulgador_inteligente",
              origin_external_id: deal.origin_external_id,
              origin_url: deal.origin_url,
              origin_hash: hash,
              visible_driver: autoVisibleDriver,
              sync_status: "synced",
              first_imported_at: now,
              last_synced_at: now,
              category_id: defaultCat?.id || null,
              order_index: 0,
              ...(debugMode ? { raw_payload: { html: deal.raw_html } } : {}),
            });
            totalNew++;
          }
        } catch (itemError: any) {
          totalErrors++;
          errorDetails.push({
            title: deal.title,
            error: itemError.message,
          });
          console.error("Error processing deal:", deal.title, itemError);
        }
      }
    } catch (scrapeError: any) {
      totalErrors++;
      errorDetails.push({ phase: "scrape", error: scrapeError.message });
      console.error("Scrape error:", scrapeError);
    }

    // Update log
    const summary = `Lidos: ${totalRead} | Novos: ${totalNew} | Atualizados: ${totalUpdated} | Ignorados: ${totalSkipped} | Erros: ${totalErrors}`;
    if (logId) {
      await supabase
        .from("mirror_sync_logs")
        .update({
          finished_at: new Date().toISOString(),
          total_read: totalRead,
          total_new: totalNew,
          total_updated: totalUpdated,
          total_skipped: totalSkipped,
          total_errors: totalErrors,
          status: totalErrors > 0 && totalNew === 0 ? "error" : "success",
          summary,
          details: errorDetails.length > 0 ? errorDetails : null,
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        total_read: totalRead,
        total_new: totalNew,
        total_updated: totalUpdated,
        total_skipped: totalSkipped,
        total_errors: totalErrors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Mirror sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
