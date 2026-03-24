/**
 * Motor de categorização automática de Achadinhos (client-side).
 * Porta da lógica do mirror-sync edge function para uso na importação.
 */

export interface CategoriaAchadinho {
  id: string;
  name: string;
  keywords: string[];
}

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

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Tenta encontrar a melhor categoria para um deal com base no título, descrição e categoria de origem.
 * Retorna { id, name } ou null se nenhuma correspondência atingir o score mínimo.
 */
export function sugerirCategoria(
  titulo: string,
  descricao: string | null,
  categoriaOrigem: string | null,
  nomeLoja: string | null,
  categorias: CategoriaAchadinho[]
): { id: string; name: string } | null {
  // 1. Tradução direta do campo de categoria
  if (categoriaOrigem) {
    const normApiCat = normalize(categoriaOrigem);
    const mappedNames = API_CATEGORY_MAP[normApiCat];
    if (mappedNames) {
      for (const mappedName of mappedNames) {
        for (const cat of categorias) {
          if (normalize(cat.name) === mappedName) {
            return { id: cat.id, name: cat.name };
          }
        }
      }
    }
    // Match direto
    for (const cat of categorias) {
      if (normalize(cat.name) === normApiCat) {
        return { id: cat.id, name: cat.name };
      }
    }
    // Match parcial
    for (const cat of categorias) {
      const normName = normalize(cat.name);
      if (normApiCat.includes(normName) || normName.includes(normApiCat)) {
        return { id: cat.id, name: cat.name };
      }
    }
  }

  // 2. Keyword scoring
  const text = normalize(
    [titulo, descricao, categoriaOrigem, nomeLoja].filter(Boolean).join(" ")
  );

  let bestCat: { id: string; name: string } | null = null;
  let bestScore = 0;
  const MIN_SCORE = 4;

  for (const cat of categorias) {
    let score = 0;
    for (const kw of cat.keywords) {
      const nkw = normalize(kw);
      if (nkw.length === 0) continue;
      const escaped = nkw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(
        `(?:^|\\s|[^a-z0-9])${escaped}(?:$|\\s|[^a-z0-9])`,
        "i"
      );
      if (regex.test(` ${text} `)) {
        score += nkw.length;
      }
    }
    if (score > bestScore && score >= MIN_SCORE) {
      bestScore = score;
      bestCat = { id: cat.id, name: cat.name };
    }
  }

  return bestCat;
}
