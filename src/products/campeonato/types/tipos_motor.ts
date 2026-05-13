/**
 * Tipagens das RPCs do motor do Campeonato Duelo (Sub-fase C.2).
 */

export interface ResultadoReconciliacao {
  checked: number;
  fixed: number;
  window_hours: number;
}

export interface ResultadoBackfill {
  season_id: string;
  inserted: number;
  updated: number;
  skipped_no_membership: number;
  until: string;
}

export interface ItemAvancoFase {
  season_id: string;
  to: string;
}

export interface ResultadoAvancoFase {
  processed: ItemAvancoFase[];
}

export interface ResultadoPromocaoRebaixamento {
  season_id: string;
  zero_relegated: number;
  relegated: number;
  promoted: number;
  stayed: number;
  skipped?: boolean;
  reason?: string;
  at?: string;
}