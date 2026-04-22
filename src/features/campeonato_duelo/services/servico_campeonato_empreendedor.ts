import { supabase } from "@/integrations/supabase/client";
import type {
  AjustarPremioInput,
  BracketAdminLinha,
  CancelarPremioInput,
  CancelarTemporadaInput,
  CriarTemporadaCompletaInput,
  DashboardCampeonatoData,
  DistribuicaoPremio,
  IncluirMotoristaInput,
  LinhaSerieDetalhe,
  MotoristaDisponivel,
  MoverMotoristaInput,
  RemoverMotoristaInput,
  ResumoDistribuicaoConfirmada,
  ResumoTemporadaAdmin,
  SeasonListItem,
  StatusFiltroSeason,
  TrocarFormatoInput,
} from "../types/tipos_empreendedor";

/**
 * Camada de acesso às 12 RPCs SECURITY DEFINER do empreendedor (C.4).
 * Todas validam `duelo_admin_can_manage(brand_id)` no servidor.
 */

/* ============== Leitura ============== */

export async function obterDashboardCampeonato(
  brandId: string,
): Promise<DashboardCampeonatoData> {
  const { data, error } = await supabase.rpc("brand_get_campeonato_dashboard", {
    p_brand_id: brandId,
  });
  if (error) throw error;
  return (data as unknown as DashboardCampeonatoData) ?? {
    has_active_season: false,
    engagement_format: "duelo",
    active_season: null,
    tiers: [],
  };
}

export async function listarTemporadasMarca(
  brandId: string,
  status: StatusFiltroSeason = "all",
): Promise<SeasonListItem[]> {
  const { data, error } = await supabase.rpc("brand_get_seasons_list", {
    p_brand_id: brandId,
    p_status: status,
  });
  if (error) throw error;
  return ((data as unknown as SeasonListItem[]) ?? []);
}

export async function obterDetalheSerie(
  seasonId: string,
  tierId: string,
): Promise<LinhaSerieDetalhe[]> {
  const { data, error } = await supabase.rpc("brand_get_series_detail", {
    p_season_id: seasonId,
    p_tier_id: tierId,
  });
  if (error) throw error;
  return ((data as unknown as LinhaSerieDetalhe[]) ?? []);
}

export async function obterBracketsCompleto(
  seasonId: string,
): Promise<BracketAdminLinha[]> {
  const { data, error } = await supabase.rpc("brand_get_brackets_full", {
    p_season_id: seasonId,
  });
  if (error) throw error;
  return ((data as unknown as BracketAdminLinha[]) ?? []);
}

export async function obterResumoTemporada(
  seasonId: string,
): Promise<ResumoTemporadaAdmin | null> {
  const { data, error } = await supabase.rpc("brand_get_season_summary", {
    p_season_id: seasonId,
  });
  if (error) throw error;
  return (data as unknown as ResumoTemporadaAdmin | null) ?? null;
}

export async function listarMotoristasDisponiveis(
  brandId: string,
  seasonId: string,
): Promise<MotoristaDisponivel[]> {
  const { data, error } = await supabase.rpc("brand_get_drivers_available", {
    p_brand_id: brandId,
    p_season_id: seasonId,
  });
  if (error) throw error;
  return ((data as unknown as MotoristaDisponivel[]) ?? []);
}

/* ============== Mutations ============== */

export async function trocarFormatoEngajamento(input: TrocarFormatoInput) {
  const { data, error } = await supabase.rpc("duelo_change_engagement_format", {
    p_brand_id: input.brandId,
    p_new_format: input.newFormat,
  });
  if (error) throw error;
  return data;
}

export async function cancelarTemporada(input: CancelarTemporadaInput) {
  const { data, error } = await supabase.rpc("duelo_cancel_season", {
    p_season_id: input.seasonId,
    p_reason: input.reason,
  });
  if (error) throw error;
  return data;
}

export async function pausarTemporada(seasonId: string) {
  const { data, error } = await supabase.rpc("duelo_pause_season", {
    p_season_id: seasonId,
  });
  if (error) throw error;
  return data;
}

export async function retomarTemporada(seasonId: string) {
  const { data, error } = await supabase.rpc("duelo_resume_season", {
    p_season_id: seasonId,
  });
  if (error) throw error;
  return data;
}

export async function ajustarPremio(input: AjustarPremioInput) {
  const { data, error } = await supabase.rpc("duelo_update_prize", {
    p_brand_id: input.brandId,
    p_tier_name: input.tierName,
    p_position: input.position,
    p_new_points: input.newPoints,
  });
  if (error) throw error;
  return data;
}

export async function incluirMotoristaTemporada(input: IncluirMotoristaInput) {
  const { data, error } = await supabase.rpc("duelo_add_driver_to_season", {
    p_season_id: input.seasonId,
    p_driver_id: input.driverId,
    p_tier_id: input.tierId,
    p_initial_points: input.initialPoints,
    p_reason: input.reason,
  });
  if (error) throw error;
  return data;
}

