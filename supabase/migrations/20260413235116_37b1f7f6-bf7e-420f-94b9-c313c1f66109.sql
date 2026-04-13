CREATE POLICY "Public can view active driver deals"
ON public.affiliate_deals
FOR SELECT
TO public
USING (is_active = true AND visible_driver = true);