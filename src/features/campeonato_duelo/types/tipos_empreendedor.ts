/**
 * Tipagens das RPCs SECURITY DEFINER do empreendedor (Sub-fase C.4).
 * Espelham o JSON retornado pelas funções `brand_get_*` e mutations `duelo_*`.
 */

import type { FaseCampeonato } from "./tipos_campeonato";
import type { FormatoEngajamento } from "./tipos_motorista";

export type StatusFiltroSeason = "all" | "active" | "finished" | "cancelled";

export interface SerieDashboard {
  tier_id: string;
  tier_name: string;
  tier_order: number;
  members_count: number;
  qualified_count: number;
  top: Array<{
    driver_id: string;
    driver_name: string | null;
    points: number;
    weekend_rides_count: number;
    position: number | null;
  }>;
}

export interface DashboardCampeonatoData {
  has_active_season: boolean;
  engagement_format: FormatoEngajamento;
  active_season: {
    id: string;
    name: string;
    year: number;
    month: number;
    phase: FaseCampeonato | "cancelled";
    classification_starts_at: string;
    classification_ends_at: string;
    knockout_starts_at: string;
    knockout_ends_at: string;
    paused_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    branch_id: string;
    branch_name: string | null;
  } | null;
  tiers: SerieDashboard[];
}

export interface SeasonListItem {
  id: string;
  name: string;
  year: number;
  month: number;
  phase: FaseCampeonato | "cancelled";
  paused_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  classification_starts_at: string;
  knockout_ends_at: string;
  branch_id: string;
  branch_name: string | null;
  tiers_count: number;
}

export interface LinhaSerieDetalhe {
  driver_id: string;
  driver_name: string | null;
  points: number;
  weekend_rides_count: number;
  position_in_tier: number | null;
  qualified: boolean;
  relegated_auto: boolean;
  source: string | null;
}

export interface BracketAdminLinha {
  bracket_id: string;
  tier_id: string | null;
  tier_name: string | null;
  tier_order: number | null;
  round: "r16" | "qf" | "sf" | "final";
  slot: number;
  starts_at: string;
  ends_at: string;
  driver_a_id: string | null;
  driver_a_name: string | null;
  driver_a_rides: number;
  driver_b_id: string | null;
  driver_b_name: string | null;
  driver_b_rides: number;
  winner_id: string | null;
}

export interface ResumoTemporadaAdmin {
  id: string;
  brand_id: string;
  branch_id: string;
  branch_name: string | null;
  name: string;
  year: number;
  month: number;
  phase: FaseCampeonato | "cancelled";
  paused_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  classification_starts_at: string;
  classification_ends_at: string;
  knockout_starts_at: string;
  knockout_ends_at: string;
  tiers: Array<{
    tier_id: string;
    tier_name: string;
    tier_order: number;
    members_count: number;
    qualified_count: number;
  }>;
}

export interface MotoristaDisponivel {
  driver_id: string;
  driver_name: string | null;
  driver_phone: string | null;
}

/* ============== Templates de criação ============== */

export type TemplateKey = "simples" | "padrao" | "completo";

export interface TemplateSerie {
  name: string;
  size: number;
  promote_count: number;
  relegate_count: number;
}

export interface TemplatePremio {
  position: PosicaoPremio;
  points: number;
}

export interface TemplateCampeonato {
  key: TemplateKey;
  label: string;
  description: string;
  series: TemplateSerie[];
  prizes: TemplatePremio[];
}

export type PosicaoPremio =
  | "champion"
  | "runner_up"
  | "semifinalist"
  | "quarterfinalist"
  | "r16";

/* ============== Mutations ============== */

export interface CriarTemporadaCompletaInput {
  brandId: string;
  branchId: string;
  name: string;
  year: number;
  month: number;
  classificationStartsAt: string;
  classificationEndsAt: string;
  knockoutStartsAt: string;
  knockoutEndsAt: string;
  series: TemplateSerie[];
  prizesPerTier: Record<string, TemplatePremio[]>;
}

export interface CancelarTemporadaInput {
  seasonId: string;
  reason: string;
}

export interface AjustarPremioInput {
  brandId: string;
  tierName: string;
  position: PosicaoPremio;
  newPoints: number;
}

export interface IncluirMotoristaInput {
  seasonId: string;
  driverId: string;
  tierId: string;
  initialPoints: number;
  reason: string;
}

export interface TrocarFormatoInput {
  brandId: string;
  newFormat: FormatoEngajamento;
}

/* ============== Distribuição de prêmios (C.5) ============== */

export type StatusDistribuicaoPremio = "pending" | "confirmed" | "cancelled";

export interface DistribuicaoPremio {
  id: string;
  season_id: string;
  driver_id: string;
  driver_name: string | null;
  brand_id: string;
  branch_id: string;
  tier_id: string;
  tier_name: string;
  position: PosicaoPremio;
  points_awarded: number;
  status: StatusDistribuicaoPremio;
  confirmed_at: string | null;
  cancelled_reason: string | null;
  created_at: string;
}

export interface ResumoDistribuicaoConfirmada {
  total_drivers: number;
  total_points: number;
  confirmed_at: string;
}

export interface CancelarPremioInput {
  distributionId: string;
  reason: string;
}
