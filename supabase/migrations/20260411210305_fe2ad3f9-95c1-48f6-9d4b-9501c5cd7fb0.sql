CREATE POLICY "Customers can view redeemable deals"
ON public.affiliate_deals
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND is_redeemable = true
);