/**
 * Store owner redemption tab — uses RPC for reliable data fetching.
 */
import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import RedeemPinInput from "./RedeemPinInput";
import RedemptionHistoryList, { type PendingRedemption } from "./RedemptionHistoryList";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

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
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (pageNum: number) => {
    const { data, error } = await supabase.rpc("rpc_get_store_owner_redemptions", {
      p_store_id: store.id,
      p_page: pageNum,
      p_page_size: PAGE_SIZE,
    });

    if (error) throw error;

    return ((data as any[]) || []).map((r): PendingRedemption => ({
      id: r.id,
      token: r.token,
      status: r.status,
      created_at: r.created_at,
      used_at: r.used_at || null,
      expires_at: r.expires_at || null,
      customer_cpf: r.customer_cpf || "",
      offer_title: r.offer_title || "",
      customer_name: r.customer_name || "—",
      customer_phone: r.customer_phone || "",
      branch_name: r.branch_name || "",
      value_rescue: Number(r.value_rescue || 0),
      min_purchase: Number(r.min_purchase || 0),
      coupon_type: r.coupon_type || "STORE",
      offer_end_at: r.offer_end_at || null,
      purchase_value: r.purchase_value != null ? Number(r.purchase_value) : null,
      credit_value_applied: r.credit_value_applied != null ? Number(r.credit_value_applied) : null,
    }));
  }, [store.id]);

  // Initial load
  const { isLoading, isError, error, refetch } = useQuery({
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
    try {
      const nextPage = page + 1;
      const items = await fetchPage(nextPage);
      setAllItems(prev => [...prev, ...items]);
      setHasMore(items.length >= PAGE_SIZE);
      setPage(nextPage);
    } catch (e) {
      console.error("Error loading more redemptions:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ["store-pending-redemptions", store.id] });
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resgates</h1>
          <p className="text-sm text-muted-foreground">Veja resgates dos clientes e dê baixa</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="rounded-xl gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {isError ? (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-center text-muted-foreground">
              Não foi possível carregar os resgates.
              {error instanceof Error && <><br /><span className="text-xs">{error.message}</span></>}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl gap-2">
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <RedemptionHistoryList
          redemptions={allItems}
          loading={isLoading}
          storeId={store.id}
          onRefresh={handleRefresh}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
        />
      )}

      <RedeemPinInput storeId={store.id} onConfirmed={handleRefresh} />
    </div>
  );
}
