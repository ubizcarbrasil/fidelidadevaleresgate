import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export type ScoringModel = "DRIVER_ONLY" | "PASSENGER_ONLY" | "BOTH";

/**
 * Agrega o scoring_model de todas as branches ativas da marca.
 * Retorna flags indicando se a marca opera com motoristas, passageiros ou ambos.
 */
export function useBrandScoringModels() {
  const { currentBrandId } = useBrandGuard();

  const { data, isLoading } = useQuery({
    queryKey: ["brand-scoring-models", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return { isDriverEnabled: true, isPassengerEnabled: true };

      const { data: branches, error } = await supabase
        .from("branches")
        .select("scoring_model")
        .eq("brand_id", currentBrandId)
        .eq("is_active", true);

      if (error) throw error;

      if (!branches || branches.length === 0) {
        return { isDriverEnabled: true, isPassengerEnabled: true };
      }

      const models = new Set(branches.map((b) => b.scoring_model as ScoringModel));

      const isDriverEnabled =
        models.has("DRIVER_ONLY") || models.has("BOTH");
      const isPassengerEnabled =
        models.has("PASSENGER_ONLY") || models.has("BOTH");

      return { isDriverEnabled, isPassengerEnabled };
    },
    enabled: !!currentBrandId,
    staleTime: 5 * 60_000, // 5 min — scoring_model raramente muda
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    isDriverEnabled: data?.isDriverEnabled ?? true,
    isPassengerEnabled: data?.isPassengerEnabled ?? true,
    isLoading,
  };
}
