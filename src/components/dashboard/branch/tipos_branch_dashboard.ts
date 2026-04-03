export interface BranchDashboardStats {
  // Resgates
  redemptions_total: number;
  redemptions_pending: number;
  redemptions_approved: number;
  redemptions_shipped: number;
  redemptions_delivered: number;
  redemptions_rejected: number;
  // Pontuação
  points_total: number;
  points_today: number;
  points_month: number;
  points_avg_per_driver: number;
  // Motoristas
  drivers_total: number;
  drivers_scored: number;
  drivers_redeemed: number;
  // Corridas
  rides_total: number;
  rides_today: number;
  rides_month: number;
  rides_avg_per_driver: number;
  // Visão geral
  wallet_balance: number;
  wallet_total_loaded: number;
  wallet_total_distributed: number;
  wallet_low_threshold: number;
  active_rules: number;
}

export interface RankingItem {
  position: number;
  name: string;
  points: number;
}

export interface FeedItem {
  id: string;
  driver_name: string;
  points: number;
  finalized_at: string;
}

export interface BranchPassengerStats {
  customers_total: number;
  customers_active_30d: number;
  redemptions_month: number;
  offers_active: number;
  stores_active: number;
}
