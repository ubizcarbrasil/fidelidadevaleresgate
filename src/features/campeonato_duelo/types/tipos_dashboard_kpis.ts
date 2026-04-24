/**
 * Tipagens da RPC `brand_get_campeonato_kpis` (Dashboard MVP do empreendedor).
 */

import type { FaseCampeonato } from "./tipos_campeonato";

export interface KpisCampeonato {
  total_drivers: number;
  by_tier: {
    A: number;
    B: number;
    C: number;
  };
  rides_in_season: number;
  points_distributed: number;
  events_last_24h: number;
}

export interface ResumoSeasonKpis {
  id: string;
  name: string;
  phase: FaseCampeonato | "cancelled";
  classification_starts_at: string;
  classification_ends_at: string;
  knockout_starts_at: string;
  knockout_ends_at: string;
}

export interface DashboardKpisResponse {
  has_active_season: boolean;
  season: ResumoSeasonKpis | null;
  kpis: KpisCampeonato;
}