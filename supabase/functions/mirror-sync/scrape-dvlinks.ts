// Scraping de páginas DVLinks — parser HTML específico do layout do site
// (cards com class bg-white rounded-2xl shadow-md).

import { cleanPriceDvlinks } from "./helpers.ts";
import type { DvlinksDeal } from "./types.ts";

export async function scrapeDvlinks(baseUrl: string, maxPages: number): Promise<DvlinksDeal[]> {
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

      // Each card structure:
      //   <a href="AFFILIATE_LINK"><img src="IMAGE_URL"></a>
      //   <h2>TITLE</h2>
      //   <span class="line-through">R$ORIGINAL</span>
      //   <span class="font-bold">R$PRICE</span>
      //   <a href="AFFILIATE_LINK">Ir à loja STORE_NAME</a>

      let cardsFound = 0;

      const cardBlocks = html.split(/(?=<div[^>]*class="[^"]*bg-white[^"]*rounded-2xl[^"]*shadow-md)/);

      for (const block of cardBlocks) {
        if (!block.includes('bg-white') || !block.includes('rounded-2xl')) continue;

        const linkMatch = block.match(/<a\s+href="(https?:\/\/[^"]+)"[^>]*target="_blank"[^>]*class="block"/);
        if (!linkMatch) continue;

        const affiliateUrl = linkMatch[1];
        if (seenUrls.has(affiliateUrl)) continue;
        seenUrls.add(affiliateUrl);

        const imgMatch = block.match(/<img\s+src="([^"]+)"/);
        const imageUrl = imgMatch ? imgMatch[1] : null;

        const titleMatch = block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : null;
        if (!title) continue;

        const originalPriceMatch = block.match(/<span[^>]*class="[^"]*line-through[^"]*"[^>]*>\s*(R\$[\s\S]*?)\s*<\/span>/);
        const currentPriceMatch = block.match(/<span[^>]*class="[^"]*font-bold[^"]*"[^>]*>\s*(R\$[\s\S]*?)\s*<\/span>/);

        const originalPrice = originalPriceMatch ? cleanPriceDvlinks(originalPriceMatch[1]) : null;
        const price = currentPriceMatch ? cleanPriceDvlinks(currentPriceMatch[1]) : null;

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
