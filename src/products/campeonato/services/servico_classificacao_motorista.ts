import { supabase } from "@/integrations/supabase/client";
import type { LinhaClassificacaoTier } from "../types/tipos_classificacao_motorista";

export async function obterClassificacaoTier(
  seasonId: string,
  tierId: string,
  driverId: string,
): Promise<LinhaClassificacaoTier[]> {
  const { data, error } = await supabase.rpc(
    "driver_get_tier_standings_v2" as any,
    {
      p_season_id: seasonId,
      p_tier_id: tierId,
      p_driver_id: driverId,
    },
  );
  if (error) throw error;
  return ((data as unknown as LinhaClassificacaoTier[]) ?? []);
}