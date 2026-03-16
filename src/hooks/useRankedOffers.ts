import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { useQuery } from "@tanstack/react-query";

/**
 * Shared hook for ranked/recommended offers.
 * Deduplicates the RPC call across HomeSectionsRenderer and ForYouSection.
 */
export function useRankedOffers(limit = 30) {
  const { brand, selectedBranch } = useBrand();
  const { customer } = useCustomer();

  return useQuery({
    queryKey: ["ranked-offers", brand?.id, selectedBranch?.id, customer?.id, limit],
    enabled: !!brand && !!selectedBranch,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_recommended_offers", {
        p_brand_id: brand!.id,
        p_branch_id: selectedBranch!.id,
        p_customer_id: customer?.id ?? undefined,
        p_limit: limit,
      });
      if (error || !data?.length) return [];
      return (data as { offer_id: string; score: number }[]).map((r) => r.offer_id);
    },
  });
}
