import { supabase } from "@/integrations/supabase/client";
import type { CategoriaOferta, MarcaOfertas, OfertaPublica } from "../types/tipos_ofertas";

export async function buscarMarcaPorId(brandId: string): Promise<MarcaOfertas | null> {
  const { data } = await supabase
    .from("public_brands_safe")
    .select("id, name, brand_settings_json")
    .eq("id", brandId)
    .eq("is_active", true)
    .maybeSingle();
  return (data as any) ?? null;
}

/**
 * Resolve um brand_id a partir do hostname, espelhando a lógica de
 * `resolveBrandByDomain` do BrandContext: tenta subdomain match e depois
 * domínio completo (com e sem www) na tabela `brand_domains`.
 */
export async function buscarBrandIdPorHostname(hostnameRaw: string): Promise<string | null> {
  const hostname = hostnameRaw.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase().trim();

  const parts = hostname.split(".");
  if (parts.length >= 2) {
    const subdomain = parts[0];
    if (!["root", "www", "app", "localhost"].includes(subdomain)) {
      const { data } = await supabase
        .from("brand_domains")
        .select("brand_id")
        .eq("subdomain", subdomain)
        .eq("is_active", true)
        .maybeSingle();
      if (data?.brand_id) return data.brand_id;
    }
  }

  const domainsToTry = [hostname];
  if (hostname.startsWith("www.")) domainsToTry.push(hostname.replace("www.", ""));
  else domainsToTry.push(`www.${hostname}`);

  for (const domain of domainsToTry) {
    const { data } = await supabase
      .from("brand_domains")
      .select("brand_id")
      .eq("domain", domain)
      .eq("is_active", true)
      .maybeSingle();
    if (data?.brand_id) return data.brand_id;
  }

  return null;
}

export async function buscarOfertasAtivas(brandId: string): Promise<OfertaPublica[]> {
  const { data } = await supabase
    .from("affiliate_deals")
    .select(
      "id, title, description, image_url, price, original_price, affiliate_url, store_name, store_logo_url, badge_label, category_id, created_at, origin, is_featured"
    )
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .eq("visible_driver" as any, true)
    .order("is_featured", { ascending: false })
    .order("order_index")
    .limit(500);
  return (data ?? []) as OfertaPublica[];
}

export async function buscarCategoriasAtivas(brandId: string): Promise<CategoriaOferta[]> {
  const { data } = await supabase
    .from("affiliate_deal_categories")
    .select("id, name, icon_name, color")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .order("order_index");
  return (data ?? []) as CategoriaOferta[];
}