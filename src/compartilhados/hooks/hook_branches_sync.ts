/**
 * hook_branches_sync.ts
 *
 * Estado global centralizado para invalidação de cache de cidades (branches).
 *
 * Sempre que uma cidade for criada, atualizada, ativada/desativada ou
 * removida, este hook deve ser usado para garantir que TODAS as telas que
 * dependem de dados de cidade utilizem o `branch_id` mais recente.
 *
 * Ao invés de cada tela invalidar sua própria queryKey, centralizamos aqui
 * o catálogo completo de chaves afetadas.
 */

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Lista canônica de prefixos de queryKey que dependem de branches/cidades.
 *
 * Mantenha esta lista sincronizada com qualquer queryKey nova que envolva
 * dados de cidade, para que a invalidação global continue completa.
 */
export const BRANCH_RELATED_QUERY_KEYS: readonly (readonly unknown[])[] = [
  // Listas principais de cidades
  ["brand-branches"],
  ["brand-branch"],
  ["branches"],
  ["branches-select"],
  ["branches-wizard"],
  ["branches-notif"],
  ["branches-for-tier"],
  ["branches-for-seed"],
  ["branches-clone"],
  ["branches-options-addon"],
  ["templates-branches-list"],

  // Onboarding e configuração de cidade
  ["onboarding-branches"],
  ["city-onboarding-validation"],
  ["central-modulos-branches"],
  ["city-overrides"],
  ["overrides-branches"],
  ["config-cidade"],

  // Detalhe / scoring / regras vinculadas à cidade
  ["brand-branches-scoring"],
  ["branch-scoring-model"],
  ["branch-detail-gamificacao"],
  ["branch-feature"],
  ["branch-modules"],
  ["branch-integration"],
  ["branch-wallet"],

  // Métricas e dashboards segmentados por cidade
  ["branch-dashboard-stats-v2"],
  ["regras-resgate-efetivas"],
  ["gg-report-by-branch"],

  // Pontuação e regras de motorista (escopo cidade)
  ["driver-points-rules"],
  ["driver-points-rule-card"],

  // Outros consumidores frequentes
  ["base-rule"],
] as const;

/**
 * Hook que devolve utilitários para sincronizar o cache de cidades.
 *
 * - `syncAfterMutation()` invalida e refaz fetch de TODAS as chaves listadas
 *   acima. Use após criar / editar / excluir uma cidade.
 * - `invalidateAll()` apenas marca como stale (sem refetch imediato). Útil
 *   em fluxos onde a próxima tela já vai disparar suas próprias queries.
 */
export function useBranchesSync() {
  const queryClient = useQueryClient();

  const invalidateAll = useCallback(async () => {
    await Promise.all(
      BRANCH_RELATED_QUERY_KEYS.map((key) =>
        queryClient.invalidateQueries({ queryKey: key as unknown[] })
      )
    );
  }, [queryClient]);

  const refetchActive = useCallback(async () => {
    await Promise.all(
      BRANCH_RELATED_QUERY_KEYS.map((key) =>
        queryClient.refetchQueries({
          queryKey: key as unknown[],
          type: "active",
        })
      )
    );
  }, [queryClient]);

  /**
   * Fluxo recomendado pós-mutação: marca todas as chaves como stale e em
   * seguida força refetch imediato das que estão ativas (montadas em tela).
   */
  const syncAfterMutation = useCallback(async () => {
    await invalidateAll();
    await refetchActive();
  }, [invalidateAll, refetchActive]);

  return { invalidateAll, refetchActive, syncAfterMutation };
}
