import { supabase } from "@/integrations/supabase/client";
import type { HallDaFamaData } from "../types/tipos_hall_fama";

/**
 * Wrapper da RPC pública `public_get_hall_fama`.
 * Acessível por usuários anônimos (rota pública) e autenticados.
 */
export async function obterHallDaFama(
  brandSlug: string,
): Promise<HallDaFamaData> {
  const { data, error } = await supabase.rpc("public_get_hall_fama", {
    p_brand_slug: brandSlug,
  });
  if (error) throw error;
  return (data as unknown as HallDaFamaData) ?? {
    brand_name: "",
    brand_slug: brandSlug,
    seasons: [],
    ranking_titles: [],
  };
}