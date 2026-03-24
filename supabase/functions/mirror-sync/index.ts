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

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return url.split("?")[0].split("#")[0].replace(/\/$/, "");
  }
}

async function processInBatches<T, R>(items: T[], batchSize: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

// ---------- Phase 1: Link discovery from listing pages ----------

interface DiscoveredLink {
  url: string;
  normalizedUrl: string;
  slug: string | null;
  sourcePageUrl: string;
}

interface PageDiscoveryResult {
  url: string;
  htmlLength: number;
  linksFound: number;
  cardsParsed: number;
  discarded: number;
  durationMs: number;
  sampleTitles: string[];
  sampleLinks: string[];
  error?: string;
  links: DiscoveredLink[];
  cards: ParsedCard[];
}

interface ParsedCard {
  title: string;
  price: number | null;
  originalPrice: number | null;
  imageUrl: string | null;
  affiliateUrl: string;
  badgeLabel: string | null;
  slug: string | null;
  storeName: string | null;
  rawHtml: string;
}

function discoverLinksFromHtml(html: string, baseUrl: string, sourcePageUrl: string): DiscoveredLink[] {
  const links: DiscoveredLink[] = [];
  const seen = new Set<string>();
  
  // Extract ALL hrefs containing /ubizresgata/p/ or /p/ patterns
  const linkRegex = /href="([^"]*\/(?:ubizresgata\/)?p\/[A-Za-z0-9_-]+[^"]*)"/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];
    if (!href.startsWith("http")) {
      href = href.startsWith("/") ? `${baseUrl}${href}` : `${baseUrl}/${href}`;
    }
    const normalized = normalizeUrl(href);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      links.push({
        url: href,
        normalizedUrl: normalized,
        slug: extractSlug(href),
        sourcePageUrl,
      });
    }
  }
  return links;
}

function parseCardsFromHtml(html: string, baseUrl: string): ParsedCard[] {
  const cards: ParsedCard[] = [];
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

      cards.push({
        title,
        price,
        originalPrice,
        imageUrl,
        affiliateUrl: fullUrl,
        badgeLabel,
        slug,
        storeName,
        rawHtml: cardHtml.substring(0, 2000),
      });
    } catch (e) {
      console.error("Error parsing card:", e);
    }
  }
  return cards;
}

async function scrapeListingPage(url: string, firecrawlKey: string): Promise<PageDiscoveryResult> {
  const startTime = Date.now();
  try {
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
        actions: [
          { type: "wait", milliseconds: 2000 },
          { type: "scroll", direction: "down" },
          { type: "wait", milliseconds: 2000 },
          { type: "scroll", direction: "down" },
          { type: "wait", milliseconds: 2000 },
          { type: "scroll", direction: "down" },
          { type: "wait", milliseconds: 2000 },
          { type: "scroll", direction: "down" },
          { type: "wait", milliseconds: 2000 },
          { type: "scroll", direction: "down" },
          { type: "wait", milliseconds: 2000 },
        ],
      }),
    });

    const scrapeData = await scrapeResponse.json();
    const durationMs = Date.now() - startTime;

    if (!scrapeResponse.ok) {
      return {
        url, htmlLength: 0, linksFound: 0, cardsParsed: 0, discarded: 0,
        durationMs, sampleTitles: [], sampleLinks: [], links: [], cards: [],
        error: scrapeData?.error || `HTTP ${scrapeResponse.status}`,
      };
    }

    const html = scrapeData?.data?.html || scrapeData?.html || "";
    if (!html) {
      return {
        url, htmlLength: 0, linksFound: 0, cardsParsed: 0, discarded: 0,
        durationMs, sampleTitles: [], sampleLinks: [], links: [], cards: [],
        error: "No HTML returned",
      };
    }

    const baseUrl = new URL(url).origin;
    const links = discoverLinksFromHtml(html, baseUrl, url);
    const cards = parseCardsFromHtml(html, baseUrl);

    return {
      url,
      htmlLength: html.length,
      linksFound: links.length,
      cardsParsed: cards.length,
      discarded: 0,
      durationMs,
      sampleTitles: cards.slice(0, 10).map(c => c.title),
      sampleLinks: links.slice(0, 10).map(l => l.url),
      links,
      cards,
      error: undefined,
    };
  } catch (e: any) {
    return {
      url, htmlLength: 0, linksFound: 0, cardsParsed: 0, discarded: 0,
      durationMs: Date.now() - startTime, sampleTitles: [], sampleLinks: [],
      links: [], cards: [], error: e.message,
    };
  }
}

