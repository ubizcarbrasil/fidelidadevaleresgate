/**
 * hook_brand_feature — Sprint 3
 * Hooks para leitura/escrita de features consolidadas no Duelo Motorista.
 *
 * Features cobertas: 'cinturao' | 'aposta' | 'ranking'
 *
 * Defaults documentados (semântica das RPCs SQL):
 *  - cinturao : default ON  por cidade (branch_settings_json.enable_city_belt    !== false)
 *  - ranking  : default ON  por cidade (branch_settings_json.enable_city_ranking !== false)
 *  - aposta   : default OFF por cidade (branch_settings_json.enable_side_bets    === true)
 *
 * Sprint 4 (D9, fora de escopo):
 *  - Migrar useConfigDuelos para usar branch_has_feature.
 *  - Validação "apostas exige duelo na cidade".
 *  - UI por cidade para o admin marcar enable_side_bets.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DueloFeature = "cinturao" | "aposta" | "ranking";

export function useBrandFeature(
  brandId: string | null | undefined,
  feature: DueloFeature
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
      feature: DueloFeature;
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