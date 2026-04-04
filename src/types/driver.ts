/**
 * Tipos compartilhados para o módulo de motoristas.
 */
export type DriverRow = {
  id: string;
  name: string | null;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  points_balance: number;
  user_id: string | null;
  branch_id: string | null;
  customer_tier: string | null;
  scoring_disabled: boolean;
  total_ride_points: number;
  total_rides: number;
  branch_name: string | null;
};
