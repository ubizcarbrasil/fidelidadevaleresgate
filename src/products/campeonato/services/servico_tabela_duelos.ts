import { supabase } from "@/integrations/supabase/client";
import type {
  ConfrontoListagem,
  RodadaResumo,
} from "../types/tipos_tabela_duelos";
import { withCampeonatoRpcRetry } from "../utils/rpc_retry";

export async function listarRodadasDoTier(
  seasonId: string,
  tierId: string | null,
  driverId: string,
): Promise<RodadaResumo[]> {
  const { data, error } = await withCampeonatoRpcRetry(
    () => supabase.rpc(
      "driver_list_tier_rounds" as any,
      {
        p_season_id: seasonId,
        p_tier_id: tierId,
        p_driver_id: driverId,
      },
    ),
    "rodadas",
  );
  if (error) throw error;
  return ((data as unknown as RodadaResumo[]) ?? []);
}

export async function listarConfrontosDaRodada(
  seasonId: string,
  tierId: string | null,
  round: string,
  driverId: string,
): Promise<ConfrontoListagem[]> {
  const { data, error } = await withCampeonatoRpcRetry(
    () => supabase.rpc(
      "driver_list_tier_round_matches" as any,
      {
        p_season_id: seasonId,
        p_tier_id: tierId,
        p_round: round,
        p_driver_id: driverId,
      },
    ),
    "confrontos",
  );
  if (error) throw error;
  return ((data as unknown as ConfrontoListagem[]) ?? []);
}