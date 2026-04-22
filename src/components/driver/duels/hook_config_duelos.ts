import { useFormatoEngajamento } from "@/features/campeonato_duelo/hooks/hook_formato_engajamento";

/**
 * Hook para extrair flags de configuração do módulo de Duelos
 * a partir do branch_settings_json da cidade.
 *
 * Quando a marca opera no formato "campeonato", forçamos
 * duelos/ranking/cinturão como inativos — independente do que
 * estiver salvo no branch_settings_json.
 */

export interface ConfigDuelos {
  duelosAtivos: boolean;
  rankingAtivo: boolean;
  cinturaoAtivo: boolean;
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
}

const DEFAULTS: ConfigDuelos = {
  duelosAtivos: true,
  rankingAtivo: true,
  cinturaoAtivo: true,
  visualizacaoPublica: true,
  duracaoMinimaHoras: 1,
  modosDuelo: ["rides"],
  revanchaHabilitada: false,
  temporadasAtivas: false,
  conquistasAtivas: false,
  feedCompetitivo: false,
  provocacoesAutomaticas: false,
  rankingPeriodos: ["monthly"],
  premiacaoPontos: false,
  limiteApostaMinIndividual: null,
  limiteApostaMaxIndividual: null,
  limiteApostaMaxTotal: null,
  cicloResetAtivo: false,
  contarPontosCorrida: false,
  fatorPontosCorrida: 1,
};

export function useConfigDuelos(branch: { brand_id?: string; branch_settings_json?: any } | null | undefined): ConfigDuelos {
  const { isCampeonato } = useFormatoEngajamento(branch?.brand_id);

  if (!branch?.branch_settings_json || typeof branch.branch_settings_json !== "object") {
    if (isCampeonato) {
      return { ...DEFAULTS, duelosAtivos: false, rankingAtivo: false, cinturaoAtivo: false, visualizacaoPublica: false };
    }
    return DEFAULTS;
  }

  const s = branch.branch_settings_json as Record<string, unknown>;

  return {
    duelosAtivos: isCampeonato ? false : s.enable_driver_duels !== false,
    rankingAtivo: isCampeonato ? false : s.enable_city_ranking !== false,
    cinturaoAtivo: isCampeonato ? false : s.enable_city_belt !== false,
    visualizacaoPublica: s.allow_public_duel_viewing !== false,
    duracaoMinimaHoras: typeof s.duel_min_duration_hours === "number" ? (s.duel_min_duration_hours as number) : 1,
    modosDuelo: Array.isArray(s.duel_modes) ? (s.duel_modes as string[]) : ["rides"],
    revanchaHabilitada: s.enable_rematch === true,
    temporadasAtivas: s.enable_seasons === true,
    conquistasAtivas: s.enable_achievements === true,
    feedCompetitivo: s.enable_city_feed === true,
    provocacoesAutomaticas: s.enable_auto_provocations === true,
    rankingPeriodos: Array.isArray(s.ranking_periods) ? (s.ranking_periods as string[]) : ["monthly"],
    premiacaoPontos: s.enable_prize_points === true,
    limiteApostaMinIndividual: typeof s.duel_bet_min_individual === "number" ? s.duel_bet_min_individual : null,
    limiteApostaMaxIndividual: typeof s.duel_bet_max_individual === "number" ? s.duel_bet_max_individual : null,
    limiteApostaMaxTotal: typeof s.duel_bet_max_total === "number" ? s.duel_bet_max_total : null,
    cicloResetAtivo: s.duel_cycle_reset_enabled === true,
    contarPontosCorrida: s.duel_count_ride_points === true,
    fatorPontosCorrida: typeof s.duel_ride_points_factor === "number" ? s.duel_ride_points_factor : 1,
  };
}
