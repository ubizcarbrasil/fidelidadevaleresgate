export type FasePhase = "r16" | "qf" | "sf" | "final";

export interface PhaseConfigItem {
  phase: "R16" | "QF" | "SF" | "Final";
  duration_hours: number;
}

export interface SeasonInfoBracket {
  knockout_starts_at: string | null;
  knockout_ends_at: string | null;
  phase_config: PhaseConfigItem[];
}

export interface BracketSlotV2 {
  id: string;
  phase: FasePhase;
  bracket_position: number;
  driver_a_id: string | null;
  driver_a_name: string | null;
  driver_a_photo_url: string | null;
  driver_b_id: string | null;
  driver_b_name: string | null;
  driver_b_photo_url: string | null;
  driver_a_rides: number;
  driver_b_rides: number;
  winner_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_my_match: boolean;
}

export interface BracketResponseV2 {
  season_info: SeasonInfoBracket | null;
  brackets: BracketSlotV2[];
}