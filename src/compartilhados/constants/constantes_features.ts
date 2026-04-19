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
