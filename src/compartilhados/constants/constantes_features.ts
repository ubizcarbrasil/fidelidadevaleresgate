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
