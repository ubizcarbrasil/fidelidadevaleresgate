/**
 * hook_ganha_ganha_pricing — Sub-fase 5.4
 * ----------------------------------------
 * Pricing histórico versionado do Ganha-Ganha (Opção B):
 *  - useGanhaGanhaPricing: linhas ATIVAS (valid_to IS NULL) por plano
 *  - useUpdateGanhaGanhaPricing: chama RPC `update_ganha_ganha_pricing` que
 *    fecha a versão atual + insere nova versão atomicamente
 *  - useBrandsWithGanhaGanha: lista de empreendedores com GG ativo
 *
 * Audit log escrito pelo cliente após mutation OK.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PlanKey } from "@/features/central_modulos/constants/constantes_planos";

// ============================================================================
// Types
// ============================================================================

export interface GanhaGanhaPricingRow {
  id: string;
  plan_key: string;
  price_per_point_cents: number;
  min_margin_pct: number | null;
  max_margin_pct: number | null;
  valid_from: string;
  valid_to: string | null;
}

export interface BrandWithGanhaGanha {
  brand_id: string;
  brand_name: string;
  subscription_plan: string;
  ganha_ganha_margin_pct: number | null;
  models_active: number;
  cities_with_override: number;
}

// ============================================================================
// Audit
// ============================================================================

async function writeAudit(
  entity_id: string | null,
  action: string,
  changes: Record<string, unknown>
) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      entity_type: "plan_ganha_ganha_pricing",
      entity_id,
      action,
      changes_json: changes as never,
      actor_user_id: userData.user?.id ?? null,
    });
  } catch {
    /* fire-and-forget */
  }
}

// ============================================================================
// SELECT: pricing ativo por plano
// ============================================================================

const PRICING_KEY = ["gg-pricing"] as const;

export function useGanhaGanhaPricing() {
  return useQuery({
    queryKey: PRICING_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_ganha_ganha_pricing")
        .select("*")
        .is("valid_to", null)
        .order("plan_key", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GanhaGanhaPricingRow[];
    },
    staleTime: 30_000,
  });
}

// ============================================================================
// UPDATE via RPC (atômica)
// ============================================================================

export interface UpdatePricingInput {
  plan_key: PlanKey;
  price_per_point_cents: number;
  min_margin_pct: number | null;
  max_margin_pct: number | null;
  // contexto para audit:
  previous?: {
    price_per_point_cents: number;
    min_margin_pct: number | null;
    max_margin_pct: number | null;
  };
  action?: "price_updated" | "margin_limits_updated" | "margin_limits_cleared";
}

export function useUpdateGanhaGanhaPricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdatePricingInput) => {
      const { data, error } = await supabase.rpc("update_ganha_ganha_pricing", {
        p_plan_key: input.plan_key,
        p_price_cents: input.price_per_point_cents,
        p_min_margin_pct: input.min_margin_pct ?? undefined,
        p_max_margin_pct: input.max_margin_pct ?? undefined,
      });
      if (error) throw error;

      const newId = (data as unknown as string) ?? null;
      await writeAudit(newId, input.action ?? "price_updated", {
        plan_key: input.plan_key,
        price: {
          from: input.previous?.price_per_point_cents ?? null,
          to: input.price_per_point_cents,
        },
        min_margin_pct: {
          from: input.previous?.min_margin_pct ?? null,
          to: input.min_margin_pct,
        },
        max_margin_pct: {
          from: input.previous?.max_margin_pct ?? null,
          to: input.max_margin_pct,
        },
      });
      return newId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRICING_KEY });
      toast.success("Pricing atualizado");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao atualizar pricing"),
  });
}

// ============================================================================
// SELECT: empreendedores com Ganha-Ganha ativo
// ============================================================================

export function useBrandsWithGanhaGanha() {
  return useQuery({
    queryKey: ["brands-with-ganha-ganha"] as const,
    queryFn: async (): Promise<BrandWithGanhaGanha[]> => {
      // 1) achar o id do business_model 'ganha_ganha'
      const { data: bm, error: bmErr } = await supabase
        .from("business_models")
        .select("id")
        .eq("key", "ganha_ganha")
        .maybeSingle();
      if (bmErr) throw bmErr;
      if (!bm) return [];

      // 2) listar brands com vínculo ativo nesse modelo
      const { data: links, error: linksErr } = await supabase
        .from("brand_business_models")
        .select("brand_id, ganha_ganha_margin_pct, is_enabled")
        .eq("business_model_id", bm.id)
        .eq("is_enabled", true);
      if (linksErr) throw linksErr;
      if (!links || links.length === 0) return [];

      const brandIds = links.map((l) => l.brand_id as string);

      // 3) brands metadata
      const { data: brands, error: brandsErr } = await supabase
        .from("brands")
        .select("id, name, subscription_plan")
        .in("id", brandIds);
      if (brandsErr) throw brandsErr;

      // 4) modelos ativos por brand (count em brand_business_models)
      const { data: allModels, error: amErr } = await supabase
        .from("brand_business_models")
        .select("brand_id, is_enabled")
        .in("brand_id", brandIds)
        .eq("is_enabled", true);
      if (amErr) throw amErr;

      const modelsByBrand = new Map<string, number>();
      (allModels ?? []).forEach((r) => {
        const bid = r.brand_id as string;
        modelsByBrand.set(bid, (modelsByBrand.get(bid) ?? 0) + 1);
      });

      // 5) overrides por cidade do modelo GG
      const { data: overrides, error: ovErr } = await supabase
        .from("city_business_model_overrides")
        .select("brand_id")
        .eq("business_model_id", bm.id)
        .in("brand_id", brandIds);
      if (ovErr) throw ovErr;

      const overridesByBrand = new Map<string, number>();
      (overrides ?? []).forEach((r) => {
        const bid = r.brand_id as string;
        overridesByBrand.set(bid, (overridesByBrand.get(bid) ?? 0) + 1);
      });

      const linkByBrand = new Map<string, number | null>();
      links.forEach((l) => {
        linkByBrand.set(l.brand_id as string, (l.ganha_ganha_margin_pct as number | null) ?? null);
      });

      const out: BrandWithGanhaGanha[] = (brands ?? [])
        .map((b) => ({
          brand_id: b.id as string,
          brand_name: (b.name as string) ?? "(sem nome)",
          subscription_plan: (b.subscription_plan as string) ?? "free",
          ganha_ganha_margin_pct: linkByBrand.get(b.id as string) ?? null,
          models_active: modelsByBrand.get(b.id as string) ?? 0,
          cities_with_override: overridesByBrand.get(b.id as string) ?? 0,
        }))
        .sort((a, b) => a.brand_name.localeCompare(b.brand_name, "pt-BR"));

      return out;
    },
    staleTime: 30_000,
  });
}
