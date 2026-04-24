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

/**
 * parseLanding — aceita apenas objetos planos. Rejeita arrays, null,
 * primitivos e qualquer coisa fora do shape esperado.
 */
function parseLanding(value: unknown): LandingConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as LandingConfig;
}

function safeWarn(campo: string, item: unknown) {
  try {
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(`[produtos_comerciais] item inválido em ${campo}:`, item);
    }
  } catch {
    /* noop */
  }
}

/** Type guards explícitos por campo rico. */
function isStringNaoVazia(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

type BenefitObject = { title: string; description?: string; icon?: string };
function isBenefitObject(v: unknown): v is BenefitObject {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (!isStringNaoVazia(o.title)) return false;
  if (o.description !== undefined && typeof o.description !== "string") return false;
  if (o.icon !== undefined && typeof o.icon !== "string") return false;
  return true;
}

type FaqItem = { question: string; answer: string };
function isFaqItem(v: unknown): v is FaqItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return isStringNaoVazia(o.question) && isStringNaoVazia(o.answer);
}

type Metric = { value: string; label: string };
function isMetric(v: unknown): v is Metric {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return isStringNaoVazia(o.value) && isStringNaoVazia(o.label);
}

type Testimonial = { name: string; quote: string; role?: string; avatar_url?: string };
function isTestimonial(v: unknown): v is Testimonial {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (!isStringNaoVazia(o.name) || !isStringNaoVazia(o.quote)) return false;
  if (o.role !== undefined && typeof o.role !== "string") return false;
  if (o.avatar_url !== undefined && typeof o.avatar_url !== "string") return false;
  return true;
}

type Screenshot = { url: string; caption?: string };
function isScreenshot(v: unknown): v is Screenshot {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (!isStringNaoVazia(o.url)) return false;
  if (o.caption !== undefined && typeof o.caption !== "string") return false;
  return true;
}

type SidebarLayoutGrupoRaw = { label: string; itens_keys: string[] };
function isSidebarLayoutGrupo(v: unknown): v is SidebarLayoutGrupoRaw {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (!isStringNaoVazia(o.label)) return false;
  if (!Array.isArray(o.itens_keys)) return false;
  return o.itens_keys.every((k) => typeof k === "string");
}

/** Filtra um array com type guard, descartando itens inválidos com warn. */
function filtrarComWarn<T>(
  campo: string,
  arr: unknown,
  guard: (v: unknown) => v is T,
): T[] {
  if (!Array.isArray(arr)) return [];
  const out: T[] = [];
  for (const item of arr) {
    if (guard(item)) {
      out.push(item);
    } else {
      safeWarn(campo, item);
    }
  }
  return out;
}

/**
 * Sanea o landing_config_json garantindo que campos ricos sempre cheguem
 * como arrays no shape esperado. Itens fora do contrato são descartados
 * silenciosamente (com console.warn), evitando React error #31 na UI.
 */
function sanitizeLanding(raw: LandingConfig): LandingConfig {
  const safe: LandingConfig = { ...raw };

  // benefits — aceita string OU { title, description?, icon? }
  const benefitsSrc = Array.isArray(raw.benefits) ? raw.benefits : [];
  const benefitsOut: Array<string | BenefitObject> = [];
  for (const item of benefitsSrc) {
    if (isStringNaoVazia(item)) {
      benefitsOut.push(item);
    } else if (isBenefitObject(item)) {
      const canonical: BenefitObject = { title: item.title };
      if (typeof item.description === "string") canonical.description = item.description;
      if (typeof item.icon === "string") canonical.icon = item.icon;
      benefitsOut.push(canonical);
    } else {
      safeWarn("benefits", item);
    }
  }
  safe.benefits = benefitsOut as LandingConfig["benefits"];

  safe.faq = filtrarComWarn("faq", raw.faq, isFaqItem) as LandingConfig["faq"];
  safe.metrics = filtrarComWarn("metrics", raw.metrics, isMetric) as LandingConfig["metrics"];
  safe.testimonials = filtrarComWarn(
    "testimonials",
    raw.testimonials,
    isTestimonial,
  ) as LandingConfig["testimonials"];
  safe.screenshots = filtrarComWarn(
    "screenshots",
    raw.screenshots,
    isScreenshot,
  ) as LandingConfig["screenshots"];

  safe.problems = filtrarComWarn("problems", raw.problems, isStringNaoVazia) as LandingConfig["problems"];
  safe.solutions = filtrarComWarn("solutions", raw.solutions, isStringNaoVazia) as LandingConfig["solutions"];

  // comparison_highlights — strings simples (se existir no payload)
  const ch = (raw as Record<string, unknown>).comparison_highlights;
  (safe as Record<string, unknown>).comparison_highlights = filtrarComWarn(
    "comparison_highlights",
    ch,
    isStringNaoVazia,
  );

  // sidebar_layout — objeto opcional com array de grupos
  const sl = (raw as Record<string, unknown>).sidebar_layout;
  if (sl && typeof sl === "object" && !Array.isArray(sl)) {
    const slObj = sl as Record<string, unknown>;
    const gruposValidos = filtrarComWarn(
      "sidebar_layout.grupos",
      slObj.grupos,
      isSidebarLayoutGrupo,
    );
    if (gruposValidos.length > 0) {
      safe.sidebar_layout = { grupos: gruposValidos };
    }
  }

  return safe;
}

/** Sanea features (sempre array de strings). */
function sanitizeFeatures(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
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
        features: sanitizeFeatures(row.features),
        excluded_features: sanitizeFeatures(row.excluded_features),
        is_popular: !!row.is_popular,
        is_active: !!row.is_active,
        is_public_listed: !!row.is_public_listed,
        trial_days: row.trial_days ?? 30,
        sort_order: row.sort_order ?? 100,
        landing_config_json: sanitizeLanding(parseLanding(row.landing_config_json)),
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
        features: sanitizeFeatures(row.features),
        excluded_features: sanitizeFeatures(row.excluded_features),
        landing_config_json: sanitizeLanding(parseLanding(row.landing_config_json)),
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
        features: sanitizeFeatures(row.features),
        excluded_features: sanitizeFeatures(row.excluded_features),
        is_popular: !!row.is_popular,
        is_active: !!row.is_active,
        is_public_listed: !!row.is_public_listed,
        trial_days: row.trial_days ?? 30,
        sort_order: row.sort_order ?? 100,
        landing_config_json: sanitizeLanding(parseLanding(row.landing_config_json)),
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
        features: sanitizeFeatures(row.features),
        excluded_features: sanitizeFeatures(row.excluded_features),
        is_popular: !!row.is_popular,
        is_active: !!row.is_active,
        is_public_listed: !!row.is_public_listed,
        trial_days: row.trial_days ?? 30,
        sort_order: row.sort_order ?? 100,
        landing_config_json: sanitizeLanding(parseLanding(row.landing_config_json)),
      }));
    },
  });
}
