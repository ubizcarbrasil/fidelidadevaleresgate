export type StatusRodada = "aguardando" | "em_andamento" | "encerrado";

export interface RodadaResumo {
  round: string;
  starts_at: string;
  ends_at: string;
  total_matches: number;
  status: StatusRodada;
}

export interface ConfrontoListagem {
  id: string;
  season_id: string;
  tier_id: string | null;
  round: string;
  slot: number;
  starts_at: string;
  ends_at: string;
  driver_a_id: string | null;
  driver_a_name: string | null;
  driver_a_photo_url: string | null;
  driver_a_rides: number;
  driver_b_id: string | null;
  driver_b_name: string | null;
  driver_b_photo_url: string | null;
  driver_b_rides: number;
  winner_id: string | null;
  is_me: boolean;
}