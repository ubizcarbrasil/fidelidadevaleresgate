import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BranchResumo {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}

export type EstadoOverride = "inherit" | "override_on" | "override_off";

export interface OverviewLinhaCidade {
  module_definition_id: string;
  module_key: string;
  module_name: string;
  module_description: string | null;
  module_category: string;
  module_is_core: boolean;
  module_schema_json: any;
  state: EstadoOverride;
  override_id: string | null;
}

export function useBranchList(brandId: string | null) {
  return useQuery({
    queryKey: ["central-modulos-branches", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, city, state")
        .eq("brand_id", brandId!)
        .order("name");
      if (error) throw error;
      return (data ?? []) as BranchResumo[];
    },
  });
}

export function useCityModulesOverview(brandId: string | null, branchId: string | null) {
  return useQuery({
    queryKey: ["city-overrides", brandId, branchId],
    enabled: !!brandId && !!branchId,
    queryFn: async (): Promise<OverviewLinhaCidade[]> => {
      // 1. brand_modules ATIVOS dessa marca
      const { data: bm, error: bmErr } = await supabase
        .from("brand_modules")
        .select("module_definition_id, is_enabled")
        .eq("brand_id", brandId!)
        .eq("is_enabled", true);
      if (bmErr) throw bmErr;

      const activeIds = (bm ?? []).map((r: any) => r.module_definition_id);
      if (activeIds.length === 0) return [];

      // 2. metadados dos módulos
      const { data: defs, error: dErr } = await supabase
        .from("module_definitions")
        .select("id, key, name, description, category, is_core, schema_json")
        .in("id", activeIds);
      if (dErr) throw dErr;

      // 3. overrides existentes da branch
      const { data: ov, error: oErr } = await supabase
        .from("city_module_overrides")
        .select("id, module_definition_id, is_enabled")
        .eq("branch_id", branchId!);
      if (oErr) throw oErr;

      const ovMap = new Map<string, { id: string; is_enabled: boolean }>();
      (ov ?? []).forEach((r: any) => {
        ovMap.set(r.module_definition_id, { id: r.id, is_enabled: r.is_enabled });
      });

      const result: OverviewLinhaCidade[] = (defs ?? []).map((d: any) => {
        const o = ovMap.get(d.id);
        let state: EstadoOverride = "inherit";
        if (o) state = o.is_enabled ? "override_on" : "override_off";
        return {
          module_definition_id: d.id,
          module_key: d.key,
          module_name: d.name,
          module_description: d.description,
          module_category: d.category,
          module_is_core: d.is_core,
          module_schema_json: d.schema_json,
          state,
          override_id: o?.id ?? null,
        };
      });

      result.sort((a, b) => a.module_name.localeCompare(b.module_name));
      return result;
    },
  });
}

/**
 * Cicla: inherit -> override_on -> override_off -> inherit
 *  - inherit -> override_on: INSERT is_enabled=true
 *  - override_on -> override_off: UPDATE is_enabled=false
 *  - override_off -> inherit: DELETE
 */
export function useCycleOverrideState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      current,
      brandId,
      branchId,
      moduleDefinitionId,
      overrideId,
    }: {
      current: EstadoOverride;
      brandId: string;
      branchId: string;
      moduleDefinitionId: string;
      overrideId: string | null;
    }) => {
      if (current === "inherit") {
        const { error } = await supabase.from("city_module_overrides").insert({
          brand_id: brandId,
          branch_id: branchId,
          module_definition_id: moduleDefinitionId,
          is_enabled: true,
        });
        if (error) throw error;
      } else if (current === "override_on") {
        if (!overrideId) throw new Error("override_id ausente");
        const { error } = await supabase
          .from("city_module_overrides")
          .update({ is_enabled: false })
          .eq("id", overrideId);
        if (error) throw error;
      } else {
        if (!overrideId) throw new Error("override_id ausente");
        const { error } = await supabase
          .from("city_module_overrides")
          .delete()
          .eq("id", overrideId);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["city-overrides", vars.brandId, vars.branchId] });
      qc.invalidateQueries({ queryKey: ["resolved-modules"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao alternar override"),
  });
}

export function useClearAllOverrides() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ brandId, branchId }: { brandId: string; branchId: string }) => {
      const { error, count } = await supabase
        .from("city_module_overrides")
        .delete({ count: "exact" })
        .eq("branch_id", branchId);
      if (error) throw error;
      return { count: count ?? 0, brandId, branchId };
    },
    onSuccess: ({ count, brandId, branchId }) => {
      qc.invalidateQueries({ queryKey: ["city-overrides", brandId, branchId] });
      qc.invalidateQueries({ queryKey: ["resolved-modules"] });
      toast.success(`${count} override(s) removido(s)`);
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao limpar"),
  });
}
