/**
 * Tipagens das Séries Hierárquicas do Campeonato Duelo Motorista.
 * (Sub-fase C.1)
 */

export type PoliticaRebaixamento = "auto_zero" | "manual" | "none";

export type ResultadoTemporadaMotorista =
  | "promoted"
  | "relegated"
  | "stayed"
  | "champion";

export type OrigemMembroSerie =
  | "seed"
  | "promotion"
  | "relegation"
  | "manual";

export type PosicaoPremio =
  | "champion"
  | "runner_up"
  | "semifinalist"
  | "quarterfinalist"
  | "r16";

export interface SerieCampeonato {
  id: string;
  season_id: string;
  brand_id: string;
  branch_id: string;
  name: string;
  tier_order: number;
  target_size: number;
  promotion_count: number;
  relegation_count: number;
  created_at: string;
  updated_at: string;
}

export interface MembroSerie {
  id: string;
  season_id: string;
  tier_id: string;
  driver_id: string;
  brand_id: string;
  branch_id: string;
  source: OrigemMembroSerie;
  created_at: string;
}

export interface HistoricoSerieMotorista {
  id: string;
  season_id: string;
  driver_id: string;
  brand_id: string;
  branch_id: string;
  starting_tier_id: string | null;
  ending_tier_id: string | null;
  ending_position: number | null;
  outcome: ResultadoTemporadaMotorista | null;
  created_at: string;
  updated_at: string;
}

export interface FaixaPremioPlano {
  id: string;
  plan_key: string;
  tier_name: string;
  position: PosicaoPremio;
  min_points: number;
  max_points: number;
}

export interface PremioMarcaPorSerie {
  id: string;
  brand_id: string;
  branch_id: string | null;
  tier_name: string;
  position: PosicaoPremio;
  points_reward: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResultadoSeedInicial {
  season_id: string;
  seeded_count: number;
  low_tier_overflow_count: number;
  by_tier: Record<string, number>;
}