/**
 * useResolvedModules — Fase 3
 * ---------------------------
 * Hook unificado de resolução de módulos via RPC `resolve_active_modules`.
 *
 * - Cascata server-side: cidade > marca > is_core > inativo
 * - Subscribe Realtime em 3 tabelas (brand_modules, module_definitions,
 *   city_module_overrides) → invalida a query instantaneamente quando
 *   algum admin altera um toggle.
 * - Mantém fallback explícito (staleTime curto + refetch on focus/reconnect)
 *   para o caso do canal Realtime cair silenciosamente.
 * - `ALWAYS_ON_MODULES` mantido como guardrail (Fase 4 elimina via is_core=true).
 */
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE } from "@/config/constants";

/** Guardrail: módulos sempre visíveis mesmo sem linha em brand_modules e sem is_core. */
const ALWAYS_ON_MODULES = new Set<string>([
  "brand_settings",
  "csv_import",
  "subscription",
  "users_management",
]);

interface ResolvedModulesData {
  /** key -> is_enabled (resolvido no servidor) */
  enabledMap: Record<string, boolean>;
  /** lista bruta de definitions (mantido para compat de consumidores) */
  definitions: Array<{ key: string; source: string }>;
}

async function fetchResolvedModules(
  brandId: string,
  branchId: string | null
): Promise<ResolvedModulesData> {
  const { data, error } = await supabase.rpc("resolve_active_modules", {
    p_brand_id: brandId,
    p_branch_id: branchId ?? undefined,
  });

  if (error) throw error;

  const rows = (data || []) as Array<{
    module_key: string;
    is_enabled: boolean;
    source: string;
  }>;

  const enabledMap: Record<string, boolean> = {};
  const definitions: Array<{ key: string; source: string }> = [];

  for (const row of rows) {
    enabledMap[row.module_key] = row.is_enabled;
    definitions.push({ key: row.module_key, source: row.source });
  }

  return { enabledMap, definitions };
}

export function useResolvedModules(
  brandId: string | null | undefined,
  branchId?: string | null
) {
  const qc = useQueryClient();
  const normalizedBranchId = branchId ?? null;

  const queryKey = useMemo(
    () => ["resolved-modules", brandId ?? null, normalizedBranchId] as const,
    [brandId, normalizedBranchId]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchResolvedModules(brandId!, normalizedBranchId),
    enabled: !!brandId,
    staleTime: CACHE.STALE_TIME_SHORT, // 30s — fallback caso Realtime caia
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Subscribe Realtime: brand_modules + module_definitions + city_module_overrides
  useEffect(() => {
    if (!brandId) return;

    const channel = supabase
      .channel(`resolved-modules-v2-${brandId}-${normalizedBranchId ?? "no-branch"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "brand_modules",
          filter: `brand_id=eq.${brandId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "module_definitions" },
        () => {
          qc.invalidateQueries({ queryKey });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "city_module_overrides",
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

  const isModuleEnabled = (moduleKey: string): boolean => {
    if (!brandId) return false;
    if (isLoading || !data) return false;
    if (moduleKey in data.enabledMap) return data.enabledMap[moduleKey];
    // Guardrail: módulos legados sem registro em catálogo
    return ALWAYS_ON_MODULES.has(moduleKey);
  };

  return {
    isModuleEnabled,
    isLoading,
    modules: data?.enabledMap ?? {},
    definitions: data?.definitions ?? [],
  };
}
