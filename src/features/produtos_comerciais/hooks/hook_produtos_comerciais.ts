/**
 * hook_produtos_comerciais — CRUD completo de Produtos Comerciais.
 *
 * Abstrai sobre `subscription_plans` + sincroniza:
 *  - `plan_business_models` (modelos liberados pelo produto)
 *  - `plan_module_templates` (módulos pré-ativados pelo produto)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  ProdutoComercial,
  ProdutoComercialDraft,
  LandingConfig,
} from "../types/tipos_produto";

const QK_LIST = ["produtos-comerciais"] as const;
const QK_DETAIL = (planKey: string) => ["produtos-comerciais", "detail", planKey] as const;

function parseLanding(value: unknown): LandingConfig {
  if (!value || typeof value !== "object") return {};
  return value as LandingConfig;
}

export function useProdutosComerciais() {
  return useQuery({
    queryKey: QK_LIST,
    queryFn: async (): Promise<ProdutoComercial[]> => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        plan_key: row.plan_key,
        label: row.label,
        product_name: row.product_name ?? row.label,
        slug: row.slug ?? row.plan_key,
        price_cents: row.price_cents ?? 0,
        price_yearly_cents: row.price_yearly_cents ?? null,
        features: row.features ?? [],
        excluded_features: row.excluded_features ?? [],
        is_popular: !!row.is_popular,
        is_active: !!row.is_active,
        is_public_listed: !!row.is_public_listed,
        trial_days: row.trial_days ?? 30,
        sort_order: row.sort_order ?? 100,
        landing_config_json: parseLanding(row.landing_config_json),
      }));
    },
  });
}

export function useProdutoComercial(planKey: string | undefined) {
  return useQuery({
    queryKey: QK_DETAIL(planKey ?? ""),
    enabled: !!planKey,
    queryFn: async (): Promise<ProdutoComercialDraft | null> => {
      if (!planKey) return null;
      const [planRes, bmRes, modRes] = await Promise.all([
        supabase.from("subscription_plans").select("*").eq("plan_key", planKey).maybeSingle(),
        supabase.from("plan_business_models").select("business_model_id, is_included").eq("plan_key", planKey),
        supabase.from("plan_module_templates").select("module_definition_id, is_enabled").eq("plan_key", planKey),
      ]);
      if (planRes.error) throw planRes.error;
      if (!planRes.data) return null;
      const row: any = planRes.data;
      return {
        id: row.id,
        plan_key: row.plan_key,
        label: row.label,
        product_name: row.product_name ?? row.label,
        slug: row.slug ?? row.plan_key,
        price_cents: row.price_cents ?? 0,
        price_yearly_cents: row.price_yearly_cents ?? null,
        trial_days: row.trial_days ?? 30,
        is_popular: !!row.is_popular,
        is_active: !!row.is_active,
        is_public_listed: !!row.is_public_listed,
        sort_order: row.sort_order ?? 100,
        features: row.features ?? [],
        excluded_features: row.excluded_features ?? [],
        landing_config_json: parseLanding(row.landing_config_json),
        business_model_ids: (bmRes.data ?? [])
          .filter((r: any) => r.is_included)
          .map((r: any) => r.business_model_id),
        module_definition_ids: (modRes.data ?? [])
          .filter((r: any) => r.is_enabled)
          .map((r: any) => r.module_definition_id),
      };
    },
  });
}

async function syncPlanBusinessModels(planKey: string, ids: string[]) {
  const { data: existing } = await supabase
    .from("plan_business_models")
    .select("business_model_id")
    .eq("plan_key", planKey);
  const existingIds = new Set((existing ?? []).map((r: any) => r.business_model_id));
  const toAdd = ids.filter((id) => !existingIds.has(id));
  const toRemove = [...existingIds].filter((id) => !ids.includes(id));

  if (toAdd.length) {
    await supabase
      .from("plan_business_models")
      .upsert(
        toAdd.map((business_model_id) => ({ plan_key: planKey, business_model_id, is_included: true })),
        { onConflict: "plan_key,business_model_id" },
      );
  }
  // Modelos removidos viram is_included = false (preserva histórico)
  for (const id of toRemove) {
    await supabase
      .from("plan_business_models")
      .upsert(
        { plan_key: planKey, business_model_id: id, is_included: false },
        { onConflict: "plan_key,business_model_id" },
      );
  }
  // Atualiza ativos pra is_included=true
  if (ids.length) {
    await supabase
      .from("plan_business_models")
      .upsert(
        ids.map((business_model_id) => ({ plan_key: planKey, business_model_id, is_included: true })),
        { onConflict: "plan_key,business_model_id" },
      );
  }
}

async function syncPlanModuleTemplates(planKey: string, ids: string[]) {
  const { data: existing } = await supabase
    .from("plan_module_templates")
    .select("module_definition_id")
    .eq("plan_key", planKey);
  const existingIds = new Set((existing ?? []).map((r: any) => r.module_definition_id));
  const toRemove = [...existingIds].filter((id) => !ids.includes(id));

  if (ids.length) {
    await supabase
      .from("plan_module_templates")
      .upsert(
        ids.map((module_definition_id) => ({ plan_key: planKey, module_definition_id, is_enabled: true })),
        { onConflict: "plan_key,module_definition_id" },
      );
  }
  for (const id of toRemove) {
    await supabase
      .from("plan_module_templates")
      .upsert(
        { plan_key: planKey, module_definition_id: id, is_enabled: false },
        { onConflict: "plan_key,module_definition_id" },
      );
  }
}

export function useSalvarProdutoComercial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (draft: ProdutoComercialDraft) => {
      // Upsert do plano (chave: plan_key)
      const payload: any = {
        plan_key: draft.plan_key,
        label: draft.label,
        product_name: draft.product_name,
        slug: draft.slug,
        price_cents: draft.price_cents,
        price_yearly_cents: draft.price_yearly_cents,
        trial_days: draft.trial_days,
        is_popular: draft.is_popular,
        is_active: draft.is_active,
        is_public_listed: draft.is_public_listed,
        sort_order: draft.sort_order,
        features: draft.features,
        excluded_features: draft.excluded_features,
        landing_config_json: draft.landing_config_json as never,
      };

      const { error } = await supabase
        .from("subscription_plans")
        .upsert(payload, { onConflict: "plan_key" });
      if (error) throw error;

      await syncPlanBusinessModels(draft.plan_key, draft.business_model_ids);
      await syncPlanModuleTemplates(draft.plan_key, draft.module_definition_ids);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_LIST });
      qc.invalidateQueries({ queryKey: ["subscription-plans"] });
      qc.invalidateQueries({ queryKey: ["plan-business-models-matrix"] });
      toast.success("Produto comercial salvo!");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao salvar produto"),
  });
}

export function useExcluirProdutoComercial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planKey: string) => {
      const { error } = await supabase.from("subscription_plans").delete().eq("plan_key", planKey);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_LIST });
      toast.success("Produto removido");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao remover"),
  });
}

export function useProdutoPorSlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["produto-comercial-slug", slug],
    enabled: !!slug,
    queryFn: async (): Promise<ProdutoComercial | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row: any = data;
      return {
        id: row.id,
        plan_key: row.plan_key,
        label: row.label,
        product_name: row.product_name ?? row.label,
        slug: row.slug ?? row.plan_key,
        price_cents: row.price_cents ?? 0,
        price_yearly_cents: row.price_yearly_cents ?? null,
        features: row.features ?? [],
        excluded_features: row.excluded_features ?? [],
        is_popular: !!row.is_popular,
        is_active: !!row.is_active,
        is_public_listed: !!row.is_public_listed,
        trial_days: row.trial_days ?? 30,
        sort_order: row.sort_order ?? 100,
        landing_config_json: parseLanding(row.landing_config_json),
      };
    },
  });
}

export function useProdutosPublicos() {
  return useQuery({
    queryKey: ["produtos-publicos"],
    queryFn: async (): Promise<ProdutoComercial[]> => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .eq("is_public_listed", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        plan_key: row.plan_key,
        label: row.label,
        product_name: row.product_name ?? row.label,
        slug: row.slug ?? row.plan_key,
        price_cents: row.price_cents ?? 0,
        price_yearly_cents: row.price_yearly_cents ?? null,
        features: row.features ?? [],
        excluded_features: row.excluded_features ?? [],
        is_popular: !!row.is_popular,
        is_active: !!row.is_active,
        is_public_listed: !!row.is_public_listed,
        trial_days: row.trial_days ?? 30,
        sort_order: row.sort_order ?? 100,
        landing_config_json: parseLanding(row.landing_config_json),
      }));
    },
  });
}
