import { supabase } from "@/integrations/supabase/client";

export interface RetornoInscricaoTemporada {
  success: boolean;
  status?: "pending" | "approved";
  enrollment_id?: string;
  error?: string;
}

/**
 * Wrapper da RPC `driver_enroll_season`. A RPC é SECURITY DEFINER e
 * resolve o motorista internamente via auth.uid().
 */
export async function inscreverMotoristaTemporada(
  seasonId: string,
): Promise<RetornoInscricaoTemporada> {
  const { data, error } = await (supabase as any).rpc("driver_enroll_season", {
    p_season_id: seasonId,
  });
  if (error) {
    return { success: false, error: error.message ?? "Erro ao inscrever-se." };
  }
  return (data ?? { success: false, error: "Resposta vazia." }) as RetornoInscricaoTemporada;
}