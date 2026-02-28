
-- 1. Add store custom rule columns to points_rules
ALTER TABLE public.points_rules
  ADD COLUMN allow_store_custom_rule boolean NOT NULL DEFAULT false,
  ADD COLUMN store_points_per_real_min numeric NOT NULL DEFAULT 1.0,
  ADD COLUMN store_points_per_real_max numeric NOT NULL DEFAULT 3.0,
  ADD COLUMN store_rule_requires_approval boolean NOT NULL DEFAULT true;

-- 2. Create enum for store rule status
CREATE TYPE public.store_rule_status AS ENUM ('ACTIVE', 'PENDING_APPROVAL', 'REJECTED');

-- 3. Create store_points_rules table
CREATE TABLE public.store_points_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.brands(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  store_id uuid NOT NULL REFERENCES public.stores(id),
  points_per_real numeric NOT NULL DEFAULT 1.0,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  status store_rule_status NOT NULL DEFAULT 'PENDING_APPROVAL',
  created_by_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  approved_by_user_id uuid,
  approved_at timestamp with time zone
);

-- 4. Enable RLS
ALTER TABLE public.store_points_rules ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies

-- Root manages all
CREATE POLICY "Root manages store_points_rules"
ON public.store_points_rules FOR ALL
USING (has_role(auth.uid(), 'root_admin'::app_role));

-- Brand/Branch admins can SELECT all for their scope
CREATE POLICY "Select store_points_rules (admin)"
ON public.store_points_rules FOR SELECT
USING (
  user_has_permission(auth.uid(), 'earn_points'::text)
  AND (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
    OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
  )
);

-- Brand/Branch admins can UPDATE (approve/reject)
CREATE POLICY "Update store_points_rules (admin)"
ON public.store_points_rules FOR UPDATE
USING (
  user_has_permission(auth.uid(), 'earn_points'::text)
  AND (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
    OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
  )
);

-- Store admins can SELECT own rules
CREATE POLICY "Select own store_points_rules"
ON public.store_points_rules FOR SELECT
USING (created_by_user_id = auth.uid());

-- Store admins can INSERT their own rules
CREATE POLICY "Insert store_points_rules"
ON public.store_points_rules FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by_user_id = auth.uid()
);

-- Index for common queries
CREATE INDEX idx_store_points_rules_store ON public.store_points_rules(store_id, status, is_active);
CREATE INDEX idx_store_points_rules_branch ON public.store_points_rules(branch_id, status);
