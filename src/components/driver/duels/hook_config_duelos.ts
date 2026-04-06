/**
 * Hook para extrair flags de configuração do módulo de Duelos
 * a partir do branch_settings_json da cidade.
 */

export interface ConfigDuelos {
  duelosAtivos: boolean;
  rankingAtivo: boolean;
  cinturaoAtivo: boolean;
  visualizacaoPublica: boolean;
  // Escalabilidade futura — Etapa 8
  modosDuelo: string[];
  revanchaHabilitada: boolean;
  temporadasAtivas: boolean;
  conquistasAtivas: boolean;
  feedCompetitivo: boolean;
  provocacoesAutomaticas: boolean;
  rankingPeriodos: string[];
  premiacaoPontos: boolean;
}

const DEFAULTS: ConfigDuelos = {
  duelosAtivos: true,
  rankingAtivo: true,
  cinturaoAtivo: true,
  visualizacaoPublica: true,
  modosDuelo: ["rides"],
  revanchaHabilitada: false,
  temporadasAtivas: false,
  conquistasAtivas: false,
  feedCompetitivo: false,
  provocacoesAutomaticas: false,
  rankingPeriodos: ["monthly"],
  premiacaoPontos: false,
};

export function useConfigDuelos(branch: { branch_settings_json?: any } | null | undefined): ConfigDuelos {
  if (!branch?.branch_settings_json || typeof branch.branch_settings_json !== "object") {
    return DEFAULTS;
  }

  const s = branch.branch_settings_json as Record<string, unknown>;

  return {
    duelosAtivos: s.enable_driver_duels !== false,
    rankingAtivo: s.enable_city_ranking !== false,
    cinturaoAtivo: s.enable_city_belt !== false,
    visualizacaoPublica: s.allow_public_duel_viewing !== false,
    modosDuelo: Array.isArray(s.duel_modes) ? (s.duel_modes as string[]) : ["rides"],
    revanchaHabilitada: s.enable_rematch === true,
    temporadasAtivas: s.enable_seasons === true,
    conquistasAtivas: s.enable_achievements === true,
    feedCompetitivo: s.enable_city_feed === true,
    provocacoesAutomaticas: s.enable_auto_provocations === true,
    rankingPeriodos: Array.isArray(s.ranking_periods) ? (s.ranking_periods as string[]) : ["monthly"],
    premiacaoPontos: s.enable_prize_points === true,
  };
}
