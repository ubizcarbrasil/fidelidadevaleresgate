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