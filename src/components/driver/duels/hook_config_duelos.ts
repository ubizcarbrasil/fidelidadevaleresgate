import { useDueloFeatures } from "./hook_duelo_features";

/**
 * @deprecated Sprint 4A — prefira `useDueloFeatures` para as 4 flags principais
 * (duelos, cinturão, ranking, apostas) e leia os 12 campos restantes
 * (`duracaoMinimaHoras`, `modosDuelo`, etc.) diretamente de `branch_settings_json`.
 *
 * Mantido como WRAPPER de compatibilidade (não pode ser apagado — Sprint 4A regra 3).
 *
 * Comportamento híbrido:
 *  - 4 booleans (duelosAtivos, cinturaoAtivo, rankingAtivo, apostasAtivas) →
 *    assíncronos via React Query + RPC `branch_has_feature` (Sprint 3).
 *    Na PRIMEIRA render retornam `false` enquanto resolvem (defaults seguros).
 *  - 12 campos de configuração (visualizacaoPublica, duracaoMinimaHoras,
 *    modosDuelo, revanchaHabilitada, temporadasAtivas, conquistasAtivas,
 *    feedCompetitivo, provocacoesAutomaticas, rankingPeriodos, premiacaoPontos,
 *    limites de aposta, ciclo, contagem por corrida) → leitura SÍNCRONA
 *    direta de `branch.branch_settings_json` preservada (zero mudança).
 *
 * Componentes que precisam reagir ao loading podem ler `isLoading`/`isError`
 * (campos novos, opcionais para consumidores antigos).
 */

export interface ConfigDuelos {
  duelosAtivos: boolean;
  rankingAtivo: boolean;
  cinturaoAtivo: boolean;
  apostasAtivas: boolean;
  visualizacaoPublica: boolean;
  duracaoMinimaHoras: number;
  // Escalabilidade futura — Etapa 8
  modosDuelo: string[];
  revanchaHabilitada: boolean;
  temporadasAtivas: boolean;
  conquistasAtivas: boolean;
  feedCompetitivo: boolean;
  provocacoesAutomaticas: boolean;
  rankingPeriodos: string[];
  premiacaoPontos: boolean;
  // Sub-fase 7.0 — limites, ciclo e integração corridas
  limiteApostaMinIndividual: number | null;
  limiteApostaMaxIndividual: number | null;
  limiteApostaMaxTotal: number | null;
  cicloResetAtivo: boolean;
  contarPontosCorrida: boolean;
  fatorPontosCorrida: number;
  // Sprint 4A — estado assíncrono dos 4 booleans-feature
  isLoading: boolean;
  isError: boolean;
}

/**
 * Defaults dos 12 campos síncronos legados (NÃO inclui os 4 booleans-feature
 * — esses vêm sempre de `useDueloFeatures` com defaults seguros = false).
 */
const SYNC_DEFAULTS = {
  visualizacaoPublica: true,
  duracaoMinimaHoras: 1,
  modosDuelo: ["rides"] as string[],
  revanchaHabilitada: false,
  temporadasAtivas: false,
  conquistasAtivas: false,
  feedCompetitivo: false,
  provocacoesAutomaticas: false,
  rankingPeriodos: ["monthly"] as string[],
  premiacaoPontos: false,
  limiteApostaMinIndividual: null as number | null,
  limiteApostaMaxIndividual: null as number | null,
  limiteApostaMaxTotal: null as number | null,
  cicloResetAtivo: false,
  contarPontosCorrida: false,
  fatorPontosCorrida: 1,
};

function readSyncSettings(settingsJson: any) {
  if (!settingsJson || typeof settingsJson !== "object") {
    return { ...SYNC_DEFAULTS };
  }
  const s = settingsJson as Record<string, unknown>;
  return {
    visualizacaoPublica: s.allow_public_duel_viewing !== false,
    duracaoMinimaHoras:
      typeof s.duel_min_duration_hours === "number" ? (s.duel_min_duration_hours as number) : 1,
    modosDuelo: Array.isArray(s.duel_modes) ? (s.duel_modes as string[]) : ["rides"],
    revanchaHabilitada: s.enable_rematch === true,
    temporadasAtivas: s.enable_seasons === true,
    conquistasAtivas: s.enable_achievements === true,
    feedCompetitivo: s.enable_city_feed === true,
    provocacoesAutomaticas: s.enable_auto_provocations === true,
    rankingPeriodos: Array.isArray(s.ranking_periods) ? (s.ranking_periods as string[]) : ["monthly"],
    premiacaoPontos: s.enable_prize_points === true,
    limiteApostaMinIndividual:
      typeof s.duel_bet_min_individual === "number" ? (s.duel_bet_min_individual as number) : null,
    limiteApostaMaxIndividual:
      typeof s.duel_bet_max_individual === "number" ? (s.duel_bet_max_individual as number) : null,
    limiteApostaMaxTotal:
      typeof s.duel_bet_max_total === "number" ? (s.duel_bet_max_total as number) : null,
    cicloResetAtivo: s.duel_cycle_reset_enabled === true,
    contarPontosCorrida: s.duel_count_ride_points === true,
    fatorPontosCorrida:
      typeof s.duel_ride_points_factor === "number" ? (s.duel_ride_points_factor as number) : 1,
  };
}

/**
 * @deprecated Sprint 4A — wrapper de compatibilidade. Veja header do arquivo.
 */
export function useConfigDuelos(
  branch: { id?: string; brand_id?: string; branch_settings_json?: any } | null | undefined
): ConfigDuelos {
  const features = useDueloFeatures(branch);
  const sync = readSyncSettings(branch?.branch_settings_json);

  return {
    duelosAtivos: features.duelosAtivos,
    cinturaoAtivo: features.cinturaoAtivo,
    rankingAtivo: features.rankingAtivo,
    apostasAtivas: features.apostasAtivas,
    ...sync,
    isLoading: features.isLoading,
    isError: features.isError,
  };
}
