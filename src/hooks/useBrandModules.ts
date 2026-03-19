import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export function useBrandModules() {
  const { currentBrandId, currentBranchId, consoleScope } = useBrandGuard();
  const isRoot = consoleScope === "ROOT";

  // Resolve brand_id from branch when not directly available (e.g. branch_admin)
  const { data: resolvedBrandId } = useQuery({
    queryKey: ["resolve-brand-from-branch", currentBranchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("brand_id")
        .eq("id", currentBranchId!)
        .single();
      if (error) throw error;
      return data.brand_id;
    },
    enabled: !currentBrandId && !!currentBranchId && !isRoot,
  });

  const effectiveBrandId = currentBrandId || resolvedBrandId || null;

  const { data: brandModules, isLoading } = useQuery({
    queryKey: ["brand-modules-active", effectiveBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_modules")
        .select("module_definition_id, is_enabled, module_definitions!inner(key)")
        .eq("brand_id", effectiveBrandId!);
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveBrandId && !isRoot,
  });

  /** Modules that should always be visible even without a brand_modules row. */
  const ALWAYS_ON_MODULES = new Set([
    "brand_settings", "csv_import", "subscription", "users_management",
  ]);

  const isModuleEnabled = (moduleKey: string): boolean => {
    if (isRoot) return true;
    if (isLoading || !effectiveBrandId) return false; // hide while resolving
    if (!brandModules) return false; // no data = hide by default
    const entry = brandModules.find(
      (bm: any) => (bm.module_definitions as any)?.key === moduleKey
    );
    if (entry) return entry.is_enabled;
    return ALWAYS_ON_MODULES.has(moduleKey);
  };

  return { isModuleEnabled, isLoading };
}
