/**
 * Tipagens da feature de matching e criação em massa de duelos.
 * Espelha 1:1 os payloads das RPCs `get_duel_match_suggestions` e
 * `admin_create_bulk_duels`.
 */
export type FaixaHoraria = "manha" | "tarde" | "noite" | "madrugada" | "sem_dados";

/** Origem do prêmio do duelo. */
export type DuelOrigin = "DRIVER_VS_DRIVER" | "SPONSORED";

export interface ParSugerido {
  a_participant_id: string;
  a_customer_id: string;
  a_nome: string;
  a_tier: string | null;
  a_rides_30d: number;
  a_hour_bucket: FaixaHoraria;
  b_participant_id: string;
  b_customer_id: string;
  b_nome: string;
  b_tier: string | null;
  b_rides_30d: number;
  b_hour_bucket: FaixaHoraria;
  score: number;
}

export interface MotoristaSemDados {
  participant_id: string;
  customer_id: string;
  nome: string;
  tier: string | null;
}

export interface RespostaSugestoes {
  success: boolean;
  pairs: ParSugerido[];
  pairs_count: number;
  no_data_drivers: MotoristaSemDados[];
  error?: string;
}

export type ToleranciaMatching = "estrita" | "media" | "folgada";

export const TOLERANCIA_VALORES: Record<ToleranciaMatching, number> = {
  estrita: 0.1,
  media: 0.25,
  folgada: 0.5,
};

export interface ParaCriarLote {
  challenger_customer_id: string;
  challenged_customer_id: string;
}

export interface RespostaCriacaoLote {
  success: boolean;
  created_count?: number;
  requested_count?: number;
  total_cost?: number;
  duel_ids?: string[];
  error?: string;
  balance?: number;
  required?: number;
}