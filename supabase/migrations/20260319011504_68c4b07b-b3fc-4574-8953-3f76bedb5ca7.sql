-- 1. Store owner can read redemptions linked to their own store's offers
CREATE POLICY "Store owner can read own store redemptions"
ON public.redemptions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM offers o
    JOIN stores s ON s.id = o.store_id
    WHERE o.id = redemptions.offer_id
      AND s.owner_user_id = auth.uid()
  )
);

-- 2. Store owner can read customers who redeemed their store's offers
CREATE POLICY "Store owner can read customers of own redemptions"
ON public.customers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM redemptions r
    JOIN offers o ON o.id = r.offer_id
    JOIN stores s ON s.id = o.store_id
    WHERE r.customer_id = customers.id
      AND s.owner_user_id = auth.uid()
  )
);