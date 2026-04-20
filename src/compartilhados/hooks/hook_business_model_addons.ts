/**
 * hook_business_model_addons — Sub-fase 6.1
 * ------------------------------------------
 * CRUD da camada de Add-ons avulsos (Modelos de Negócio vendidos individualmente).
 *
 * - list_business_model_addons (RPC) — lista enriquecida com brand + model
 * - grant: concede add-on manualmente (Root Admin)
 * - update: edita ciclo/preço/notas
 * - cancel: marca como cancelled
 * - delete: remove fisicamente (uso raro)
 *
 * Cada mutation invalida:
 *   ["business-model-addons-list"]
 *   ["brand-active-addons", brandId]
 *   ["resolved-business-models"]  (refetch global)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BusinessModelAddonRow {
  id: string;
  brand_id: string;
  brand_name: string;
  brand_slug: string;
  subscription_plan: string;
  branch_id: string | null;
  branch_name: string | null;
  business_model_id: string;
  model_key: string;
  model_name: string;
  model_audience: string;
  status: "active" | "cancelled" | "past_due";
  billing_cycle: "monthly" | "yearly";
  price_cents: number;
  activated_at: string;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
}

const LIST_KEY = ["business-model-addons-list"] as const;

function invalidateAddonsAll(qc: ReturnType<typeof useQueryClient>, brandId?: string) {
  qc.invalidateQueries({ queryKey: LIST_KEY });
  qc.invalidateQueries({
    predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "brand-active-addons",
  });
  qc.invalidateQueries({
    predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "resolved-business-models",
  });
  if (brandId) {
    qc.invalidateQueries({ queryKey: ["brand-active-addons", brandId] });
  }
}

export function useBusinessModelAddons() {
  return useQuery({
    queryKey: LIST_KEY,
    staleTime: 30_000,
    queryFn: async (): Promise<BusinessModelAddonRow[]> => {
      const { data, error } = await supabase.rpc("list_business_model_addons");
      if (error) throw error;
      return (data ?? []) as unknown as BusinessModelAddonRow[];
    },
  });
}

export interface GrantAddonInput {
  brand_id: string;
  /** NULL = marca inteira; UUID = cidade específica */
  branch_id?: string | null;
  business_model_id: string;
  billing_cycle: "monthly" | "yearly";
  price_cents: number;
  expires_at?: string | null;
  notes?: string | null;
}

export function useGrantBusinessModelAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: GrantAddonInput) => {
      const { data: userData } = await supabase.auth.getUser();

      const payload = {
        brand_id: input.brand_id,
        branch_id: input.branch_id ?? null,
        business_model_id: input.business_model_id,
        billing_cycle: input.billing_cycle,
        price_cents: input.price_cents,
        expires_at: input.expires_at ?? null,
        notes: input.notes ?? null,
        status: "active",
        activated_at: new Date().toISOString(),
        created_by: userData.user?.id ?? null,
      };

      // O UNIQUE usa COALESCE(branch_id, '00000…'), então o upsert do PostgREST
      // não funciona. Buscamos manualmente (NULL = marca-toda; UUID = cidade) e
      // atualizamos ou inserimos.
      let q = supabase
        .from("brand_business_model_addons")
        .select("id")
        .eq("brand_id", input.brand_id)
        .eq("business_model_id", input.business_model_id);
      q = input.branch_id
        ? q.eq("branch_id", input.branch_id)
        : q.is("branch_id", null);
      const { data: found, error: findErr } = await q.maybeSingle();
      if (findErr) throw findErr;

      if (found?.id) {
        const { data, error } = await supabase
          .from("brand_business_model_addons")
          .update(payload)
          .eq("id", found.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("brand_business_model_addons")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      invalidateAddonsAll(qc, vars.brand_id);
      toast.success("Add-on concedido");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao conceder add-on"),
  });
}

export interface UpdateAddonInput {
  id: string;
  brand_id: string;
  billing_cycle?: "monthly" | "yearly";
  price_cents?: number;
  expires_at?: string | null;
  notes?: string | null;
  status?: "active" | "cancelled" | "past_due";
}

export function useUpdateBusinessModelAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, brand_id: _b, ...patch }: UpdateAddonInput) => {
      const { error } = await supabase
        .from("brand_business_model_addons")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      invalidateAddonsAll(qc, vars.brand_id);
      toast.success("Add-on atualizado");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao atualizar"),
  });
}

export function useCancelBusinessModelAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; brand_id: string }) => {
      const { error } = await supabase
        .from("brand_business_model_addons")
        .update({ status: "cancelled", expires_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      invalidateAddonsAll(qc, vars.brand_id);
      toast.success("Add-on cancelado");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao cancelar"),
  });
}

export function useDeleteBusinessModelAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; brand_id: string }) => {
      const { error } = await supabase
        .from("brand_business_model_addons")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      invalidateAddonsAll(qc, vars.brand_id);
      toast.success("Add-on removido");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao remover"),
  });
}
