import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Cache to avoid repeated queries during same session
let cachedBaseUrls: Record<string, string> = {};

const PUBLISHED_ORIGIN = "https://fidelidadevaleresgate.lovable.app";

/**
 * Resolves the canonical origin for a brand.
 * Resolution order:
 *   1. brand_settings_json.driver_public_base_url
 *   2. Primary active domain from brand_domains
 *   3. Published app origin
 *
 * Uses public_brands_safe view to work in anonymous sessions (mobile/driver).
 */
export async function getPublicOrigin(brandId: string): Promise<string> {
  if (cachedBaseUrls[brandId]) return cachedBaseUrls[brandId];

  try {
    // Step 1: check brand settings via public-safe view (no RLS issues)
    const { data: brandData } = await supabase
      .from("public_brands_safe")
      .select("brand_settings_json")
      .eq("id", brandId)
      .maybeSingle();
    const settings = brandData?.brand_settings_json as Record<string, unknown> | null;
    const configuredUrl = (settings?.driver_public_base_url as string)?.trim().replace(/\/+$/, "");
    if (configuredUrl) {
      cachedBaseUrls[brandId] = configuredUrl;
      return configuredUrl;
    }

    // Step 2: check brand_domains for a primary active domain
    const { data: domainData } = await supabase
      .from("brand_domains")
      .select("domain")
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .eq("is_primary", true)
      .limit(1)
      .maybeSingle();
    if (domainData?.domain) {
      const domainOrigin = `https://${domainData.domain.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
      cachedBaseUrls[brandId] = domainOrigin;
      return domainOrigin;
    }
  } catch {
    // silently fall back
  }

  // Step 3: always use published origin (never window.location.origin)
  cachedBaseUrls[brandId] = PUBLISHED_ORIGIN;
  return PUBLISHED_ORIGIN;
}

/**
 * Returns a synchronous best-effort origin without async calls.
 * Uses cache if available, otherwise falls back to published origin.
 */
export function getPublicOriginSync(brandId: string): string {
  return cachedBaseUrls[brandId] || PUBLISHED_ORIGIN;
}

/**
 * Resolves canonical origin from already-fetched brand settings (no extra query).
 * Used by DriverPanelPage which already has brand data.
 */
export async function resolveCanonicalOriginFromSettings(
  brandId: string,
  settings: Record<string, unknown> | null,
): Promise<string> {
  // Check cache first
  if (cachedBaseUrls[brandId]) return cachedBaseUrls[brandId];

  // 1. Configured base URL
  const configuredUrl = (settings?.driver_public_base_url as string)?.trim().replace(/\/+$/, "");
  if (configuredUrl) {
    cachedBaseUrls[brandId] = configuredUrl;
    return configuredUrl;
  }

  // 2. Brand domain
  try {
    const { data } = await supabase
      .from("brand_domains")
      .select("domain")
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .eq("is_primary", true)
      .limit(1)
      .maybeSingle();
    if (data?.domain) {
      const origin = `https://${data.domain.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
      cachedBaseUrls[brandId] = origin;
      return origin;
    }
  } catch { /* fall through */ }

  // 3. Published origin
  cachedBaseUrls[brandId] = PUBLISHED_ORIGIN;
  return PUBLISHED_ORIGIN;
}

/**
 * Builds a public /driver share URL.
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
      if (e?.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  } catch {
    toast({ title: "Não foi possível copiar o link", variant: "destructive" });
  }
}
