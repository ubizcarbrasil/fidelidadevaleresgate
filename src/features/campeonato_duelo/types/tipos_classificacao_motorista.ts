export type ZonaSerie = "promotion" | "relegation" | null;

export interface LinhaClassificacaoTier {
  rank: number;
  driver_id: string;
  driver_name: string | null;
  photo_url: string | null;
  points: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goal_diff: number;
  is_me: boolean;
  zone: ZonaSerie;
}