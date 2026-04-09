import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export type ScoringModel = "DRIVER_ONLY" | "PASSENGER_ONLY" | "BOTH";

export function useBranchScoringModel(branchIdOverride?: string) {
  const { currentBranchId } = useBrandGuard();
  const effectiveBranchId = branchIdOverride || currentBranchId;

  const { data: scoringModel, isLoading } = useQuery({
    queryKey: ["branch-scoring-model", effectiveBranchId],
    queryFn: async () => {
      if (!effectiveBranchId) return "BOTH" as ScoringModel;
      const { data, error } = await supabase
        .from("branches")
        .select("scoring_model")
        .eq("id", effectiveBranchId)
        .single();
      if (error) throw error;
      return (data?.scoring_model as ScoringModel) || "BOTH";
    },
    enabled: !!effectiveBranchId,
  });

  const model = scoringModel || "BOTH";

  return {
    scoringModel: model as ScoringModel,
    isLoading,
    isDriverEnabled: model === "DRIVER_ONLY" || model === "BOTH",
    isPassengerEnabled: model === "PASSENGER_ONLY" || model === "BOTH",
  };
}
