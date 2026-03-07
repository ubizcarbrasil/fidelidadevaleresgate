/**
 * CRM Tier hooks — distribuição e configuração de tiers.
 */
import { useQuery } from "@tanstack/react-query";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import * as tierService from "../services/tierService";

// Re-export types
export type { TierConfig, TierWithCount } from "../types";

export function useTierConfig() {
  const { currentBrandId } = useBrandGuard();

  return useQuery({
    queryKey: ["crm-tiers", currentBrandId],
    queryFn: () => tierService.fetchTierConfig(currentBrandId!),
    enabled: !!currentBrandId,
    staleTime: 5 * 60_000, // 5min — config rarely changes
  });
}

export function useTierDistribution() {
  const { currentBrandId } = useBrandGuard();
  const { data: tiers } = useTierConfig();

  return useQuery({
    queryKey: ["crm-tier-distribution", currentBrandId, tiers?.map((t) => t.id).join(",")],
    queryFn: () => tierService.fetchTierDistribution(currentBrandId!, tiers!),
    enabled: !!currentBrandId && !!tiers,
    staleTime: 60_000,
  });
}
