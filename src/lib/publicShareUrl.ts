import { toast } from "@/hooks/use-toast";

/**
 * Returns the public origin for share URLs.
 * Uses current origin directly to avoid broken links from unconfigured domains.
 */
export async function getPublicOrigin(_brandId: string): Promise<string> {
  return window.location.origin;
}

/**
 * Builds a public /driver share URL synchronously using current origin as fallback.
 */
export function buildDriverUrl(origin: string, brandId: string, opts?: { categoryId?: string; dealId?: string }) {
  const base = `${origin}/driver?brandId=${brandId}`;
  if (opts?.dealId) return `${base}&dealId=${opts.dealId}`;
  if (opts?.categoryId) return `${base}&categoryId=${opts.categoryId}`;
  return base;
}

/**
 * Share or copy a public driver URL, with clipboard fallback.
 */
export async function shareDriverUrl(brandId: string, title: string, opts?: { categoryId?: string; dealId?: string }) {
  const origin = await getPublicOrigin(brandId);
  const url = buildDriverUrl(origin, brandId, opts);

  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch (e: any) {
      if (e?.name === "AbortError") return; // user cancelled
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  } catch {
    toast({ title: "Não foi possível copiar o link", variant: "destructive" });
  }
}
