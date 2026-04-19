/**
 * hook_city_business_model_overrides — Sub-fase 5.6
 * --------------------------------------------------
 * CRUD sobre `city_business_model_overrides` (overrides por cidade).
 *
 *  - useCityBusinessModelOverrides(brandId, branchId)
 *      → SELECT da tabela (linhas explícitas)
 *  - useSetCityBusinessModelOverride()
 *      → cria/atualiza override (UPSERT)
 *  - useDeleteCityBusinessModelOverride()
 *      → DELETE explícito (volta ao herdado)
 *  - useClearAllCityBusinessModelOverrides()
 *      → DELETE de todos os overrides daquela branch
 *
 * Audit log: entity_type = "city_business_model_override".
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CityBusinessModelOverrideRow {
  id: string;
  brand_id: string;
  branch_id: string;
  business_model_id: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

async function writeAudit(
  entity_id: string | null,
  action: string,
  changes: Record<string, unknown>
) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      entity_type: "city_business_model_override",
      entity_id,
      action,
      changes_json: changes as never,
      actor_user_id: userData.user?.id ?? null,
    });
  } catch {
    /* fire-and-forget */
  }
}

const KEY = (brandId: string | null | undefined, branchId: string | null | undefined) =>
  ["city-business-model-overrides", brandId, branchId] as const;

export function useCityBusinessModelOverrides(
  brandId: string | null | undefined,
  branchId: string | null | undefined
) {
  return useQuery({
    queryKey: KEY(brandId, branchId),
    enabled: !!brandId && !!branchId,
    staleTime: 15_000,
    queryFn: async (): Promise<CityBusinessModelOverrideRow[]> => {
      const { data, error } = await supabase
        .from("city_business_model_overrides")
        .select("*")
        .eq("brand_id", brandId!)
        .eq("branch_id", branchId!);
      if (error) throw error;
      return (data ?? []) as unknown as CityBusinessModelOverrideRow[];
    },
  });
}

export interface SetOverrideInput {
  brandId: string;
  branchId: string;
  businessModelId: string;
  modelKey: string;
  enabled: boolean;
  existingRowId?: string;
}

export function useSetCityBusinessModelOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SetOverrideInput) => {
      let rowId: string | null = input.existingRowId ?? null;

      if (input.existingRowId) {
        const { error } = await supabase
          .from("city_business_model_overrides")
          .update({ is_enabled: input.enabled })
          .eq("id", input.existingRowId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("city_business_model_overrides")
          .insert({
            brand_id: input.brandId,
            branch_id: input.branchId,
            business_model_id: input.businessModelId,
            is_enabled: input.enabled,
          })
          .select("id")
          .maybeSingle();
        if (error) throw error;
        rowId = (data?.id as string | undefined) ?? null;
      }

      await writeAudit(
        rowId,
        input.enabled ? "override_enabled" : "override_disabled",
        {
          brand_id: input.brandId,
          branch_id: input.branchId,
          business_model_id: input.businessModelId,
          model_key: input.modelKey,
          is_enabled: input.enabled,
        }
      );
      return rowId;
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: KEY(input.brandId, input.branchId) });
      qc.invalidateQueries({ queryKey: ["resolved-business-models"] });
      toast.success(
        input.enabled
          ? "Modelo religado nesta cidade"
          : "Modelo desligado nesta cidade"
      );
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao alterar override"),
  });
}

export interface DeleteOverrideInput {
  rowId: string;
  brandId: string;
  branchId: string;
  businessModelId: string;
  modelKey: string;
  previousIsEnabled: boolean;
}

export function useDeleteCityBusinessModelOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DeleteOverrideInput) => {
      const { error } = await supabase
        .from("city_business_model_overrides")
        .delete()
        .eq("id", input.rowId);
      if (error) throw error;

      await writeAudit(input.rowId, "override_removed", {
        brand_id: input.brandId,
        branch_id: input.branchId,
        business_model_id: input.businessModelId,
        model_key: input.modelKey,
        previous_is_enabled: input.previousIsEnabled,
      });
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: KEY(input.brandId, input.branchId) });
      qc.invalidateQueries({ queryKey: ["resolved-business-models"] });
      toast.success("Override removido — voltou ao herdado da marca");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao remover override"),
  });
}

export interface ClearAllOverridesInput {
  brandId: string;
  branchId: string;
}

export function useClearAllCityBusinessModelOverrides() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClearAllOverridesInput) => {
      const { error, count } = await supabase
        .from("city_business_model_overrides")
        .delete({ count: "exact" })
        .eq("brand_id", input.brandId)
        .eq("branch_id", input.branchId);
      if (error) throw error;

      await writeAudit(null, "overrides_cleared_all", {
        brand_id: input.brandId,
        branch_id: input.branchId,
        deleted_count: count ?? 0,
      });
      return count ?? 0;
    },
    onSuccess: (deleted, input) => {
      qc.invalidateQueries({ queryKey: KEY(input.brandId, input.branchId) });
      qc.invalidateQueries({ queryKey: ["resolved-business-models"] });
      toast.success(`${deleted} override(s) removido(s)`);
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao limpar overrides"),
  });
}
