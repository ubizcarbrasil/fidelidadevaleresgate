/**
 * hook_plan_business_models — Sub-fase 5.3
 * ----------------------------------------
 * Matriz Modelos × Planos (plan_business_models).
 *
 * Ações:
 *  - Listar matriz (Map<"planKey::modelId", { is_included }>)
 *  - Toggle individual (UPSERT)
 *  - Bulk: marca/desmarca todos os modelos de um plano
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PlanKey = "free" | "starter" | "profissional" | "enterprise";

export interface PlanBusinessModelRow {
  plan_key: string;
  business_model_id: string;
  is_included: boolean;
}

const MATRIX_KEY = ["plan-business-models-matrix"] as const;

async function writeAudit(
  action: string,
  changes: Record<string, unknown>,
  entity_id: string | null = null
) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      entity_type: "plan_business_model",
      entity_id,
      action,
      changes_json: changes as never,
      actor_user_id: userData.user?.id ?? null,
    });
  } catch {
    // não bloqueia
  }
}

export function usePlanBusinessModelsMatrix() {
  return useQuery({
    queryKey: MATRIX_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_business_models")
        .select("plan_key, business_model_id, is_included");
      if (error) throw error;
      const map = new Map<string, PlanBusinessModelRow>();
      (data ?? []).forEach((row) => {
        map.set(`${row.plan_key}::${row.business_model_id}`, row as PlanBusinessModelRow);
      });
      return map;
    },
    staleTime: 30_000,
  });
}

export function useTogglePlanBusinessModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      plan_key,
      business_model_id,
      is_included,
    }: {
      plan_key: PlanKey;
      business_model_id: string;
      is_included: boolean;
    }) => {
      const { error } = await supabase
        .from("plan_business_models")
        .upsert(
          { plan_key, business_model_id, is_included },
          { onConflict: "plan_key,business_model_id" }
        );
      if (error) throw error;
      await writeAudit(is_included ? "plan_included" : "plan_excluded", {
        plan_key,
        business_model_id,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MATRIX_KEY });
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha"),
  });
}

export function useBulkSetPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      plan_key,
      business_model_ids,
      is_included,
    }: {
      plan_key: PlanKey;
      business_model_ids: string[];
      is_included: boolean;
    }) => {
      const rows = business_model_ids.map((business_model_id) => ({
        plan_key,
        business_model_id,
        is_included,
      }));
      const { error } = await supabase
        .from("plan_business_models")
        .upsert(rows, { onConflict: "plan_key,business_model_id" });
      if (error) throw error;
      await writeAudit(is_included ? "plan_bulk_included" : "plan_bulk_excluded", {
        plan_key,
        count: business_model_ids.length,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MATRIX_KEY });
      toast.success("Plano atualizado");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha"),
  });
}
