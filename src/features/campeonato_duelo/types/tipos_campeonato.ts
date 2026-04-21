/**
 * Tipagens do Campeonato Duelo Motorista.
 */

export type FaseCampeonato =
  | "classification"
  | "knockout_r16"
  | "knockout_qf"
  | "knockout_sf"
  | "knockout_final"
  | "finished";

export type RodadaMataMata = "r16" | "qf" | "sf" | "final";

export interface TemporadaCampeonato {
  id: string;
  brand_id: string;
  branch_id: string;
  name: string;
  year: number;
  month: number;
  phase: FaseCampeonato;
  classification_starts_at: string;
  classification_ends_at: string;
  knockout_starts_at: string;
  knockout_ends_at: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Sub-fase C.1 — Séries Hierárquicas
  tiers_count?: number;
  relegation_policy?: string;
  tiers_config_json?: Record<string, unknown>;
  tier_seeding_completed_at?: string | null;
}

export interface ClassificacaoMotorista {
  id: string;
  season_id: string;
  driver_id: string;
  points: number;
  five_star_count: number;
  last_ride_at: string | null;
  position: number | null;
  qualified: boolean;
  driver_name?: string | null;
  // Sub-fase C.1 — Séries Hierárquicas
  tier_id?: string | null;
  position_in_tier?: number | null;
  relegated_auto?: boolean;
}

export interface ConfrontoMataMata {
  id: string;
  season_id: string;
  round: RodadaMataMata;
  slot: number;
  driver_a_id: string | null;
  driver_b_id: string | null;
  driver_a_rides: number;
  driver_b_rides: number;
  winner_id: string | null;
  starts_at: string;
  ends_at: string;
  driver_a_name?: string | null;
  driver_b_name?: string | null;
  // Sub-fase C.1 — Séries Hierárquicas
  tier_id?: string | null;
}

export interface NovaTemporadaInput {
  brandId: string;
  branchId: string;
  name: string;
  year: number;
  month: number;
  classificationStartsAt: string;
  classificationEndsAt: string;
  knockoutStartsAt: string;
  knockoutEndsAt: string;
}