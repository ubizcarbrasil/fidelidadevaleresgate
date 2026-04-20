/**
 * hook_brand_plan_business_models — Sub-fase 5.5
 * -----------------------------------------------
 * Combinador que retorna, para uma brand+plano:
 *  - all: todos os 13 modelos do catálogo (ativos)
 *  - availableKeys: chaves liberadas pelo plano da brand
 *  - activeMap: vínculos atuais em brand_business_models
 *
 * O componente da UI categoriza visualmente em 3 estados:
 *   ACTIVE | AVAILABLE_INACTIVE | LOCKED
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useBrandBusinessModels,
  type BrandBusinessModelRow,
} from "./hook_brand_business_models";

export interface BusinessModelDef {
  id: string;
  key: string;
  name: string;
  description: string | null;
  audience: "cliente" | "motorista" | "b2b";
  color: string | null;
  icon: string | null;
  pricing_model: string;
  sort_order: number;
}

const ALL_KEY = ["business-models-all"] as const;

function useAllBusinessModels() {
  return useQuery({
    queryKey: ALL_KEY,
    staleTime: 60_000,
    queryFn: async (): Promise<BusinessModelDef[]> => {
      const { data, error } = await supabase
        .from("business_models")
        .select(
          "id, key, name, description, audience, color, icon, pricing_model, sort_order"
        )
        .eq("is_active", true)
        .order("audience", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as BusinessModelDef[];
    },
  });
}

function usePlanBusinessModels(planKey: string | null | undefined) {
  return useQuery({
    queryKey: ["plan-business-models", planKey] as const,
    enabled: !!planKey,
    staleTime: 60_000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("plan_business_models")
        .select("business_model_id")
        .eq("plan_key", planKey!);
      if (error) throw error;
      return (data ?? []).map((r) => r.business_model_id as string);
    },
  });
}

function useBrandPlan(brandId: string | null | undefined) {
  return useQuery({
    queryKey: ["brand-plan", brandId] as const,
    enabled: !!brandId,
    staleTime: 30_000,
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase
        .from("brands")
        .select("subscription_plan")
        .eq("id", brandId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.subscription_plan as string) ?? "free";
    },
  });
}

export type ModelState = "active" | "available_inactive" | "locked";
export type ModelSource = "plan" | "addon" | null;

export interface ResolvedBusinessModel {
  def: BusinessModelDef;
  state: ModelState;
  row: BrandBusinessModelRow | null;
  source: ModelSource;
}

function useBrandActiveAddonIds(brandId: string | null | undefined) {
  return useQuery({
    queryKey: ["brand-active-addons", brandId] as const,
    enabled: !!brandId,
    staleTime: 30_000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("brand_business_model_addons")
        .select("business_model_id")
        .eq("brand_id", brandId!)
        .eq("status", "active");
      if (error) throw error;
      return (data ?? []).map((r) => r.business_model_id as string);
    },
  });
}

export function useBrandPlanBusinessModels(brandId: string | null | undefined) {
  const allQ = useAllBusinessModels();
  const planQ = useBrandPlan(brandId);
  const planModelsQ = usePlanBusinessModels(planQ.data);
  const brandModelsQ = useBrandBusinessModels(brandId);
  const addonsQ = useBrandActiveAddonIds(brandId);

  const isLoading =
    allQ.isLoading ||
    planQ.isLoading ||
    planModelsQ.isLoading ||
    brandModelsQ.isLoading ||
    addonsQ.isLoading;

  const resolved: ResolvedBusinessModel[] = useMemo(() => {
    const all = allQ.data ?? [];
    const planSet = new Set(planModelsQ.data ?? []);
    const addonSet = new Set(addonsQ.data ?? []);
    const rowByModel = new Map<string, BrandBusinessModelRow>();
    (brandModelsQ.data ?? []).forEach((r) => rowByModel.set(r.business_model_id, r));

    return all.map((def) => {
      const row = rowByModel.get(def.id) ?? null;
      const inPlan = planSet.has(def.id);
      const inAddon = addonSet.has(def.id);
      let state: ModelState = "locked";
      let source: ModelSource = null;
      if (inPlan || inAddon) {
        state = row?.is_enabled ? "active" : "available_inactive";
        // plano tem precedência semântica, mas add-on é destacado quando exclusivo
        source = inPlan ? "plan" : "addon";
      }
      return { def, state, row, source };
    });
  }, [allQ.data, planModelsQ.data, brandModelsQ.data, addonsQ.data]);

  const grouped = useMemo(() => {
    const out: Record<"cliente" | "motorista" | "b2b", ResolvedBusinessModel[]> = {
      cliente: [],
      motorista: [],
      b2b: [],
    };
    resolved.forEach((r) => {
      out[r.def.audience].push(r);
    });
    return out;
  }, [resolved]);

  const counts = useMemo(() => {
    let active = 0;
    let total = 0;
    resolved.forEach((r) => {
      if (r.state !== "locked") {
        total += 1;
        if (r.state === "active") active += 1;
      }
    });
    return { active, total, all: resolved.length };
  }, [resolved]);

  return {
    isLoading,
    planKey: planQ.data ?? null,
    resolved,
    grouped,
    counts,
  };
}
