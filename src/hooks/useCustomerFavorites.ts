import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomer } from "@/contexts/CustomerContext";

export function useCustomerFavorites() {
  const { customer } = useCustomer();
  const [favoriteOfferIds, setFavoriteOfferIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customer) { setFavoriteOfferIds(new Set()); return; }

    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("customer_favorites")
        .select("offer_id")
        .eq("customer_id", customer.id);
      setFavoriteOfferIds(new Set((data || []).map((d: any) => d.offer_id)));
      setLoading(false);
    };
    fetch();
  }, [customer]);

  const toggleFavorite = useCallback(async (offerId: string) => {
    if (!customer) return;

    const isFav = favoriteOfferIds.has(offerId);

    // Optimistic update
    setFavoriteOfferIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(offerId); else next.add(offerId);
      return next;
    });

    if (isFav) {
      await supabase
        .from("customer_favorites")
        .delete()
        .eq("customer_id", customer.id)
        .eq("offer_id", offerId);
    } else {
      await supabase
        .from("customer_favorites")
        .insert({ customer_id: customer.id, offer_id: offerId });
    }
  }, [customer, favoriteOfferIds]);

  const isFavorite = useCallback((offerId: string) => favoriteOfferIds.has(offerId), [favoriteOfferIds]);

  return { isFavorite, toggleFavorite, loading };
}
