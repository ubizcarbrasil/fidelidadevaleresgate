import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getBootContext } from "@/lib/bootContext";
import { bootMark } from "@/lib/bootMetrics";
import { distanceKm, type Coords } from "@/lib/geolocation";

export type Brand = Tables<"brands">;
export type Branch = Tables<"branches">;

export function isTransientNetworkError(err: unknown): boolean {
  const msg = (err as { message?: string })?.message ?? "";
  return msg.includes("Load failed") || msg.includes("Failed to fetch") || msg.includes("NetworkError");
}

export async function withNetworkRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransientNetworkError(err) || attempt === maxAttempts - 1) throw err;
      const delayMs = 500 * Math.pow(2, attempt);
      console.warn(`[BrandContext] transient network error (attempt ${attempt + 1}/${maxAttempts}), retrying in ${delayMs}ms`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

export async function fetchBrandById(brandId: string): Promise<Brand | null> {
  try {
    const boot = await getBootContext();
    if (boot?.brand && boot.brand.id === brandId) {
      bootMark("brand:from-cache");
      return boot.brand as unknown as Brand;
    }
  } catch {
    /* cache miss */
  }

  const { data: publicBrand } = await withNetworkRetry(async () => {
    const result = await supabase
      .from("public_brands_safe")
      .select("*")
      .eq("id", brandId)
      .single();
    if (result.error && isTransientNetworkError(result.error)) throw result.error;
    return result;
  });

  if (publicBrand) {
    bootMark("brand:from-public-view");
    return publicBrand as unknown as Brand;
  }

  const { data: brand } = await withNetworkRetry(async () => {
    const result = await supabase
      .from("brands")
      .select("*")
      .eq("id", brandId)
      .single();
    if (result.error && isTransientNetworkError(result.error)) throw result.error;
    return result;
  });

  bootMark("brand:from-brands-table");
  return brand;
}

export async function resolveBrandByDomain(hostname: string): Promise<Brand | null> {
  hostname = hostname.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase().trim();

  const parts = hostname.split(".");
  const subdomain = parts.length >= 2 ? parts[0] : "";
  const skipSubdomain = ["root", "www", "app", "localhost", ""].includes(subdomain);
  const hostnameNoWww = hostname.startsWith("www.") ? hostname.replace("www.", "") : hostname;
  const hostnameWithWww = hostname.startsWith("www.") ? hostname : `www.${hostname}`;

  const subdomainQuery = skipSubdomain
    ? Promise.resolve({ data: null as { brand_id: string } | null })
    : supabase
        .from("brand_domains")
        .select("brand_id")
        .eq("subdomain", subdomain)
        .eq("is_active", true)
        .maybeSingle()
        .then((r) => ({ data: r.data as { brand_id: string } | null }));

  const domainQuery = supabase
    .from("brand_domains")
    .select("brand_id, domain")
    .in("domain", [hostname, hostnameNoWww, hostnameWithWww])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle()
    .then((r) => ({ data: r.data as { brand_id: string } | null }));

  const [subRes, domRes] = await Promise.all([subdomainQuery, domainQuery]);

  const brandId = subRes.data?.brand_id ?? domRes.data?.brand_id;
  if (!brandId) return null;

  return fetchBrandById(brandId);
}

export function findNearestBranch(branches: Branch[], coords: Coords): Branch | null {
  let nearest: Branch | null = null;
  let minDist = Infinity;
  for (const b of branches) {
    const lat = b.latitude as number;
    const lng = b.longitude as number;
    const d = distanceKm(coords, { latitude: lat, longitude: lng });
    if (d < minDist) { minDist = d; nearest = b; }
  }
  return nearest;
}

// Detecção síncrona: domínios sem resolução por hostname (preview, portal,
// localhost) inicializam loading=false direto, sem flash de loader no boot.
const PORTAL_HOSTNAMES_SYNC = ["app.valeresgate.com.br"];

export const IS_LOCAL_HOST_SYNC = (() => {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost"
    || h.includes("lovable.app")
    || h.includes("lovableproject.com")
    || h.startsWith("root.")
    || PORTAL_HOSTNAMES_SYNC.includes(h);
})();

export const HAS_BRAND_ID_PARAM_SYNC = typeof window !== "undefined"
  && new URLSearchParams(window.location.search).has("brandId");

export function isLocalOrPortalHost(hostname: string): boolean {
  return hostname === "localhost"
    || hostname.includes("lovable.app")
    || hostname.includes("lovableproject.com")
    || hostname.startsWith("root.")
    || PORTAL_HOSTNAMES_SYNC.includes(hostname);
}
