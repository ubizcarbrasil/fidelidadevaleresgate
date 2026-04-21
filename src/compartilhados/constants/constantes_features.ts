/**
 * Feature flags em código (sem variáveis de ambiente).
 *
 * Para reverter um comportamento experimental, basta trocar o valor para `false`
 * e fazer um novo deploy. Mantém a opção de rollback rápido sem migration nem secrets.
 */

/**
 * Quando `true`, a sidebar usa o hook unificado `useResolvedModules`
 * (com Realtime + cache curto + invalidação cruzada) para decidir
 * a visibilidade dos itens. Quando `false`, mantém o comportamento
 * legado via `useBrandModules` / `useBranchModules`.
 */
export const USE_RESOLVED_MODULES = true;

/**
 * Liga a nova camada de Modelos de Negócio (Sub-fase 5.2+).
 * Quando `true`, sidebars e painéis usam `useResolvedBusinessModels`
 * em paralelo ao `useResolvedModules` existente (não substitui
 * ainda — substituição vem na Sub-fase 5.7).
 */
export const USE_BUSINESS_MODELS = false;

/**
 * Liga funcionalidade Campeonato Duelo Motorista (Brasileirão dos motoristas).
 * Por brand: `brand_settings_json.duelo_campeonato_enabled === true`.
 * Independente de `USE_BUSINESS_MODELS`.
 */
export const USE_DUELO_CAMPEONATO = false;

/**
 * Liga a camada de Séries Hierárquicas (A, B, C, ...) do Campeonato Duelo
 * Motorista (Sub-fase C.1+). Quando `false`, o sistema continua tratando cada
 * temporada como série única ("Única", criada pelo backfill).
 *
 * Esta flag é independente de `USE_DUELO_CAMPEONATO` para permitir liberar
 * primeiro o campeonato simples e depois ativar séries hierárquicas.
 */
export const USE_DUELO_SERIES_HIERARQUICAS = false;
