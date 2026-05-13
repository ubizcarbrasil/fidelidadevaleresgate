/**
 * Tipagens das RPCs de leitura do motorista no Campeonato Duelo (Sub-fase C.3).
 */

export type FormatoEngajamento = "duelo" | "mass_duel" | "campeonato";

export interface TemporadaAtivaMotorista {
  season_id: string;
  season_name: string;
  year: number;
  month: number;
  phase:
    | "classification"
    | "knockout_r16"
    | "knockout_qf"
    | "knockout_sf"
    | "knockout_final"
    | "finished";
  classification_starts_at: string;
  classification_ends_at: string;
  knockout_starts_at: string;
  knockout_ends_at: string;
  tier_id: string | null;
  tier_name: string | null;
  tier_order: number | null;
  driver_points: number;
  driver_weekend_rides: number;
  driver_position: number | null;
  driver_qualified: boolean;
  driver_relegated_auto: boolean;
  /** True quando a temporada existe mas o motorista ainda não foi distribuído. */
  is_pending_seeding?: boolean;
}

export interface LinhaRankingCentrado {
  position: number;
  driver_id: string;
  driver_name: string | null;
  points: number;
  weekend_rides_count: number;
  last_ride_at: string | null;
  is_me: boolean;
}

export interface LinhaTabelaCompleta extends LinhaRankingCentrado {
  qualified: boolean;
  in_top: boolean;
}

export interface ConfrontoAtualMotorista {
  bracket_id: string;
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
  is_me_a: boolean;
  is_me_b: boolean;
  eliminated: boolean;
}

export interface BracketCompletoLinha {
  bracket_id: string;
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
  is_me_involved: boolean;
}

export type OutcomeHistorico =
  | "champion"
  | "promoted"
  | "relegated"
  | "relegated_zero"
  | "stayed";

export interface HistoricoMotoristaItem {
  history_id: string;
  season_id: string;
  season_name: string;
  year: number;
  month: number;
  starting_tier_id: string | null;
  starting_tier_name: string | null;
  starting_tier_order: number | null;
  ending_tier_id: string | null;
  ending_tier_name: string | null;
  ending_tier_order: number | null;
  ending_position: number | null;
  outcome: OutcomeHistorico | string;
  created_at: string;
}