/**
 * Wrappers das RPCs do motor do Campeonato Duelo (Sub-fase C.2).
 * UI virá em C.4 — por enquanto chamáveis via console admin.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  ResultadoAvancoFase,
  ResultadoBackfill,
  ResultadoPromocaoRebaixamento,
  ResultadoReconciliacao,
} from "../types/tipos_motor";

export async function reconciliarStandings(
  janelaHoras = 48,
): Promise<ResultadoReconciliacao> {
  const { data, error } = await supabase.rpc("duelo_reconcile_standings", {
    p_hours: janelaHoras,
  });
  if (error) throw error;
  return data as unknown as ResultadoReconciliacao;
}

export async function backfillStandings(
  seasonId: string,
): Promise<ResultadoBackfill> {
  const { data, error } = await supabase.rpc("duelo_backfill_standings", {
    p_season_id: seasonId,
  });
  if (error) throw error;
  return data as unknown as ResultadoBackfill;
}

export async function avancarFases(): Promise<ResultadoAvancoFase> {
  const { data, error } = await supabase.rpc("duelo_advance_phases");
  if (error) throw error;
  return data as unknown as ResultadoAvancoFase;
}

export async function aplicarPromocaoRebaixamento(
  seasonId: string,
): Promise<ResultadoPromocaoRebaixamento> {
  const { data, error } = await supabase.rpc(
    "duelo_apply_promotion_relegation",
    { p_season_id: seasonId },
  );
  if (error) throw error;
  return data as unknown as ResultadoPromocaoRebaixamento;
}