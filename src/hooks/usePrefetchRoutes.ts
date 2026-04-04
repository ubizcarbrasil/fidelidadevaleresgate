import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { queryKeys } from "@/lib/queryKeys";
import { CACHE } from "@/config/constants";

/**
 * Prefetch inteligente: carrega em background as queries mais acessadas
 * assim que o usuário entra na área do cliente, tornando a navegação
 * entre abas praticamente instantânea.
 */
export function usePrefetchRoutes() {
  const queryClient = useQueryClient();
  const { brand, selectedBranch } = useBrand();
  const { customer } = useCustomer();

  const brandId = brand?.id;
  const branchId = selectedBranch?.id;
  const customerId = customer?.id;

  useEffect(() => {
    if (!brandId || !branchId) return;

    // Prefetch ofertas ativas (tab Ofertas)
    queryClient.prefetchQuery({
      queryKey: queryKeys.offers.list(brandId, branchId, "all-offers"),
      staleTime: CACHE.PREFETCH_STALE_TIME,
      queryFn: async () => {
        const { data } = await supabase
          .from("offers")
          .select("*, stores(name, logo_url, banner_url, taxonomy_segment_id)")
          .eq("branch_id", branchId)
          .eq("brand_id", brandId)
          .eq("status", "ACTIVE")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        return data || [];
      },
    });
  }, [brandId, branchId, queryClient]);

  useEffect(() => {
    if (!customerId) return;

    // Prefetch resgates do cliente (tab Resgates)
    queryClient.prefetchQuery({
      queryKey: queryKeys.customerRedemptions.list(customerId),
      staleTime: CACHE.PREFETCH_STALE_TIME,
      queryFn: async () => {
        const { data } = await supabase
          .from("redemptions")
          .select(`
            *,
            offers(
              title, image_url, value_rescue, discount_percent,
              coupon_type, redemption_type, terms_text, min_purchase,
              start_at, end_at, is_cumulative, allowed_weekdays, allowed_hours,
              stores(name, logo_url, address, whatsapp, site_url, instagram)
            ),
            branches(name)
          `)
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .range(0, 19);
        return data || [];
      },
    });

    // Prefetch contagem do ledger de pontos (tab Wallet)
    queryClient.prefetchQuery({
      queryKey: queryKeys.customerWallet.count(customerId),
      staleTime: CACHE.PREFETCH_STALE_TIME,
      queryFn: async () => {
        const { count } = await supabase
          .from("points_ledger")
          .select("*", { count: "exact", head: true })
          .eq("customer_id", customerId);
        return count || 0;
      },
    });
  }, [customerId, queryClient]);
}
