// Parsers de preço + utilitários puros, sem efeitos colaterais.

export function cleanPrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d,\.]/g, "").replace(/\./g, "").replace(",", ".");
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

/** US-format price parser for DVLinks (dot = decimal, comma = thousands) */
export function cleanPriceDvlinks(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d,\.]/g, "");
  const noDots = cleaned.replace(/,/g, "");
  const val = parseFloat(noDots);
  return isNaN(val) || val <= 0 ? null : val;
}

export function extractSitename(originUrl: string): string {
  try {
    const u = new URL(originUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[0] || "ubizresgata";
  } catch {
    return "ubizresgata";
  }
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
