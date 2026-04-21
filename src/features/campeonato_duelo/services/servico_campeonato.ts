import { supabase } from "@/integrations/supabase/client";
import type {
  ClassificacaoMotorista,
  ConfrontoMataMata,
  NovaTemporadaInput,
  TemporadaCampeonato,
} from "../types/tipos_campeonato";

/**
 * Camada de acesso a dados do Campeonato Duelo Motorista.
 * Consulta direta a duelo_seasons / duelo_season_standings / duelo_brackets.
 * RPCs de avanço automático de fase ficam para sub-fase C.2.
 */

export async function listarTemporadasPorCidade(
  branchId: string,
): Promise<TemporadaCampeonato[]> {
  const { data, error } = await supabase
    .from("duelo_seasons")
    .select("*")
    .eq("branch_id", branchId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TemporadaCampeonato[];
}

export async function criarTemporada(
  input: NovaTemporadaInput,
): Promise<TemporadaCampeonato> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("duelo_seasons")
    .insert({
      brand_id: input.brandId,
      branch_id: input.branchId,
      name: input.name,
      year: input.year,
      month: input.month,
      classification_starts_at: input.classificationStartsAt,
      classification_ends_at: input.classificationEndsAt,
      knockout_starts_at: input.knockoutStartsAt,
      knockout_ends_at: input.knockoutEndsAt,
      created_by: userData.user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as TemporadaCampeonato;
}

export async function listarClassificacao(
  seasonId: string,
): Promise<ClassificacaoMotorista[]> {
  const { data, error } = await supabase
    .from("duelo_season_standings")
    .select("*, customers!duelo_season_standings_driver_id_fkey(name)")
    .eq("season_id", seasonId)
    .order("points", { ascending: false })
    .order("five_star_count", { ascending: false })
    .order("last_ride_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    season_id: row.season_id,
    driver_id: row.driver_id,
    points: row.points,
    five_star_count: row.five_star_count,
    last_ride_at: row.last_ride_at,
    position: row.position,
    qualified: row.qualified,
    driver_name: row.customers?.name ?? null,
  })) as ClassificacaoMotorista[];
}

export async function listarConfrontos(
  seasonId: string,
): Promise<ConfrontoMataMata[]> {
  const { data, error } = await supabase
    .from("duelo_brackets")
    .select(
      "*, driver_a:customers!duelo_brackets_driver_a_id_fkey(name), driver_b:customers!duelo_brackets_driver_b_id_fkey(name)",
    )
    .eq("season_id", seasonId)
    .order("round")
    .order("slot");
  if (error) throw error;
  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    season_id: row.season_id,
    round: row.round,
    slot: row.slot,
    driver_a_id: row.driver_a_id,
    driver_b_id: row.driver_b_id,
    driver_a_rides: row.driver_a_rides,
    driver_b_rides: row.driver_b_rides,
    winner_id: row.winner_id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    driver_a_name: row.driver_a?.name ?? null,
    driver_b_name: row.driver_b?.name ?? null,
  })) as ConfrontoMataMata[];
}