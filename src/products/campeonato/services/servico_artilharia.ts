import { supabase } from "@/integrations/supabase/client";
import type { JanelaArtilharia, TopRider } from "../types/tipos_artilharia";

export async function obterTopRiders(
  seasonId: string,
  window: JanelaArtilharia,
): Promise<TopRider[]> {
  const { data, error } = await (supabase as any).rpc("driver_get_top_riders", {
    p_season_id: seasonId,
    p_window: window,
  });
  if (error) throw error;
  return (data ?? []) as TopRider[];
}