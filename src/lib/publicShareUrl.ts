import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

let domainCache: Map<string, string | null> = new Map();

/**
 * Fetches the primary public domain for a brand.
 * Caches result in memory to avoid repeated queries.
 */
export async function getPublicOrigin(brandId: string): Promise<string> {
  if (domainCache.has(brandId)) {
    const cached = domainCache.get(brandId);
    return cached || window.location.origin;
  }

  try {
    const { data } = await supabase
      .from("brand_domains")
      .select("domain, subdomain")
      .eq("brand_id", brandId)
      .eq("is_primary", true)
      .eq("is_active", true)
      .maybeSingle();

    const raw = data?.domain || data?.subdomain || null;
    const origin = raw
      ? `https://${raw.replace(/^https?:\/\//i, "").trim().replace(/\/$/, "")}`
      : null;

    domainCache.set(brandId, origin);
    return origin || window.location.origin;
  } catch {
    domainCache.set(brandId, null);
    return window.location.origin;
  }
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
