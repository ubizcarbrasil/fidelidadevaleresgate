/**
 * hook_modelos_negocio_crud — Sub-fase 5.3
 * ----------------------------------------
 * Hooks CRUD da camada de Modelos de Negócio (UI Raiz).
 *
 * - Catálogo de business_models (SELECT + UPDATE + INSERT + soft-delete)
 * - Vínculos N-N business_model_modules (UPSERT/DELETE)
 * - Agregador para badges no Catálogo de módulos técnicos
 *
 * Cada mutation invalida 3 queryKeys:
 *   ["business-models-catalog"]
 *   ["resolved-business-models"]  (refetch global, ignora prefixo)
 *   ["business-model-modules", modelId?]
 *
 * Audit log escrito pelo cliente após mutation OK (padrão 4.1a/4.1b).
 * Trigger DB virá na 5.7.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

export type BusinessModelAudience = "cliente" | "motorista" | "b2b";
export type BusinessModelPricing = "included" | "usage_based" | "fixed_addon";

export interface BusinessModelRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  audience: string;
  pricing_model: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessModelModuleRow {
  business_model_id: string;
  module_definition_id: string;
  is_required: boolean;
}

export interface NovoBusinessModelInput {
  key: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  audience: BusinessModelAudience;
  pricing_model: BusinessModelPricing;
  sort_order?: number;
}

export interface AtualizarBusinessModelInput {
  name?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

// ============================================================================
// Audit log helper
// ============================================================================

async function writeAudit(
  entity_type: string,
  entity_id: string | null,
  action: string,
  changes: Record<string, unknown>
) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      entity_type,
      entity_id,
      action,
      changes_json: changes as never,
      actor_user_id: userData.user?.id ?? null,
    });
  } catch {
    // não bloqueia a mutation
  }
}

// ============================================================================
// Catálogo de Business Models
// ============================================================================

const CATALOG_KEY = ["business-models-catalog"] as const;

export function useBusinessModelsCatalog() {
  return useQuery({
    queryKey: CATALOG_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_models")
        .select("*")
        .order("audience", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BusinessModelRow[];
    },
    staleTime: 30_000,
  });
}

function invalidateBusinessModelsAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: CATALOG_KEY });
  qc.invalidateQueries({
    predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "resolved-business-models",
  });
  qc.invalidateQueries({
    predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "business-model-modules",
  });
  qc.invalidateQueries({
    predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "modules-grouped-by-model",
  });
}

export function useCreateBusinessModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NovoBusinessModelInput) => {
      const { data, error } = await supabase
        .from("business_models")
        .insert({
          key: input.key,
          name: input.name,
          description: input.description ?? null,
          icon: input.icon ?? null,
          color: input.color ?? null,
          audience: input.audience,
          pricing_model: input.pricing_model,
          sort_order: input.sort_order ?? 0,
        })
        .select()
        .single();
      if (error) throw error;
      await writeAudit("business_model", data.id, "created", { ...input });
      return data as BusinessModelRow;
    },
    onSuccess: () => {
      invalidateBusinessModelsAll(qc);
      toast.success("Modelo criado");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao criar modelo"),
  });
}

export function useUpdateBusinessModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AtualizarBusinessModelInput }) => {
      const { data, error } = await supabase
        .from("business_models")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await writeAudit("business_model", id, "updated", { ...input });
      return data as BusinessModelRow;
    },
    onSuccess: () => {
      invalidateBusinessModelsAll(qc);
      toast.success("Modelo atualizado");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao atualizar"),
  });
}

export function useToggleBusinessModelActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("business_models")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
      await writeAudit("business_model", id, "toggled_active", { is_active });
    },
    onSuccess: () => {
      invalidateBusinessModelsAll(qc);
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha"),
  });
}

// ============================================================================
// Vínculos N-N business_model_modules
// ============================================================================

export function useBusinessModelModules(modelId: string | null | undefined) {
  return useQuery({
    queryKey: ["business-model-modules", modelId ?? null] as const,
    enabled: !!modelId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_model_modules")
        .select("business_model_id, module_definition_id, is_required")
        .eq("business_model_id", modelId!);
      if (error) throw error;
      return (data ?? []) as BusinessModelModuleRow[];
    },
    staleTime: 30_000,
  });
}

export function useSetBusinessModelModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      business_model_id,
      module_definition_id,
      linked,
      is_required,
    }: {
      business_model_id: string;
      module_definition_id: string;
      linked: boolean;
      is_required: boolean;
    }) => {
      if (!linked) {
        const { error } = await supabase
          .from("business_model_modules")
          .delete()
          .eq("business_model_id", business_model_id)
          .eq("module_definition_id", module_definition_id);
        if (error) throw error;
        await writeAudit("business_model_modules", business_model_id, "module_unlinked", {
          module_definition_id,
        });
      } else {
        const { error } = await supabase
          .from("business_model_modules")
          .upsert(
            { business_model_id, module_definition_id, is_required },
            { onConflict: "business_model_id,module_definition_id" }
          );
        if (error) throw error;
        await writeAudit("business_model_modules", business_model_id, "module_linked", {
          module_definition_id,
          is_required,
        });
      }
    },
    onSuccess: () => {
      invalidateBusinessModelsAll(qc);
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha"),
  });
}

// ============================================================================
// Agregador para badges no Catálogo de módulos técnicos
// ============================================================================

export interface ModuleBusinessModelLink {
  model_id: string;
  model_key: string;
  model_name: string;
  model_color: string | null;
  is_required: boolean;
}

export type ModulesGroupedByModel = Record<string, ModuleBusinessModelLink[]>;

export function useModulesGroupedByModel() {
  return useQuery({
    queryKey: ["modules-grouped-by-model"] as const,
    queryFn: async (): Promise<ModulesGroupedByModel> => {
      const [linksRes, modelsRes] = await Promise.all([
        supabase
          .from("business_model_modules")
          .select("business_model_id, module_definition_id, is_required"),
        supabase
          .from("business_models")
          .select("id, key, name, color, sort_order, audience")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);
      if (linksRes.error) throw linksRes.error;
      if (modelsRes.error) throw modelsRes.error;

      const modelById = new Map<string, { key: string; name: string; color: string | null }>();
      (modelsRes.data ?? []).forEach((m) => {
        modelById.set(m.id as string, {
          key: m.key as string,
          name: m.name as string,
          color: (m.color as string | null) ?? null,
        });
      });

      const out: ModulesGroupedByModel = {};
      (linksRes.data ?? []).forEach((row) => {
        const moduleId = row.module_definition_id as string;
        const modelInfo = modelById.get(row.business_model_id as string);
        if (!modelInfo) return; // modelo inativo
        (out[moduleId] ||= []).push({
          model_id: row.business_model_id as string,
          model_key: modelInfo.key,
          model_name: modelInfo.name,
          model_color: modelInfo.color,
          is_required: row.is_required as boolean,
        });
      });

      // Ordena cada grupo: required primeiro, depois alfabética
      Object.values(out).forEach((arr) => {
        arr.sort((a, b) => {
          if (a.is_required !== b.is_required) return a.is_required ? -1 : 1;
          return a.model_name.localeCompare(b.model_name, "pt-BR");
        });
      });

      return out;
    },
    staleTime: 60_000,
  });
}
