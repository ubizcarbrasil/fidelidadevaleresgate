// Scraping da página vitrine do Divulgador Inteligente — extrai preços reais
// do HTML porque o JSON da API às vezes vem desatualizado.

import { cleanPrice } from "./helpers.ts";
import type { VitrinePriceEntry } from "./types.ts";

export async function scrapeVitrinePrices(originUrl: string, sitename: string): Promise<Map<string, VitrinePriceEntry>> {
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
