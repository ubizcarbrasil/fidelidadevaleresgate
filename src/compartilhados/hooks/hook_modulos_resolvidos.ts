/**
 * useResolvedModules
 * ------------------
 * Hook unificado de resolução de módulos ativos para a sidebar.
 *
 * - Combina `module_definitions` (catálogo) + `brand_modules` (toggle marca)
 *   + `branches.branch_settings_json` (override por cidade quando branchId).
 * - Subscribe Realtime em `brand_modules` (filtrado por brand) e
 *   `module_definitions` (sem filtro, tabela pequena) → invalida a query
 *   instantaneamente quando algum admin altera um toggle.
 * - Mantém fallback explícito (staleTime curto + refetch on focus/reconnect)
 *   para o caso do canal Realtime cair silenciosamente.
 *
 * Regra de prioridade: cidade > marca > ALWAYS_ON_MODULES.
 */
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE } from "@/config/constants";

/** Módulos sempre visíveis mesmo sem linha em `brand_modules`. */
const ALWAYS_ON_MODULES = new Set<string>([
  "brand_settings",
  "csv_import",
  "subscription",
  "users_management",
]);

interface ResolvedModulesData {
  /** key -> is_enabled (já resolvido considerando cidade/marca/always-on) */
  enabledMap: Record<string, boolean>;
  /** lista bruta de definitions para consumo opcional */
  definitions: Array<{ id: string; key: string; category: string | null }>;
}

async function fetchResolvedModules(
  brandId: string,
  branchId: string | null
): Promise<ResolvedModulesData> {
  const [defsRes, brandModsRes, branchRes] = await Promise.all([
    supabase.from("module_definitions").select("id, key, category"),
    supabase
      .from("brand_modules")
      .select("module_definition_id, is_enabled, module_definitions!inner(key)")
      .eq("brand_id", brandId),
    branchId
      ? supabase
          .from("branches")
          .select("branch_settings_json")
          .eq("id", branchId)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (defsRes.error) throw defsRes.error;
  if (brandModsRes.error) throw brandModsRes.error;
  if (branchRes.error) throw branchRes.error;

  const definitions = (defsRes.data || []) as Array<{
    id: string;
    key: string;
    category: string | null;
  }>;

  const branchSettings =
    (branchRes.data as { branch_settings_json: Record<string, unknown> } | null)
      ?.branch_settings_json || null;

  const enabledMap: Record<string, boolean> = {};

  for (const def of definitions) {
    // 1) Cidade override (chave `module_<key>` em branch_settings_json)
    if (branchSettings && typeof branchSettings === "object") {
      const cityKey = `module_${def.key}`;
      if (cityKey in branchSettings) {
        // Regra unificada (mem://architecture/city-flag-resolution-rule):
        // ausente = OFF; presente respeita o booleano salvo.
        enabledMap[def.key] = (branchSettings as Record<string, unknown>)[cityKey] === true;
        continue;
      }
    }

    // 2) Toggle da marca
    const bm = (brandModsRes.data || []).find(
      (m: { module_definitions: { key: string } | null }) =>
        m.module_definitions?.key === def.key
    );
    if (bm) {
      enabledMap[def.key] = (bm as { is_enabled: boolean }).is_enabled;
      continue;
    }

    // 3) Fallback: sempre-on ou OFF
    enabledMap[def.key] = ALWAYS_ON_MODULES.has(def.key);
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
    // Fallback explícito caso Realtime caia silenciosamente:
    staleTime: CACHE.STALE_TIME_SHORT, // 30s
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Subscribe Realtime
  useEffect(() => {
    if (!brandId) return;

    const channel = supabase
      .channel(`resolved-modules-${brandId}-${normalizedBranchId ?? "no-branch"}`)
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
      );

    if (normalizedBranchId) {
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "branches",
          filter: `id=eq.${normalizedBranchId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey });
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [brandId, normalizedBranchId, qc, queryKey]);

  const isModuleEnabled = (moduleKey: string): boolean => {
    if (!brandId) return false;
    if (isLoading || !data) return false;
    if (moduleKey in data.enabledMap) return data.enabledMap[moduleKey];
    return ALWAYS_ON_MODULES.has(moduleKey);
  };

  return {
    isModuleEnabled,
    isLoading,
    modules: data?.enabledMap ?? {},
    definitions: data?.definitions ?? [],
  };
}
