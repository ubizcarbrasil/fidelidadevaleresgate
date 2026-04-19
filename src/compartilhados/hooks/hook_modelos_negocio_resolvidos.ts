/**
 * useResolvedBusinessModels — Sub-fase 5.2
 * ----------------------------------------
 * Hook unificado de resolução de Modelos de Negócio via RPC
 * `resolve_active_business_models`.
 *
 * - Cascata server-side: cidade > marca > inativo
 * - Subscribe Realtime em 3 tabelas (business_models,
 *   brand_business_models, city_business_model_overrides)
 * - Fallback: staleTime curto + refetch on focus/reconnect
 *
 * Disponível mas SEM CONSUMIDOR ATIVO. Será adotado a partir
 * da Sub-fase 5.3 conforme USE_BUSINESS_MODELS for ligado.
 */
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE } from "@/config/constants";

interface ResolvedBusinessModelsData {
  /** key -> is_enabled (resolvido no servidor) */
  enabledMap: Record<string, boolean>;
  /** lista bruta de definitions (mantido para compat de consumidores) */
  definitions: Array<{ key: string; source: string }>;
}

async function fetchResolvedBusinessModels(
  brandId: string,
  branchId: string | null
): Promise<ResolvedBusinessModelsData> {
  const { data, error } = await supabase.rpc("resolve_active_business_models", {
    p_brand_id: brandId,
    p_branch_id: branchId ?? undefined,
  });

  if (error) throw error;

  const rows = (data || []) as Array<{
    model_key: string;
    is_enabled: boolean;
    source: string;
  }>;

  const enabledMap: Record<string, boolean> = {};
  const definitions: Array<{ key: string; source: string }> = [];

  for (const row of rows) {
    enabledMap[row.model_key] = row.is_enabled;
    definitions.push({ key: row.model_key, source: row.source });
  }

  return { enabledMap, definitions };
}

export function useResolvedBusinessModels(
  brandId: string | null | undefined,
  branchId?: string | null
) {
  const qc = useQueryClient();
  const normalizedBranchId = branchId ?? null;

  const queryKey = useMemo(
    () => ["resolved-business-models", brandId ?? null, normalizedBranchId] as const,
    [brandId, normalizedBranchId]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchResolvedBusinessModels(brandId!, normalizedBranchId),
    enabled: !!brandId,
    staleTime: CACHE.STALE_TIME_SHORT, // 30s — fallback caso Realtime caia
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Subscribe Realtime: brand_business_models + business_models + city_business_model_overrides
  useEffect(() => {
    if (!brandId) return;

    const channel = supabase
      .channel(`resolved-business-models-v1-${brandId}-${normalizedBranchId ?? "no-branch"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "brand_business_models",
          filter: `brand_id=eq.${brandId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "business_models" },
        () => {
          qc.invalidateQueries({ queryKey });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "city_business_model_overrides",
          filter: `brand_id=eq.${brandId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey });
        }
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [brandId, normalizedBranchId, qc, queryKey]);

  const isModelEnabled = (modelKey: string): boolean => {
    if (!brandId) return false;
    if (isLoading || !data) return false;
    return data.enabledMap[modelKey] ?? false;
  };

  return {
    isModelEnabled,
    isLoading,
    models: data?.enabledMap ?? {},
    definitions: data?.definitions ?? [],
  };
}
