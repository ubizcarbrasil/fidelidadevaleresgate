/**
 * hook_brand_business_models — Sub-fase 5.5
 * ------------------------------------------
 * CRUD do empreendedor sobre seus Modelos de Negócio:
 *  - useBrandBusinessModels(brandId): lista de vínculos da brand
 *  - useToggleBrandBusinessModel: ativa/desativa modelo (UPSERT) + audit
 *  - useUpdateGanhaGanhaMargin: atualiza margem GG da brand + audit
 *
 * NÃO sincroniza brand_modules — separação garantida nesta fase
 * (sincronização vem na 5.7 via trigger).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BrandBusinessModelRow {
  id: string;
  brand_id: string;
  business_model_id: string;
  is_enabled: boolean;
  ganha_ganha_margin_pct: number | null;
  config_json: Record<string, unknown>;
  activated_at: string | null;
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
      entity_type: "brand_business_model",
      entity_id,
      action,
      changes_json: changes as never,
      actor_user_id: userData.user?.id ?? null,
    });
  } catch {
    /* fire-and-forget */
  }
}

const KEY = (brandId: string | null | undefined) =>
  ["brand-business-models", brandId] as const;

export function useBrandBusinessModels(brandId: string | null | undefined) {
  return useQuery({
    queryKey: KEY(brandId),
    enabled: !!brandId,
    staleTime: 15_000,
    queryFn: async (): Promise<BrandBusinessModelRow[]> => {
      const { data, error } = await supabase
        .from("brand_business_models")
        .select("*")
        .eq("brand_id", brandId!);
      if (error) throw error;
      return (data ?? []) as unknown as BrandBusinessModelRow[];
    },
  });
}

export interface ToggleInput {
  brandId: string;
  businessModelId: string;
  modelKey: string;
  enabled: boolean;
  existingRowId?: string;
}

export function useToggleBrandBusinessModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ToggleInput) => {
      let rowId: string | null = input.existingRowId ?? null;

      if (input.existingRowId) {
        const { error } = await supabase
          .from("brand_business_models")
          .update({
            is_enabled: input.enabled,
            activated_at: input.enabled ? new Date().toISOString() : null,
          })
          .eq("id", input.existingRowId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("brand_business_models")
          .insert({
            brand_id: input.brandId,
            business_model_id: input.businessModelId,
            is_enabled: input.enabled,
            activated_at: input.enabled ? new Date().toISOString() : null,
          })
          .select("id")
          .maybeSingle();
        if (error) throw error;
        rowId = (data?.id as string | undefined) ?? null;
      }

      await writeAudit(
        rowId,
        input.enabled ? "model_activated" : "model_deactivated",
        {
          brand_id: input.brandId,
          model_key: input.modelKey,
          from: !input.enabled,
          to: input.enabled,
        }
      );
      return rowId;
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: KEY(input.brandId) });
      toast.success(input.enabled ? "Modelo ativado" : "Modelo desativado");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao alterar modelo"),
  });
}

export interface UpdateMarginInput {
  brandId: string;
  businessModelId: string;
  marginPct: number;
  previousMarginPct: number | null;
  existingRowId?: string;
}

export function useUpdateGanhaGanhaMargin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateMarginInput) => {
      let rowId: string | null = input.existingRowId ?? null;

      if (input.existingRowId) {
        const { error } = await supabase
          .from("brand_business_models")
          .update({ ganha_ganha_margin_pct: input.marginPct })
          .eq("id", input.existingRowId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("brand_business_models")
          .insert({
            brand_id: input.brandId,
            business_model_id: input.businessModelId,
            is_enabled: true,
            ganha_ganha_margin_pct: input.marginPct,
            activated_at: new Date().toISOString(),
          })
          .select("id")
          .maybeSingle();
        if (error) throw error;
        rowId = (data?.id as string | undefined) ?? null;
      }

      await writeAudit(rowId, "ganha_ganha_margin_updated", {
        brand_id: input.brandId,
        from: input.previousMarginPct,
        to: input.marginPct,
      });
      return rowId;
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: KEY(input.brandId) });
      toast.success("Margem atualizada");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao salvar margem"),
  });
}
