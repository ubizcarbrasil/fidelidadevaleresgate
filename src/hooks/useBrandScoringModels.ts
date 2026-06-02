import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { queryKeys } from "@/lib/queryKeys";

export type ScoringModel = "DRIVER_ONLY" | "PASSENGER_ONLY" | "BOTH";

/**
 * Agrega o scoring_model de todas as branches ativas da marca.
 * Retorna flags indicando se a marca opera com motoristas, passageiros ou ambos.
 */
export function useBrandScoringModels() {
  const { currentBrandId } = useBrandGuard();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.brandScoringModels.list(currentBrandId),
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
    // scoring_model muda só em reconfig admin (raríssimo). 30 min é seguro
    // e corta refetch entre navegação de páginas.
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    isDriverEnabled: data?.isDriverEnabled ?? true,
    isPassengerEnabled: data?.isPassengerEnabled ?? true,
    isLoading,
  };
}
