import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export type BranchModuleKey =
  | "enable_duels_module"
  | "enable_achadinhos_module"
  | "enable_marketplace_module"
  | "enable_race_earn_module"
  | "enable_customer_scoring_module";

export function useBranchModules(branchIdOverride?: string) {
  const { currentBranchId } = useBrandGuard();
  const effectiveBranchId = branchIdOverride || currentBranchId;

  const { data: settings, isLoading } = useQuery({
    queryKey: ["branch-modules", effectiveBranchId],
    queryFn: async () => {
      if (!effectiveBranchId) return null;
      const { data, error } = await supabase
        .from("branches")
        .select("branch_settings_json")
        .eq("id", effectiveBranchId)
        .single();
      if (error) throw error;
      return (data?.branch_settings_json as Record<string, any>) || null;
    },
    enabled: !!effectiveBranchId,
  });

  const isBranchModuleEnabled = (key: BranchModuleKey): boolean => {
    if (!settings || typeof settings !== "object") return false;
    // UNIFIED RULE: use === true so missing key = OFF (matches admin Configuração por Cidade)
    return settings[key] === true;
  };

  return { isBranchModuleEnabled, isLoading };
}
