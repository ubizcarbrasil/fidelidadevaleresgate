
-- Enums
CREATE TYPE public.points_rule_type AS ENUM ('PER_REAL', 'FIXED', 'TIERED');
CREATE TYPE public.earning_source AS ENUM ('STORE', 'PDV', 'ADMIN', 'IMPORT', 'API');
CREATE TYPE public.earning_status AS ENUM ('APPROVED', 'REJECTED');
CREATE TYPE public.ledger_entry_type AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE public.ledger_reference_type AS ENUM ('EARNING_EVENT', 'REDEMPTION', 'MANUAL_ADJUSTMENT');

-- points_rules
CREATE TABLE public.points_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  rule_type public.points_rule_type NOT NULL DEFAULT 'PER_REAL',
  points_per_real numeric NOT NULL DEFAULT 1.0,
  money_per_point numeric NOT NULL DEFAULT 0.01,
  min_purchase_to_earn numeric NOT NULL DEFAULT 10.0,
  max_points_per_purchase integer NOT NULL DEFAULT 500,
  max_points_per_customer_per_day integer NOT NULL DEFAULT 2000,
  max_points_per_store_per_day integer NOT NULL DEFAULT 10000,
  require_receipt_code boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.points_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages points_rules" ON public.points_rules FOR ALL
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Brand/branch admins manage own points_rules" ON public.points_rules FOR ALL
  USING (
    user_has_permission(auth.uid(), 'earn_points'::text)
    AND (
      brand_id IN (SELECT get_user_brand_ids(auth.uid()))
      OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
      OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
    )
  );

CREATE POLICY "Select points_rules for earners" ON public.points_rules FOR SELECT
  USING (
    is_active = true
    AND (
      has_role(auth.uid(), 'root_admin'::app_role)
      OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
      OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
      OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
    )
  );

CREATE TRIGGER update_points_rules_updated_at BEFORE UPDATE ON public.points_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- earning_events
CREATE TABLE public.earning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  purchase_value numeric NOT NULL DEFAULT 0,
  receipt_code text,
  points_earned integer NOT NULL DEFAULT 0,
  money_earned numeric NOT NULL DEFAULT 0,
  source public.earning_source NOT NULL DEFAULT 'STORE',
  created_by_user_id uuid NOT NULL,
  status public.earning_status NOT NULL DEFAULT 'APPROVED',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.earning_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages earning_events" ON public.earning_events FOR ALL
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Insert earning_events" ON public.earning_events FOR INSERT
  WITH CHECK (
    user_has_permission(auth.uid(), 'earn_points'::text)
    AND (
      brand_id IN (SELECT get_user_brand_ids(auth.uid()))
      OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
    )
  );

CREATE POLICY "Select earning_events (admin)" ON public.earning_events FOR SELECT
  USING (
    user_has_permission(auth.uid(), 'earn_points'::text)
    AND (
      brand_id IN (SELECT get_user_brand_ids(auth.uid()))
      OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
      OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
    )
  );

CREATE POLICY "Select own earning_events" ON public.earning_events FOR SELECT
  USING (
    customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid())
  );

-- points_ledger
CREATE TABLE public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  entry_type public.ledger_entry_type NOT NULL,
  points_amount integer NOT NULL DEFAULT 0,
  money_amount numeric NOT NULL DEFAULT 0,
  reason text,
  reference_type public.ledger_reference_type NOT NULL,
  reference_id uuid,
  created_by_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages points_ledger" ON public.points_ledger FOR ALL
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Insert points_ledger" ON public.points_ledger FOR INSERT
  WITH CHECK (
    user_has_permission(auth.uid(), 'earn_points'::text)
    AND (
      brand_id IN (SELECT get_user_brand_ids(auth.uid()))
      OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
    )
  );

CREATE POLICY "Select points_ledger (admin)" ON public.points_ledger FOR SELECT
  USING (
    user_has_permission(auth.uid(), 'earn_points'::text)
    AND (
      brand_id IN (SELECT get_user_brand_ids(auth.uid()))
      OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
      OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
    )
  );

CREATE POLICY "Select own points_ledger" ON public.points_ledger FOR SELECT
  USING (
    customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid())
  );

-- Indexes for anti-fraud queries
CREATE INDEX idx_earning_events_customer_day ON public.earning_events (customer_id, created_at);
CREATE INDEX idx_earning_events_store_day ON public.earning_events (store_id, created_at);
CREATE INDEX idx_earning_events_receipt ON public.earning_events (store_id, receipt_code) WHERE receipt_code IS NOT NULL;
CREATE INDEX idx_points_ledger_customer ON public.points_ledger (customer_id, created_at);
CREATE INDEX idx_points_rules_brand ON public.points_rules (brand_id, is_active);
