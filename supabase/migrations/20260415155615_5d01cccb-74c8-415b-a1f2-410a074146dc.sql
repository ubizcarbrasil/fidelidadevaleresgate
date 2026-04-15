-- Fix: redeemable deals policy was restricted to 'authenticated' role only,
-- but the driver app uses anonymous (anon) access.
-- Drop the old policy and recreate it for the public role (covers both anon and authenticated).

DROP POLICY IF EXISTS "Customers can view redeemable deals" ON public.affiliate_deals;

CREATE POLICY "Public can view redeemable deals"
  ON public.affiliate_deals
  FOR SELECT
  TO public
  USING (is_active = true AND is_redeemable = true);