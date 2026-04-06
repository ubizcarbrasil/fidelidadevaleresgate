/**
 * Hook para extrair flags de configuração do módulo de Duelos
 * a partir do branch_settings_json da cidade.
 */

export interface ConfigDuelos {
  duelosAtivos: boolean;
  rankingAtivo: boolean;
  cinturaoAtivo: boolean;
  visualizacaoPublica: boolean;
}

const DEFAULTS: ConfigDuelos = {
  duelosAtivos: false,
  rankingAtivo: false,
  cinturaoAtivo: false,
  visualizacaoPublica: false,
};

export function useConfigDuelos(branch: { branch_settings_json?: any } | null | undefined): ConfigDuelos {
  if (!branch?.branch_settings_json || typeof branch.branch_settings_json !== "object") {
    return DEFAULTS;
  }

  const s = branch.branch_settings_json as Record<string, unknown>;

  return {
    duelosAtivos: s.enable_driver_duels === true,
    rankingAtivo: s.enable_city_ranking === true,
    cinturaoAtivo: s.enable_city_belt === true,
    visualizacaoPublica: s.allow_public_duel_viewing === true,
  };
}
