/**
 * Tipagens para a RPC pública `public_get_hall_fama`.
 * Estrutura JSONB anonimizada (somente leitura).
 */

export interface PodioTemporada {
  season_id: string;
  season_name: string;
  year: number;
  month: number;
  finished_at: string | null;
  champion: string | null;
  runner_up: string | null;
  semifinalists: string[];
}

export interface RankingTitulo {
  driver_name: string;
  title_count: number;
  last_win: string | null;
}

export interface HallDaFamaData {
  brand_name: string;
  brand_slug: string;
  seasons: PodioTemporada[];
  ranking_titles: RankingTitulo[];
}