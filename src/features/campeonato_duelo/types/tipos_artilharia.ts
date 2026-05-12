export type JanelaArtilharia = "24h" | "7d" | "15d" | "30d";

export interface TopRider {
  rank: number;
  driver_id: string;
  driver_name: string | null;
  photo_url: string | null;
  total_rides: number;
  has_prize: boolean;
  prize_label: string | null;
}