export type DueloNotificationEvent =
  | "season_created"
  | "knockout_started"
  | "match_result"
  | "prize_received";

export interface DueloNotification {
  id: string;
  driver_id: string;
  brand_id: string;
  season_id: string | null;
  event_type: DueloNotificationEvent;
  title: string;
  message: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}