import type { AcaoReset, FrequenciaReset, StatusCampanha } from "../constants/constantes_configuracao_duelo";

export interface ConfigLimitesAposta {
  duel_bet_min_individual: number | null;
  duel_bet_max_individual: number | null;
  duel_bet_max_total: number | null;
}

export interface ConfigCicloReset {
  duel_cycle_reset_enabled: boolean;
  duel_cycle_frequency: FrequenciaReset;
  duel_cycle_day: number;
  duel_cycle_action: AcaoReset;
  duel_cycle_initial_points: number;
  duel_cycle_eligibility_json: {
    min_rides_prev_period: number;
    only_active: boolean;
  };
}

export interface ConfigIntegracaoCorridas {
  duel_count_ride_points: boolean;
  duel_ride_points_factor: number;
}

export interface CampanhaPremio {
  id: string;
  brand_id: string;
  branch_id: string;
  season_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  points_cost: number;
  quantity_total: number;
  quantity_redeemed: number;
  starts_at: string;
  ends_at: string;
  status: StatusCampanha;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResetHistoricoItem {
  id: string;
  branch_id: string;
  brand_id: string;
  executed_at: string;
  drivers_affected: number;
  total_points_distributed: number;
  action_executed: string;
  triggered_by: "cron" | "manual";
  config_snapshot: Record<string, unknown>;
}