
-- 1. Fix rate_limit_entries: add RLS policy allowing service_role only (edge functions use service_role)
-- The table already has RLS enabled but zero policies, which blocks anon access (correct behavior)
-- We just need to ensure service_role can access it
CREATE POLICY "Service role full access on rate_limit_entries"
ON public.rate_limit_entries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Fix affiliate_deal_categories: replace permissive true policies with brand-scoped checks
DROP POLICY IF EXISTS "Authenticated can insert categories" ON public.affiliate_deal_categories;
DROP POLICY IF EXISTS "Authenticated can update categories" ON public.affiliate_deal_categories;
DROP POLICY IF EXISTS "Authenticated can delete categories" ON public.affiliate_deal_categories;

CREATE POLICY "Brand admins can insert categories"
ON public.affiliate_deal_categories
FOR INSERT
TO authenticated
WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())) OR public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "Brand admins can update categories"
ON public.affiliate_deal_categories
FOR UPDATE
TO authenticated
USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())) OR public.has_role(auth.uid(), 'root_admin'))
WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())) OR public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "Brand admins can delete categories"
ON public.affiliate_deal_categories
FOR DELETE
TO authenticated
USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())) OR public.has_role(auth.uid(), 'root_admin'));

-- 3. Fix vouchers anon policy: exclude PII from anonymous access
DROP POLICY IF EXISTS "Anon read active vouchers" ON public.vouchers;

CREATE POLICY "Anon read active public vouchers"
ON public.vouchers
FOR SELECT
TO anon
USING (status = 'active' AND customer_email IS NULL AND customer_phone IS NULL AND customer_name IS NULL);

-- 4. Restrict brands anon read to safe columns via a view approach
-- Since we can't restrict columns in RLS, we'll keep the policy but note this as a tech debt item
-- The immediate fix: ensure brand_settings_json test_accounts are not exposed to anon
-- We'll handle this in the TECH_DEBT doc as it requires a view-based approach
