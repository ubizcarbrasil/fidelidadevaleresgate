
-- 1. Insert module_definition for ganha_ganha
INSERT INTO public.module_definitions (key, name, description, category, is_core, is_active)
VALUES ('ganha_ganha', 'Ganha-Ganha', 'Modelo de negócio onde todos os parceiros são emissores e receptores de pontos simultaneamente. Faturamento por ponto gerado/resgatado.', 'fidelidade', false, true);

-- 2. Create ganha_ganha_config table
CREATE TABLE public.ganha_ganha_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT false,
  fee_per_point_earned numeric NOT NULL DEFAULT 0.01,
  fee_per_point_redeemed numeric NOT NULL DEFAULT 0.01,
  fee_mode text NOT NULL DEFAULT 'UNIFORM',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id)
);

ALTER TABLE public.ganha_ganha_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages ganha_ganha_config" ON public.ganha_ganha_config
  FOR ALL USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Brand admins manage own ganha_ganha_config" ON public.ganha_ganha_config
  FOR ALL USING (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  );

CREATE TRIGGER update_ganha_ganha_config_updated_at
  BEFORE UPDATE ON public.ganha_ganha_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Create ganha_ganha_store_fees table
CREATE TABLE public.ganha_ganha_store_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  fee_per_point_earned numeric NOT NULL DEFAULT 0.01,
  fee_per_point_redeemed numeric NOT NULL DEFAULT 0.01,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id, store_id)
);

ALTER TABLE public.ganha_ganha_store_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages ganha_ganha_store_fees" ON public.ganha_ganha_store_fees
  FOR ALL USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Brand admins manage own ganha_ganha_store_fees" ON public.ganha_ganha_store_fees
  FOR ALL USING (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  );

CREATE TRIGGER update_ganha_ganha_store_fees_updated_at
  BEFORE UPDATE ON public.ganha_ganha_store_fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Create ganha_ganha_billing_events table
CREATE TABLE public.ganha_ganha_billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  points_amount integer NOT NULL DEFAULT 0,
  fee_per_point numeric NOT NULL DEFAULT 0,
  fee_total numeric NOT NULL DEFAULT 0,
  reference_id uuid,
  reference_type text,
  period_month text NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ganha_ganha_billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages ganha_ganha_billing_events" ON public.ganha_ganha_billing_events
  FOR ALL USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Brand admins read own billing events" ON public.ganha_ganha_billing_events
  FOR SELECT USING (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  );

CREATE POLICY "Brand admins insert billing events" ON public.ganha_ganha_billing_events
  FOR INSERT WITH CHECK (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  );

CREATE POLICY "Store owners read own billing events" ON public.ganha_ganha_billing_events
  FOR SELECT USING (
    store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid())
  );

-- Enable realtime for billing events dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.ganha_ganha_billing_events;

-- Index for fast period queries
CREATE INDEX idx_gg_billing_period ON public.ganha_ganha_billing_events (brand_id, period_month);
CREATE INDEX idx_gg_billing_store ON public.ganha_ganha_billing_events (store_id, period_month);