/**
 * Cria a temporada usando o serviço básico já existente. A configuração de
 * séries e prêmios é persistida em `tiers_config_json` da temporada e nos
 * registros de `brand_duelo_prizes` via mutation pós-criação.
 *
 * O backend de séries hierárquicas (sub-fase C.1) lê tiers_config_json no
 * momento do seeding inicial.
 */
export async function criarTemporadaCompleta(
  input: CriarTemporadaCompletaInput,
) {
  const { data: userData } = await supabase.auth.getUser();

  const tiersConfig = {
    series: input.series.map((s, idx) => ({
      name: s.name,
      tier_order: idx + 1,
      size: s.size,
      promote_count: s.promote_count,
      relegate_count: s.relegate_count,
    })),
  };

  const { data: season, error: seasonErr } = await supabase
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
      tiers_count: input.series.length,
      tiers_config_json: tiersConfig,
      created_by: userData.user?.id ?? null,
      scoring_mode: input.scoringMode ?? "total_points",
      scoring_config_json:
        input.scoringMode === "daily_matchup"
          ? (input.scoringConfig ?? { win: 3, draw: 1, loss: 0 })
          : { win: 3, draw: 1, loss: 0 },
    } as any)
    .select()
    .single();
  if (seasonErr) throw seasonErr;

  // Persistir prêmios por (tier_name, position) — usa upsert direto
  const prizesRows = Object.entries(input.prizesPerTier).flatMap(
    ([tierName, prizes]) =>
      prizes.map((p) => ({
        brand_id: input.brandId,
        tier_name: tierName,
        position: p.position,
        points_reward: p.points,
        updated_by: userData.user?.id ?? null,
      })),
  );

  if (prizesRows.length > 0) {
    const { error: prizeErr } = await supabase
      .from("brand_duelo_prizes")
      .upsert(prizesRows, { onConflict: "brand_id,tier_name,position" });
    if (prizeErr) throw prizeErr;
  }

  return season;
}

/* ============== Distribuição de prêmios (C.5) ============== */

/**
 * Lista distribuições pendentes de uma temporada (com nome do motorista).
 * Faz join com customers para obter o nome.
 */
export async function listarDistribuicoesPendentes(
  seasonId: string,
): Promise<DistribuicaoPremio[]> {
  const { data, error } = await supabase
    .from("duelo_prize_distributions")
    .select(
      "id, season_id, driver_id, brand_id, branch_id, tier_id, tier_name, position, points_awarded, status, confirmed_at, cancelled_reason, created_at, customers!duelo_prize_distributions_driver_id_fkey(name)",
    )
    .eq("season_id", seasonId)
    .order("tier_name", { ascending: true })
    .order("points_awarded", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    season_id: row.season_id,
    driver_id: row.driver_id,
    driver_name: row.customers?.name ?? null,
    brand_id: row.brand_id,
    branch_id: row.branch_id,
    tier_id: row.tier_id,
    tier_name: row.tier_name,
    position: row.position,
    points_awarded: row.points_awarded,
    status: row.status,
    confirmed_at: row.confirmed_at,
    cancelled_reason: row.cancelled_reason,
    created_at: row.created_at,
  }));
}

export async function confirmarDistribuicaoPremios(
  seasonId: string,
): Promise<ResumoDistribuicaoConfirmada> {
  const { data, error } = await supabase.rpc(
    "duelo_confirm_prize_distribution",
    { p_season_id: seasonId },
  );
  if (error) throw error;
  return data as unknown as ResumoDistribuicaoConfirmada;
}

export async function cancelarPremio(input: CancelarPremioInput) {
  const { data, error } = await supabase.rpc("duelo_cancel_prize", {
    p_distribution_id: input.distributionId,
    p_reason: input.reason,
  });
  if (error) throw error;
  return data;
}

export async function calcularPremiosManualmente(seasonId: string) {
  const { data, error } = await supabase.rpc("duelo_calculate_prizes", {
    p_season_id: seasonId,
  });
  if (error) throw error;
  return data;
}

/* ============== Distribuição manual de séries (C.6) ============== */

export async function moverMotoristaParaSerie(input: MoverMotoristaInput) {
  const { data, error } = await supabase.rpc(
    "duelo_move_driver_to_tier" as any,
    {
      p_season_id: input.seasonId,
      p_driver_id: input.driverId,
      p_target_tier_id: input.targetTierId,
      p_reason: input.reason ?? null,
    },
  );
  if (error) throw error;
  return data;
}

export async function removerMotoristaDaSeason(input: RemoverMotoristaInput) {
  const { data, error } = await supabase.rpc(
    "duelo_remove_driver_from_season" as any,
    {
      p_season_id: input.seasonId,
      p_driver_id: input.driverId,
      p_reason: input.reason ?? null,
    },
  );
  if (error) throw error;
  return data;
}
