import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomer } from "@/contexts/CustomerContext";

export function useCustomerFavoriteStores() {
  const { customer } = useCustomer();
  const [favoriteStoreIds, setFavoriteStoreIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customer) { setFavoriteStoreIds(new Set()); return; }

    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("customer_favorite_stores")
        .select("store_id")
        .eq("customer_id", customer.id);
      setFavoriteStoreIds(new Set((data || []).map((d: any) => d.store_id)));
      setLoading(false);
    };
    fetch();
  }, [customer]);

  const toggleFavoriteStore = useCallback(async (storeId: string) => {
    if (!customer) return;

    const isFav = favoriteStoreIds.has(storeId);

    // Optimistic update
    setFavoriteStoreIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(storeId); else next.add(storeId);
      return next;
    });

    if (isFav) {
      await supabase
        .from("customer_favorite_stores")
        .delete()
        .eq("customer_id", customer.id)
        .eq("store_id", storeId);
    } else {
      await supabase
        .from("customer_favorite_stores")
        .insert({ customer_id: customer.id, store_id: storeId });
    }
  }, [customer, favoriteStoreIds]);

  const isFavoriteStore = useCallback((storeId: string) => favoriteStoreIds.has(storeId), [favoriteStoreIds]);

  return { isFavoriteStore, toggleFavoriteStore, loading };
}
