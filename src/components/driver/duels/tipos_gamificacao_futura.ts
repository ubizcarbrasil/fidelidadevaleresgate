/**
 * Tipos e interfaces preparatórias para expansão futura do módulo de gamificação.
 * Nenhuma funcionalidade é implementada aqui — apenas contratos tipados.
 */

/** Modos de duelo suportados (expansível) */
export type DuelMode = "rides" | "points" | "team";

/** Períodos de ranking */
export type RankingPeriodo = "weekly" | "monthly" | "all_time";

/** Status de uma temporada */
export type SeasonStatus = "upcoming" | "active" | "finished";

/** Configuração de uma temporada competitiva */
export interface SeasonConfig {
  id: string;
  branchId: string;
  brandId: string;
  name: string;
  startAt: string;
  endAt: string;
  status: SeasonStatus;
  configJson: Record<string, unknown>;
}

/** Conquista/medalha desbloqueada pelo motorista */
export interface Achievement {
  id: string;
  customerId: string;
  achievementKey: string;
  achievementLabel: string;
  iconName: string;
  achievedAt: string;
  metadataJson: Record<string, unknown>;
}

/** Evento do feed competitivo da cidade */
export interface FeedEvent {
  id: string;
  branchId: string;
  brandId: string;
  eventType: string;
  customerId: string | null;
  title: string;
  description: string | null;
  metadataJson: Record<string, unknown>;
  createdAt: string;
}

/** Provocação automática leve entre adversários */
export interface ProvocacaoAutomatica {
  tipo: "lideranca" | "empate" | "reacao";
  mensagem: string;
  emoji: string;
  duelId: string;
  destinatarioCustomerId: string;
}

/** Configuração de premiação em pontos para duelos */
export interface PremiacaoDuelo {
  vencedor: number;
  perdedor: number;
  empate: number;
}
