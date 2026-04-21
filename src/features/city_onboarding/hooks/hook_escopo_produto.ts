/**
 * hook_escopo_produto — useProductScope
 * --------------------------------------
 * Centraliza a leitura do escopo do produto comercial (plano) contratado pela marca.
 *
 * Combina:
 *  - brands.subscription_plan          → plano vigente
 *  - plan_business_models              → modelos inclusos (audiência)
 *  - plan_module_templates             → módulos habilitados (module keys)
 *  - business_models.audience          → audiências cobertas
 *
 * Expõe helpers para filtrar a UI de configuração da cidade conforme o produto.
 */
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export type Audiencia = "motorista" | "cliente" | "b2b";
export type ScoringModelPermitido = "DRIVER_ONLY" | "PASSENGER_ONLY" | "BOTH";

export interface EscopoProduto {
  isLoading: boolean;
  planKey: string | null;
  audiences: Set<Audiencia>;
  moduleKeys: Set<string>;
  hasAudience: (a: Audiencia) => boolean;
  hasAnyAudience: (...a: Audiencia[]) => boolean;
  hasModuleKey: (k: string) => boolean;
  hasAnyModuleKey: (...k: string[]) => boolean;
  allowedScoringModels: ScoringModelPermitido[];
  /** Quando o plano não está mapeado, devolve `true` em todos os helpers (modo permissivo). */
  isPermissive: boolean;
}

const PERMISSIVE_FALLBACK_PLANS = new Set(["enterprise", "free"]);

export function useProductScope(brandIdOverride?: string): EscopoProduto {
  const { currentBrandId } = useBrandGuard();
  const brandId = brandIdOverride || currentBrandId;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["product-scope", brandId],
    enabled: !!brandId,
    staleTime: 60_000,
    queryFn: async () => {
      // Reaproveita o cache de useBrandInfo quando disponível (evita query extra)
      const cached = queryClient.getQueryData<any>(["brand-info", brandId]);
      let planKey: string | null = cached?.subscription_plan ?? null;
      if (!planKey) {
        const { data: brand } = await supabase
          .from("brands")
          .select("subscription_plan")
          .eq("id", brandId!)
          .maybeSingle();
        planKey = brand?.subscription_plan ?? null;
      }
      if (!planKey) {
        return { planKey: null, audiences: [] as Audiencia[], moduleKeys: [] as string[] };
      }

      const [{ data: pbm }, { data: pmt }] = await Promise.all([
        supabase
          .from("plan_business_models")
          .select("business_model_id, is_included, business_models!inner(audience)")
          .eq("plan_key", planKey)
          .eq("is_included", true),
        supabase
          .from("plan_module_templates")
          .select("is_enabled, module_definitions!inner(key)")
          .eq("plan_key", planKey)
          .eq("is_enabled", true),
      ]);

      const audiences: Audiencia[] = (pbm ?? [])
        .map((row: any) => row.business_models?.audience as Audiencia)
        .filter(Boolean);
      const moduleKeys: string[] = (pmt ?? [])
        .map((row: any) => row.module_definitions?.key as string)
        .filter(Boolean);

      return { planKey, audiences, moduleKeys };
    },
  });

  return useMemo<EscopoProduto>(() => {
    const planKey = data?.planKey ?? null;
    const audiences = new Set<Audiencia>(data?.audiences ?? []);
    const moduleKeys = new Set<string>(data?.moduleKeys ?? []);

    // Modo permissivo: planos legados sem mapeamento, ou enterprise.
    const isPermissive =
      !planKey ||
      PERMISSIVE_FALLBACK_PLANS.has(planKey) ||
      (audiences.size === 0 && moduleKeys.size === 0);

    const hasAudience = (a: Audiencia) => (isPermissive ? true : audiences.has(a));
    const hasAnyAudience = (...a: Audiencia[]) => a.some(hasAudience);
    const hasModuleKey = (k: string) => (isPermissive ? true : moduleKeys.has(k));
    const hasAnyModuleKey = (...k: string[]) => k.some(hasModuleKey);

    const allowed: ScoringModelPermitido[] = [];
    const motorista = hasAudience("motorista");
    const cliente = hasAudience("cliente");
    if (motorista) allowed.push("DRIVER_ONLY");
    if (cliente) allowed.push("PASSENGER_ONLY");
    if (motorista && cliente) allowed.push("BOTH");

    return {
      isLoading,
      planKey,
      audiences,
      moduleKeys,
      hasAudience,
      hasAnyAudience,
      hasModuleKey,
      hasAnyModuleKey,
      allowedScoringModels: allowed.length > 0 ? allowed : ["DRIVER_ONLY", "PASSENGER_ONLY", "BOTH"],
      isPermissive,
    };
  }, [data, isLoading]);
}

/**
 * Normaliza o `scoring_model` para um valor compatível com o plano.
 * Se o atual já é compatível, retorna ele mesmo. Caso contrário, pega o primeiro permitido.
 */
export function normalizarScoringModel(
  atual: string,
  permitidos: ScoringModelPermitido[]
): ScoringModelPermitido {
  if (permitidos.includes(atual as ScoringModelPermitido)) {
    return atual as ScoringModelPermitido;
  }
  return permitidos[0] ?? "DRIVER_ONLY";
}

/** Rótulo amigável para o nome do plano. */
export function rotuloDoPlano(planKey: string | null): string {
  if (!planKey) return "—";
  const map: Record<string, string> = {
    free: "Gratuito",
    starter: "Starter",
    profissional: "Profissional",
    enterprise: "Enterprise",
    vr_motorista_premium: "Engajamento Motorista Premium",
    vr_cliente_premium: "Engajamento Cliente Premium",
    vr_completo: "Engajamento Completo",
  };
  return map[planKey] ?? planKey;
}