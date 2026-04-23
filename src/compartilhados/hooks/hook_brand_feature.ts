/**
 * hook_brand_feature — Sprint 3 + Sprint 4B
 * Hooks para leitura/escrita de features consolidadas no Duelo Motorista.
 *
 * Features cobertas: 'duelo' | 'cinturao' | 'aposta' | 'ranking'
 *
 * Defaults documentados (semântica das RPCs SQL):
 *  - duelo    : default ON  por cidade (branch_settings_json.enable_driver_duels !== false)
 *  - cinturao : default ON  por cidade (branch_settings_json.enable_city_belt    !== false)
 *  - ranking  : default ON  por cidade (branch_settings_json.enable_city_ranking !== false)
 *  - aposta   : default OFF por cidade (OR de enable_side_bets / enable_duel_side_bets === true)
 *
 * Sprint 4B (entregue):
 *  - Validação D9 ("apostas exige duelo na cidade") aplicada na RPC `branch_set_feature`.
 *  - Cascata: desligar duelo quando há apostas exige `cascadeSideBets=true`.
 *  - Dual-write: ao gravar 'aposta', a RPC escreve em ambas
 *    `enable_side_bets` e `enable_duel_side_bets` (compat com UI legada).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DueloFeature = "duelo" | "cinturao" | "aposta" | "ranking";

/**
 * Brand-level: 'duelo' não está no whitelist de `brand_has_feature` no SQL.
 * Use este subtipo para hooks de marca.
 */
export type DueloBrandFeature = "cinturao" | "aposta" | "ranking";

export function useBrandFeature(
  brandId: string | null | undefined,
  feature: DueloBrandFeature
) {
  return useQuery({
    queryKey: ["brand-feature", brandId, feature] as const,
    enabled: !!brandId,
    staleTime: 30_000,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc("brand_has_feature", {
        p_brand_id: brandId!,
        p_feature: feature,
      });
      if (error) throw error;
      return Boolean(data);
    },
  });
}

export function useBranchFeature(
  branchId: string | null | undefined,
  feature: DueloFeature
) {
  return useQuery({
    queryKey: ["branch-feature", branchId, feature] as const,
    enabled: !!branchId,
    staleTime: 30_000,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc("branch_has_feature", {
        p_branch_id: branchId!,
        p_feature: feature,
      });
      if (error) throw error;
      return Boolean(data);
    },
  });
}

export function useSetBrandDueloFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      brandId: string;
      feature: DueloBrandFeature;
      enabled: boolean;
    }) => {
      const { error } = await supabase.rpc("brand_set_duelo_feature", {
        p_brand_id: input.brandId,
        p_feature: input.feature,
        p_enabled: input.enabled,
      });
      if (error) throw error;
      return input;
    },
    onSuccess: (input) => {
      qc.invalidateQueries({ queryKey: ["brand-feature", input.brandId] });
      qc.invalidateQueries({ queryKey: ["brand-business-models", input.brandId] });
      qc.invalidateQueries({ queryKey: ["branch-feature"] });
      toast.success(
        input.enabled
          ? "Recurso ativado no Duelo"
          : "Recurso desativado no Duelo"
      );
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar recurso";
      toast.error(msg);
    },
  });
}

/**
 * Sprint 4B — mutação por cidade.
 * Aplica D9 e cascata via RPC `branch_set_feature`. A UI deve confirmar
 * a cascata ANTES de chamar com `cascadeSideBets=true`.
 *
 * Retorno da RPC: `{ applied: string[], cascaded: string[] }`.
 */
export function useSetBranchFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      branchId: string;
      feature: DueloFeature;
      enabled: boolean;
      cascadeSideBets?: boolean;
    }) => {
      const { data, error } = await supabase.rpc("branch_set_feature", {
        p_branch_id: input.branchId,
        p_feature: input.feature,
        p_enabled: input.enabled,
        p_cascade_side_bets: input.cascadeSideBets ?? false,
      });
      if (error) throw error;
      const result = (data ?? {}) as { applied?: string[]; cascaded?: string[] };
      return { input, result };
    },
    onSuccess: ({ input, result }) => {
      qc.invalidateQueries({ queryKey: ["branch-feature", input.branchId] });
      qc.invalidateQueries({ queryKey: ["branch-duelo-raw", input.branchId] });
      qc.invalidateQueries({ queryKey: ["branch-detail-gamificacao", input.branchId] });

      const cascaded = result.cascaded ?? [];
      if (cascaded.length > 0) {
        toast.success(
          `Recurso atualizado. Apostas foram desligadas em cascata.`
        );
      } else {
        toast.success(
          input.enabled ? "Recurso ativado na cidade" : "Recurso desativado na cidade"
        );
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar recurso";
      toast.error(msg);
    },
  });
}