// ---------- Phase 2: Individual product scrape ----------

interface ProductDetail {
  slug: string;
  url: string;
  title: string;
  price: number | null;
  originalPrice: number | null;
  imageUrl: string | null;
  storeName: string | null;
  badgeLabel: string | null;
  description: string | null;
  success: boolean;
  error?: string;
}

async function scrapeProductPage(url: string, slug: string, firecrawlKey: string): Promise<ProductDetail> {
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["html"],
        waitFor: 2000,
        onlyMainContent: false,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return { slug, url, title: "", price: null, originalPrice: null, imageUrl: null, storeName: null, badgeLabel: null, description: null, success: false, error: data?.error || `HTTP ${resp.status}` };
    }

    const html = data?.data?.html || data?.html || "";
    if (!html) {
      return { slug, url, title: "", price: null, originalPrice: null, imageUrl: null, storeName: null, badgeLabel: null, description: null, success: false, error: "No HTML" };
    }

    // Extract title from og:title or h1
    let title = "";
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
    if (ogTitleMatch) title = ogTitleMatch[1];
    if (!title) {
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match) title = h1Match[1].trim();
    }

    // Extract image from og:image
    let imageUrl: string | null = null;
    const ogImgMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    if (ogImgMatch) imageUrl = ogImgMatch[1];

    // Extract prices
    const priceRegex = /R\$(?:&nbsp;|\s)*([\d.,]+)/g;
    let priceMatch;
    const rawPrices: number[] = [];
    while ((priceMatch = priceRegex.exec(html)) !== null) {
      const val = cleanPrice(priceMatch[1]);
      if (val !== null && val > 0 && val < 100000) rawPrices.push(val);
    }

    let price: number | null = null;
    let originalPrice: number | null = null;
    if (rawPrices.length >= 2) {
      const sorted = [...new Set(rawPrices)].sort((a, b) => a - b);
      price = sorted[0];
      originalPrice = sorted[sorted.length - 1];
      if (price === originalPrice) originalPrice = null;
    } else if (rawPrices.length === 1) {
      price = rawPrices[0];
    }

    // Extract store name
    const storeMatch = html.match(/\/lojas\/([^"\/\s]+)/i);
    const storeName = storeMatch
      ? decodeURIComponent(storeMatch[1]).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
      : null;

    // Extract description from og:description
    let description: string | null = null;
    const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
    if (ogDescMatch) description = ogDescMatch[1];

    // Badge
    const discountMatch = html.match(/>-(?:<!-- -->)?(\d+)(?:<!-- -->)?%</);
    const badgeLabel = discountMatch ? `-${discountMatch[1]}%` : null;

    if (!title) title = "Oferta sem título";

    return { slug, url, title, price, originalPrice, imageUrl, storeName, badgeLabel, description, success: true };
  } catch (e: any) {
    return { slug, url, title: "", price: null, originalPrice: null, imageUrl: null, storeName: null, badgeLabel: null, description: null, success: false, error: e.message };
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

    // ========== PHASE 1: Discovery ==========
    console.log(`[Phase 1] Scraping ${urls.length} listing pages in parallel batches of 3...`);

    const pageResults = await processInBatches(urls, 3, (url) => scrapeListingPage(url, firecrawlKey));

    // Collect all unique links and cards
    const allLinks = new Map<string, DiscoveredLink>(); // normalized URL -> link
    const allCards = new Map<string, ParsedCard>(); // slug or normalized URL -> card
    let duplicatesCrossPage = 0;

    const pagesDigest = pageResults.map(pr => ({
      url: pr.url,
      html_length: pr.htmlLength,
      links_found: pr.linksFound,
      cards_parsed: pr.cardsParsed,
      discarded: pr.discarded,
      duration_ms: pr.durationMs,
      sample_titles: pr.sampleTitles,
      sample_links: pr.sampleLinks,
      error: pr.error || null,
    }));

    for (const pr of pageResults) {
      for (const link of pr.links) {
        if (allLinks.has(link.normalizedUrl)) {
          duplicatesCrossPage++;
        } else {
          allLinks.set(link.normalizedUrl, link);
        }
      }
      for (const card of pr.cards) {
        const key = card.slug || normalizeUrl(card.affiliateUrl);
        if (!allCards.has(key)) {
          allCards.set(key, card);
        }
      }
    }

    const totalLinksRaw = pageResults.reduce((s, pr) => s + pr.linksFound, 0);
    const uniqueLinks = allLinks.size;

    console.log(`[Phase 1] Total raw links: ${totalLinksRaw}, Unique: ${uniqueLinks}, Cards: ${allCards.size}`);

    // Load existing deals for deduplication
    const { data: existingDeals } = await supabase
      .from("affiliate_deals")
      .select("id, origin_hash, origin_external_id, affiliate_url, title, price, image_url")
      .eq("brand_id", brand_id)
      .eq("origin", "divulgador_inteligente");

    const existingBySlug = new Map<string, any>();
    const existingByUrl = new Map<string, any>();
    for (const d of existingDeals || []) {
      if (d.origin_external_id) existingBySlug.set(d.origin_external_id, d);
      if (d.affiliate_url) existingByUrl.set(normalizeUrl(d.affiliate_url), d);
    }

    // Determine which links are new (not in DB)
    const newLinks: DiscoveredLink[] = [];
    let alreadyInDb = 0;
    for (const [normUrl, link] of allLinks) {
      const slug = link.slug;
      if ((slug && existingBySlug.has(slug)) || existingByUrl.has(normUrl)) {
        alreadyInDb++;
      } else {
        newLinks.push(link);
      }
    }

    const discoveryDigest = {
      total_links_raw: totalLinksRaw,
      unique_links: uniqueLinks,
      unique_cards: allCards.size,
      duplicates_cross_page: duplicatesCrossPage,
      already_in_db: alreadyInDb,
      new_to_scrape: newLinks.length,
    };

    console.log(`[Phase 1] Already in DB: ${alreadyInDb}, New to scrape: ${newLinks.length}`);

    // ========== DIAGNOSE MODE: Return discovery report only ==========
    if (isDiagnose) {
      const report = {
        success: true,
        mode: "diagnose",
        pages: pagesDigest,
        discovery: discoveryDigest,
        new_links_sample: newLinks.slice(0, 20).map(l => ({ url: l.url, slug: l.slug })),
        existing_count: existingDeals?.length || 0,
      };
      return new Response(JSON.stringify(report), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== SYNC MODE ==========
    const logEntry = await supabase
      .from("mirror_sync_logs")
      .insert({ brand_id, origin: "divulgador_inteligente", status: "running" })
      .select("id")
      .single();
    const logId = logEntry.data?.id;

    let totalNew = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const errorDetails: any[] = [];

    // Get default category
    const { data: defaultCat } = await supabase
      .from("affiliate_deal_categories")
      .select("id")
      .eq("brand_id", brand_id)
      .eq("is_active", true)
      .order("order_index")
      .limit(1)
      .single();

    // --- Update existing deals from card data ---
    for (const [key, card] of allCards) {
      try {
        const slug = card.slug;
        const normUrl = normalizeUrl(card.affiliateUrl);
        const existing = (slug && existingBySlug.get(slug)) || existingByUrl.get(normUrl);

        if (existing) {
          const needsUpdate =
            existing.price !== card.price ||
            existing.image_url !== card.imageUrl ||
            existing.title !== card.title;

          if (needsUpdate) {
            await supabase
              .from("affiliate_deals")
              .update({
                title: card.title,
                price: card.price,
                original_price: card.originalPrice,
                image_url: card.imageUrl,
                badge_label: card.badgeLabel,
                store_name: card.storeName,
                last_synced_at: new Date().toISOString(),
                sync_status: "synced",
                sync_error: null,
                ...(debugMode ? { raw_payload: { html: card.rawHtml } } : {}),
              })
              .eq("id", existing.id);
            totalUpdated++;
          } else {
            await supabase
              .from("affiliate_deals")
              .update({ last_synced_at: new Date().toISOString(), sync_status: "synced" })
              .eq("id", existing.id);
            totalSkipped++;
          }
        }
      } catch (e: any) {
        totalErrors++;
        errorDetails.push({ phase: "update_existing", title: card.title, error: e.message });
      }
    }

    // --- Phase 2: Scrape new products individually ---
    console.log(`[Phase 2] Scraping ${newLinks.length} new products in batches of 5...`);

    const phase2Results: ProductDetail[] = [];

    if (newLinks.length > 0) {
      const products = await processInBatches(newLinks, 5, (link) =>
        scrapeProductPage(link.url, link.slug || extractSlug(link.url) || md5Hex(link.url), firecrawlKey)
      );
      phase2Results.push(...products);

      // Also insert new items found from cards that aren't in DB
      for (const [key, card] of allCards) {
        const slug = card.slug;
        const normUrl = normalizeUrl(card.affiliateUrl);
        const existing = (slug && existingBySlug.get(slug)) || existingByUrl.get(normUrl);
        if (!existing) {
          // This card is new, insert it
          try {
            const hash = md5Hex(`${card.affiliateUrl}`);
            const now = new Date().toISOString();
            await supabase.from("affiliate_deals").insert({
              brand_id,
              title: card.title,
              description: card.title,
              price: card.price,
              original_price: card.originalPrice,
              image_url: card.imageUrl,
              affiliate_url: card.affiliateUrl,
              badge_label: card.badgeLabel,
              store_name: card.storeName,
              is_active: autoActivate,
              origin: "divulgador_inteligente",
              origin_external_id: card.slug,
              origin_url: card.affiliateUrl,
              origin_hash: hash,
              visible_driver: autoVisibleDriver,
              sync_status: "synced",
              first_imported_at: now,
              last_synced_at: now,
              category_id: defaultCat?.id || null,
              order_index: 0,
              ...(debugMode ? { raw_payload: { html: card.rawHtml } } : {}),
            });
            totalNew++;
            // Mark as existing to avoid duplicate insert from phase2
            if (card.slug) existingBySlug.set(card.slug, { id: "new" });
            existingByUrl.set(normUrl, { id: "new" });
          } catch (e: any) {
            totalErrors++;
            errorDetails.push({ phase: "insert_from_card", title: card.title, error: e.message });
          }
        }
      }

      // Insert products from phase 2 that are truly new
      for (const product of products) {
        if (!product.success || !product.title) continue;
        const normUrl = normalizeUrl(product.url);
        if (existingBySlug.has(product.slug || "") || existingByUrl.has(normUrl)) continue;

        try {
          const hash = md5Hex(product.url);
          const now = new Date().toISOString();
          await supabase.from("affiliate_deals").insert({
            brand_id,
            title: product.title,
            description: product.description || product.title,
            price: product.price,
            original_price: product.originalPrice,
            image_url: product.imageUrl,
            affiliate_url: product.url,
            badge_label: product.badgeLabel,
            store_name: product.storeName,
            is_active: autoActivate,
            origin: "divulgador_inteligente",
            origin_external_id: product.slug,
            origin_url: product.url,
            origin_hash: hash,
            visible_driver: autoVisibleDriver,
            sync_status: "synced",
            first_imported_at: now,
            last_synced_at: now,
            category_id: defaultCat?.id || null,
            order_index: 0,
          });
          totalNew++;
          if (product.slug) existingBySlug.set(product.slug, { id: "new" });
          existingByUrl.set(normUrl, { id: "new" });
        } catch (e: any) {
          totalErrors++;
          errorDetails.push({ phase: "insert_from_phase2", title: product.title, slug: product.slug, error: e.message });
        }
      }
    }

    const totalRead = allCards.size + phase2Results.filter(p => p.success).length;

    const phase2Digest = {
      scraped: phase2Results.length,
      parsed_ok: phase2Results.filter(p => p.success).length,
      parse_failed: phase2Results.filter(p => !p.success).length,
      samples: phase2Results.slice(0, 5).map(p => ({ slug: p.slug, title: p.title, success: p.success, error: p.error })),
    };

    const dedupAudit = {
      by_url: duplicatesCrossPage,
      already_in_db: alreadyInDb,
      new_discovered: newLinks.length,
    };

    const details = {
      pages: pagesDigest,
      discovery: discoveryDigest,
      dedup_audit: dedupAudit,
      phase2: phase2Digest,
      totals: { total_read: totalRead, persisted_new: totalNew, updated: totalUpdated, skipped: totalSkipped, errors: totalErrors },
    };

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
          status: totalErrors > 0 && totalNew === 0 && totalUpdated === 0 ? "error" : "success",
          summary,
          details,
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({ success: true, summary, details }),
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
