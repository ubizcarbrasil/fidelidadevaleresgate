import { supabase } from "@/integrations/supabase/client";
import type {
  ParaCriarLote,
  RespostaCriacaoLote,
  RespostaSugestoes,
} from "../types/tipos_duelos_matching";

/**
 * Camada de integração com as RPCs de matching e criação em massa.
 */

export async function buscarSugestoesDuelo(
  branchId: string,
  toleranciaVolume: number,
  limite = 50,
): Promise<RespostaSugestoes> {
  const { data, error } = await supabase.rpc("get_duel_match_suggestions", {
    p_branch_id: branchId,
    p_volume_tolerance: toleranciaVolume,
    p_limit: limite,
  });

  if (error) throw error;
  const resp = (data ?? {}) as unknown as Partial<RespostaSugestoes>;

  return {
    success: !!resp.success,
    pairs: Array.isArray(resp.pairs) ? resp.pairs : [],
    pairs_count: typeof resp.pairs_count === "number" ? resp.pairs_count : 0,
    no_data_drivers: Array.isArray(resp.no_data_drivers) ? resp.no_data_drivers : [],
    error: resp.error,
  };
}

export interface CriarLoteParams {
  branchId: string;
  brandId: string;
  pares: ParaCriarLote[];
  startAt: string;
  endAt: string;
  prizePointsPerPair: number;
  patrocinado: boolean;
}

export async function criarDuelosEmLote(params: CriarLoteParams): Promise<RespostaCriacaoLote> {
  const { data, error } = await supabase.rpc("admin_create_bulk_duels", {
    p_branch_id: params.branchId,
    p_brand_id: params.brandId,
    p_pairs: params.pares as unknown as never,
    p_start_at: params.startAt,
    p_end_at: params.endAt,
    p_prize_points_per_pair: params.prizePointsPerPair,
    p_sponsored: params.patrocinado,
  });

  if (error) throw error;
  return (data ?? { success: false, error: "Resposta vazia" }) as unknown as RespostaCriacaoLote;
}

export async function buscarSaldoCarteira(branchId: string): Promise<number> {
  const { data, error } = await supabase
    .from("branch_points_wallet")
    .select("balance")
    .eq("branch_id", branchId)
    .maybeSingle();

  if (error) throw error;
  return Number(data?.balance ?? 0);
}