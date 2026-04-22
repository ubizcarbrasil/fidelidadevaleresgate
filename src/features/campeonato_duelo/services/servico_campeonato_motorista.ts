import { supabase } from "@/integrations/supabase/client";
import type {
  BracketCompletoLinha,
  ConfrontoAtualMotorista,
  FormatoEngajamento,
  HistoricoMotoristaItem,
  LinhaRankingCentrado,
  LinhaTabelaCompleta,
  TemporadaAtivaMotorista,
} from "../types/tipos_motorista";

/**
 * Camada de acesso às RPCs SECURITY DEFINER do motorista.
 * Todas as RPCs validam pertencimento (driver_id pertence a brand_id) antes de retornar.
 */

export async function obterFormatoEngajamento(
  brandId: string,
): Promise<FormatoEngajamento> {
  const { data, error } = await supabase.rpc("duelo_get_engagement_format", {
    p_brand_id: brandId,
  });
  if (error) throw error;
  return ((data as string) ?? "duelo") as FormatoEngajamento;
}

export async function obterTemporadaAtivaMotorista(
  brandId: string,
  driverId: string,
): Promise<TemporadaAtivaMotorista | null> {
  const { data, error } = await supabase.rpc("driver_get_active_season", {
    p_brand_id: brandId,
    p_driver_id: driverId,
  });
  if (error) throw error;
  return (data as TemporadaAtivaMotorista | null) ?? null;
}

export async function obterRankingCentrado(
  seasonId: string,
  driverId: string,
  range = 2,
): Promise<LinhaRankingCentrado[]> {
  const { data, error } = await supabase.rpc("driver_get_centered_ranking", {
    p_season_id: seasonId,
    p_driver_id: driverId,
    p_range: range,
  });
  if (error) throw error;
  return ((data as LinhaRankingCentrado[]) ?? []);
}

export async function obterTabelaCompletaTier(
  seasonId: string,
  driverId: string,
): Promise<LinhaTabelaCompleta[]> {
  const { data, error } = await supabase.rpc("driver_get_full_tier_table", {
    p_season_id: seasonId,
    p_driver_id: driverId,
  });
  if (error) throw error;
  return ((data as LinhaTabelaCompleta[]) ?? []);
}

export async function obterConfrontoAtual(
  seasonId: string,
  driverId: string,
): Promise<ConfrontoAtualMotorista | null> {
  const { data, error } = await supabase.rpc("driver_get_current_match", {
    p_season_id: seasonId,
    p_driver_id: driverId,
  });
  if (error) throw error;
  return (data as ConfrontoAtualMotorista | null) ?? null;
}

export async function obterBracketCompleto(
  seasonId: string,
  driverId: string,
): Promise<BracketCompletoLinha[]> {
  const { data, error } = await supabase.rpc("driver_get_full_bracket", {
    p_season_id: seasonId,
    p_driver_id: driverId,
  });
  if (error) throw error;
  return ((data as BracketCompletoLinha[]) ?? []);
}

export async function obterHistoricoMotorista(
  brandId: string,
  driverId: string,
  limit = 10,
): Promise<HistoricoMotoristaItem[]> {
  const { data, error } = await supabase.rpc("driver_get_history", {
    p_brand_id: brandId,
    p_driver_id: driverId,
    p_limit: limit,
  });
  if (error) throw error;
  return ((data as HistoricoMotoristaItem[]) ?? []);
}