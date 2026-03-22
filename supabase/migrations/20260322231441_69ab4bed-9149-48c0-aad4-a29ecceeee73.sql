
-- Add authenticated SELECT policy for brand admins/root on affiliate_deal_categories
-- This allows admins to see ALL categories (including inactive ones)
CREATE POLICY "Brand admins can select all own categories"
ON public.affiliate_deal_categories
FOR SELECT
TO authenticated
USING (
  brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
  OR public.has_role(auth.uid(), 'root_admin')
);
