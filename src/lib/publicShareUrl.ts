import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Cache to avoid repeated queries during same session
let cachedBaseUrls: Record<string, string> = {};

/**
 * Returns the public origin for share URLs.
 * Checks brand_settings_json.driver_public_base_url first, falls back to window.location.origin.
 */
export async function getPublicOrigin(brandId: string): Promise<string> {
  if (cachedBaseUrls[brandId]) return cachedBaseUrls[brandId];

  try {
    const { data } = await supabase
      .from("brands")
      .select("brand_settings_json")
      .eq("id", brandId)
      .maybeSingle();
    const settings = data?.brand_settings_json as Record<string, unknown> | null;
    const configuredUrl = (settings?.driver_public_base_url as string)?.trim().replace(/\/+$/, "");
    if (configuredUrl) {
      cachedBaseUrls[brandId] = configuredUrl;
      return configuredUrl;
    }
  } catch {
    // silently fall back
  }

  const fallback = window.location.origin;
  cachedBaseUrls[brandId] = fallback;
  return fallback;
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
