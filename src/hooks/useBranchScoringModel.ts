import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export type ScoringModel = "DRIVER_ONLY" | "PASSENGER_ONLY" | "BOTH";

export function useBranchScoringModel() {
  const { currentBranchId } = useBrandGuard();

  const { data: scoringModel, isLoading } = useQuery({
    queryKey: ["branch-scoring-model", currentBranchId],
    queryFn: async () => {
      if (!currentBranchId) return "BOTH" as ScoringModel;
      const { data, error } = await supabase
        .from("branches")
        .select("scoring_model")
        .eq("id", currentBranchId)
        .single();
      if (error) throw error;
      return (data?.scoring_model as ScoringModel) || "BOTH";
    },
    enabled: !!currentBranchId,
  });

  const model = scoringModel || "BOTH";

  return {
    scoringModel: model as ScoringModel,
    isLoading,
    isDriverEnabled: model === "DRIVER_ONLY" || model === "BOTH",
    isPassengerEnabled: model === "PASSENGER_ONLY" || model === "BOTH",
  };
}
