import { supabase } from "@/integrations/supabase/client";
import type { BracketResponseV2 } from "../types/tipos_chaveamento_motorista";
import { withCampeonatoRpcRetry } from "../utils/rpc_retry";

export async function obterBracketV2(
  seasonId: string,
  tierId: string,
  driverId: string,
): Promise<BracketResponseV2> {
  const { data, error } = await withCampeonatoRpcRetry(
    () => (supabase as any).rpc("driver_get_bracket_v2", {
      p_season_id: seasonId,
      p_tier_id: tierId,
      p_driver_id: driverId,
    }),
    "chaveamento",
  );
  if (error) throw error;
  return (data as BracketResponseV2) ?? { season_info: null, brackets: [] };
}