import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

/**
 * Fetches pending counts for sidebar badge indicators.
 * Returns a map of sidebar item keys → pending count.
 */
export function useSidebarBadges() {
  const { currentBrandId } = useBrandGuard();

  const { data: badges = {} } = useQuery({
    queryKey: ["sidebar-badges", currentBrandId],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!currentBrandId) return {};

      const [storeApprovals, ruleApprovals, emitterRequests, pendingRedemptions] = await Promise.all([
        // Pending store approvals
        supabase
          .from("stores")
          .select("id", { count: "exact", head: true })
          .eq("brand_id", currentBrandId)
          .eq("approval_status", "PENDING_APPROVAL"),

        // Pending store points rule approvals
        supabase
          .from("store_points_rules")
          .select("id", { count: "exact", head: true })
          .eq("status", "PENDING_APPROVAL"),

        // Pending emitter (store_type) requests
        supabase
          .from("store_type_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "PENDING"),

        // Pending redemptions
        supabase
          .from("redemptions")
          .select("id", { count: "exact", head: true })
          .eq("brand_id", currentBrandId)
          .eq("status", "PENDING"),
      ]);

      const result: Record<string, number> = {};

      if (storeApprovals.count && storeApprovals.count > 0) {
        result["sidebar.parceiros"] = storeApprovals.count;
      }
      if (ruleApprovals.count && ruleApprovals.count > 0) {
        result["sidebar.aprovar_regras"] = ruleApprovals.count;
      }
      if (emitterRequests.count && emitterRequests.count > 0) {
        result["sidebar.solicitacoes_emissor"] = emitterRequests.count;
      }
      if (pendingRedemptions.count && pendingRedemptions.count > 0) {
        result["sidebar.resgates"] = pendingRedemptions.count;
      }

      return result;
    },
    enabled: !!currentBrandId,
    refetchInterval: 30_000, // refresh every 30s
    staleTime: 15_000,
  });

  return badges;
}
