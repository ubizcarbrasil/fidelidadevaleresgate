import { supabase } from "@/integrations/supabase/client";
import type { JanelaArtilharia, TopRider } from "../types/tipos_artilharia";
import { withCampeonatoRpcRetry } from "../utils/rpc_retry";

export async function obterTopRiders(
  seasonId: string,
  window: JanelaArtilharia,
): Promise<TopRider[]> {
  const { data, error } = await withCampeonatoRpcRetry(
    () => (supabase as any).rpc("driver_get_top_riders", {
      p_season_id: seasonId,
      p_window: window,
    }),
    "artilharia",
  );
  if (error) throw error;
  return (data ?? []) as TopRider[];
}