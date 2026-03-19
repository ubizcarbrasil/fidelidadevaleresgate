/**
 * Store owner redemption tab — refactored into sub-components.
 * Uses RedeemPinInput, RedemptionHistoryList and useRedeemMutation.
 */
import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import RedeemPinInput from "./RedeemPinInput";
import RedemptionHistoryList, { type PendingRedemption } from "./RedemptionHistoryList";

interface StoreRedeemTabProps {
  store: {
    id: string;
    [key: string]: unknown;
  };
}

const PAGE_SIZE = 30;

export default function StoreRedeemTab({ store }: StoreRedeemTabProps) {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [allItems, setAllItems] = useState<PendingRedemption[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (pageNum: number) => {
    const { data: offers } = await supabase
      .from("offers")
      .select("id")
      .eq("store_id", store.id);
    const offerIds = (offers || []).map((o: { id: string }) => o.id);
    if (!offerIds.length) return [];

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("redemptions")
      .select("*, offers!inner(title, value_rescue, min_purchase, store_id, coupon_type, end_at), customers(name, phone), branches(name)")
      .in("offer_id", offerIds)
      .in("status", ["PENDING", "USED"])
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return (data || []).map((r: Record<string, unknown>) => {
      const offersData = r.offers as { title?: string; value_rescue?: number; min_purchase?: number; coupon_type?: string; end_at?: string | null } | null;
      const customersData = r.customers as { name?: string; phone?: string | null } | null;
      const branchesData = r.branches as { name?: string } | null;
      return {
        id: r.id as string,
        token: r.token as string,
        status: r.status as string,
        created_at: r.created_at as string,
        used_at: (r.used_at as string) || null,
        expires_at: (r.expires_at as string) || null,
        customer_cpf: (r.customer_cpf as string) || "",
        offer_title: offersData?.title || "",
        customer_name: customersData?.name || "—",
        customer_phone: customersData?.phone || "",
        branch_name: branchesData?.name || "",
        value_rescue: Number(offersData?.value_rescue || 0),
        min_purchase: Number(offersData?.min_purchase || 0),
        coupon_type: offersData?.coupon_type || "STORE",
        offer_end_at: offersData?.end_at || null,
        purchase_value: (r.purchase_value as number) || null,
        credit_value_applied: (r.credit_value_applied as number) || null,
      } satisfies PendingRedemption;
    });
  }, [store.id]);

  // Initial load
  const { isLoading } = useQuery({
    queryKey: ["store-pending-redemptions", store.id],
    queryFn: async () => {
      const items = await fetchPage(0);
      setAllItems(items);
      setHasMore(items.length >= PAGE_SIZE);
      setPage(0);
      return items;
    },
    refetchInterval: 15000,
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("store-redemptions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "redemptions" }, () => {
        qc.invalidateQueries({ queryKey: ["store-pending-redemptions", store.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [store.id, qc]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const items = await fetchPage(nextPage);
    setAllItems(prev => [...prev, ...items]);
    setHasMore(items.length >= PAGE_SIZE);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ["store-pending-redemptions", store.id] });
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Resgates</h1>
        <p className="text-sm text-muted-foreground">Veja resgates dos clientes e dê baixa</p>
      </div>

      <RedemptionHistoryList
        redemptions={allItems}
        loading={isLoading}
        storeId={store.id}
        onRefresh={handleRefresh}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        loadingMore={loadingMore}
      />

      <RedeemPinInput storeId={store.id} onConfirmed={handleRefresh} />
    </div>
  );
}
