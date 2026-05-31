// Match fuzzy de produto → categoria, com mapa direto (API_CATEGORY_MAP) e
// fallback de keyword scoring.

import { normalize } from "./helpers.ts";
import type { DealCategory } from "./types.ts";

export const API_CATEGORY_MAP: Record<string, string[]> = {
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

export function matchDealToCategory(
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
