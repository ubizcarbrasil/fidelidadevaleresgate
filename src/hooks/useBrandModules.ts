import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export function useBrandModules() {
  const { currentBrandId, consoleScope } = useBrandGuard();
  const isRoot = consoleScope === "ROOT";

  const { data: brandModules, isLoading } = useQuery({
    queryKey: ["brand-modules-active", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_modules")
        .select("module_definition_id, is_enabled, module_definitions!inner(key)")
        .eq("brand_id", currentBrandId!);
      if (error) throw error;
      return data;
    },
    enabled: !!currentBrandId && !isRoot,
  });

  /** Returns true if the module is enabled for the current brand.
   *  ROOT always sees everything. If no brand_modules row exists, module is hidden. */
  const isModuleEnabled = (moduleKey: string): boolean => {
    if (isRoot) return true;
    if (isLoading || !brandModules) return true; // show while loading
    const entry = brandModules.find(
      (bm: any) => (bm.module_definitions as any)?.key === moduleKey
    );
    return entry ? entry.is_enabled : false;
  };

  return { isModuleEnabled, isLoading };
}
