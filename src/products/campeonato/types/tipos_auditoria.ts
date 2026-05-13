export type ResultadoAuditoria = "success" | "blocked";

export type CodigoBloqueioAuditoria =
  | "unauthorized"
  | "invalid_phase"
  | "bracket_exists"
  | "insufficient_eligible"
  | "insufficient_qualified"
  | "divergent_points";

export interface DivergenciaMotorista {
  driver_id: string;
  standings: number;
  eventos: number;
  driver_name?: string | null;
}

export interface RegistroAuditoria {
  id: string;
  season_id: string;
  brand_id: string;
  branch_id: string;
  attempted_by: string | null;
  outcome: ResultadoAuditoria;
  block_reason: string | null;
  block_code: CodigoBloqueioAuditoria | null;
  eligible_count: number | null;
  required_count: number | null;
  divergent_count: number | null;
  divergent_sample: DivergenciaMotorista[];
  details_json: Record<string, unknown>;
  created_at: string;
  season_name?: string | null;
}
