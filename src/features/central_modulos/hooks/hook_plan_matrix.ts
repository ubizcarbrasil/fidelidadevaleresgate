import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PlanKey } from "../constants/constantes_planos";

export interface LinhaTemplatePlano {
  id: string;
  plan_key: string;
  module_definition_id: string;
  is_enabled: boolean;
}

const QUERY_KEY = ["plan-module-matrix"];

export function usePlanModuleMatrix() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_module_templates")
        .select("id, plan_key, module_definition_id, is_enabled");
      if (error) throw error;
      const map = new Map<string, LinhaTemplatePlano>();
      (data ?? []).forEach((row: any) => {
        map.set(`${row.plan_key}::${row.module_definition_id}`, row as LinhaTemplatePlano);
      });
      return map;
    },
  });
}

export function useTogglePlanModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      plan_key, module_definition_id, is_enabled,
    }: { plan_key: PlanKey; module_definition_id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from("plan_module_templates")
        .upsert(
          { plan_key, module_definition_id, is_enabled },
          { onConflict: "plan_key,module_definition_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha"),
  });
}

export function useBulkSetPlanModules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      plan_key, module_ids, is_enabled,
    }: { plan_key: PlanKey; module_ids: string[]; is_enabled: boolean }) => {
      const rows = module_ids.map((module_definition_id) => ({
        plan_key, module_definition_id, is_enabled,
      }));
      const { error } = await supabase
        .from("plan_module_templates")
        .upsert(rows, { onConflict: "plan_key,module_definition_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Plano atualizado");
    },
    onError: (e: any) => toast.error(e.message ?? "Falha"),
  });
}

/**
 * Conta quantas marcas de cada plano serão impactadas + customizações
 * (linhas em brand_modules cujo is_enabled diverge do template do plano).
 */
export function useImpactoAplicarRetro(planos: PlanKey[]) {
  return useQuery({
    queryKey: ["plan-retro-impact", [...planos].sort().join(",")],
    enabled: planos.length > 0,
    queryFn: async () => {
      const result: Record<string, { brands: number; customizations: number }> = {};
      for (const plan of planos) {
        const { data: brands, error: be } = await supabase
          .from("brands")
          .select("id")
          .eq("subscription_plan", plan);
        if (be) throw be;
        const brandIds = (brands ?? []).map((b: any) => b.id as string);

        if (brandIds.length === 0) {
          result[plan] = { brands: 0, customizations: 0 };
          continue;
        }

        const { data: tpl, error: te } = await supabase
          .from("plan_module_templates")
          .select("module_definition_id, is_enabled")
          .eq("plan_key", plan);
        if (te) throw te;
        const tplMap = new Map<string, boolean>();
        (tpl ?? []).forEach((r: any) => tplMap.set(r.module_definition_id, r.is_enabled));

        const { data: bm, error: bme } = await supabase
          .from("brand_modules")
          .select("brand_id, module_definition_id, is_enabled")
          .in("brand_id", brandIds);
        if (bme) throw bme;

        let custom = 0;
        (bm ?? []).forEach((r: any) => {
          const tplVal = tplMap.get(r.module_definition_id);
          if (tplVal === undefined) return; // sem template
          if (tplVal !== r.is_enabled) custom++;
        });

        result[plan] = { brands: brandIds.length, customizations: custom };
      }
      return result;
    },
  });
}

export function useAplicarRetroativamente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ planos }: { planos: PlanKey[] }) => {
      let totalBrands = 0;
      for (const plan of planos) {
        const { data: brands, error: be } = await supabase
          .from("brands").select("id").eq("subscription_plan", plan);
        if (be) throw be;
        const brandIds = (brands ?? []).map((b: any) => b.id as string);
        if (brandIds.length === 0) continue;

        const { data: tpl, error: te } = await supabase
          .from("plan_module_templates")
          .select("module_definition_id, is_enabled")
          .eq("plan_key", plan);
        if (te) throw te;

        const { error: de } = await supabase
          .from("brand_modules").delete().in("brand_id", brandIds);
        if (de) throw de;

        const rows: any[] = [];
        for (const bId of brandIds) {
          (tpl ?? []).forEach((r: any) => {
            rows.push({
              brand_id: bId,
              module_definition_id: r.module_definition_id,
              is_enabled: r.is_enabled,
            });
          });
        }
        if (rows.length > 0) {
          const { error: ie } = await supabase.from("brand_modules").insert(rows);
          if (ie) throw ie;
        }
        totalBrands += brandIds.length;
      }
      return { totalBrands };
    },
    onSuccess: ({ totalBrands }) => {
      qc.invalidateQueries({ queryKey: ["resolved-modules"] });
      qc.invalidateQueries({ queryKey: ["brand-modules-admin"] });
      toast.success(`${totalBrands} marca(s) sincronizadas com o template`);
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao aplicar"),
  });
}
