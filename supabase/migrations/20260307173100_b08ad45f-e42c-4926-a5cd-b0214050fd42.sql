
-- ============================================
-- CRM CONTACTS: Base unificada de contatos
-- ============================================
CREATE TABLE public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id),
  customer_id uuid REFERENCES public.customers(id),
  external_id text,
  name text,
  phone text,
  email text,
  cpf text,
  gender text,
  os_platform text,
  source text NOT NULL DEFAULT 'MANUAL',
  latitude numeric,
  longitude numeric,
  tags_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id, external_id),
  UNIQUE(brand_id, cpf)
);

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages crm_contacts" ON public.crm_contacts FOR ALL
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Brand admins manage crm_contacts" ON public.crm_contacts FOR ALL
  USING (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  );

CREATE POLICY "Store owners read crm_contacts" ON public.crm_contacts FOR SELECT
  USING (
    brand_id IN (
      SELECT s.brand_id FROM stores s WHERE s.owner_user_id = auth.uid()
    )
  );

CREATE INDEX idx_crm_contacts_brand ON public.crm_contacts(brand_id);
CREATE INDEX idx_crm_contacts_external ON public.crm_contacts(brand_id, external_id);
CREATE INDEX idx_crm_contacts_source ON public.crm_contacts(brand_id, source);

-- ============================================
-- CRM EVENTS: Eventos de mobilidade + fidelidade
-- ============================================
CREATE TABLE public.crm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_subtype text,
  latitude numeric,
  longitude numeric,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages crm_events" ON public.crm_events FOR ALL
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Brand admins read crm_events" ON public.crm_events FOR SELECT
  USING (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  );

CREATE INDEX idx_crm_events_brand ON public.crm_events(brand_id);
CREATE INDEX idx_crm_events_contact ON public.crm_events(contact_id);
CREATE INDEX idx_crm_events_type ON public.crm_events(brand_id, event_type);
CREATE INDEX idx_crm_events_created ON public.crm_events(brand_id, created_at DESC);

-- ============================================
-- CRM TIERS: Configuração de tiers por brand
-- ============================================
CREATE TABLE public.crm_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  min_events int NOT NULL DEFAULT 0,
  max_events int,
  color text NOT NULL DEFAULT '#6366f1',
  icon text DEFAULT 'Star',
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages crm_tiers" ON public.crm_tiers FOR ALL
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Brand admins manage crm_tiers" ON public.crm_tiers FOR ALL
  USING (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  );

CREATE POLICY "Anyone read crm_tiers" ON public.crm_tiers FOR SELECT
  USING (true);

-- ============================================
-- CRM AUDIENCES: Públicos segmentados
-- ============================================
CREATE TABLE public.crm_audiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  filters_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_count int NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages crm_audiences" ON public.crm_audiences FOR ALL
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Brand admins manage crm_audiences" ON public.crm_audiences FOR ALL
  USING (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  );

CREATE POLICY "Store owners read crm_audiences" ON public.crm_audiences FOR SELECT
  USING (
    brand_id IN (SELECT s.brand_id FROM stores s WHERE s.owner_user_id = auth.uid())
  );

-- ============================================
-- CRM CAMPAIGNS: Campanhas de disparo em massa
-- ============================================
CREATE TABLE public.crm_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  audience_id uuid REFERENCES public.crm_audiences(id),
  store_id uuid REFERENCES public.stores(id),
  title text NOT NULL,
  message_template text,
  image_url text,
  channel text NOT NULL DEFAULT 'PUSH',
  cost_per_send numeric NOT NULL DEFAULT 0.03,
  total_cost numeric NOT NULL DEFAULT 0,
  total_recipients int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'DRAFT',
  scheduled_at timestamptz,
  sent_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  offer_config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages crm_campaigns" ON public.crm_campaigns FOR ALL
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Brand admins manage crm_campaigns" ON public.crm_campaigns FOR ALL
  USING (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  );

CREATE POLICY "Store owners manage own campaigns" ON public.crm_campaigns FOR ALL
  USING (
    store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid())
  );

CREATE INDEX idx_crm_campaigns_brand ON public.crm_campaigns(brand_id);
CREATE INDEX idx_crm_campaigns_status ON public.crm_campaigns(brand_id, status);

-- ============================================
-- CRM CAMPAIGN LOGS: Log de envios individuais
-- ============================================
CREATE TABLE public.crm_campaign_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.crm_campaigns(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_campaign_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages crm_campaign_logs" ON public.crm_campaign_logs FOR ALL
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Brand admins read crm_campaign_logs" ON public.crm_campaign_logs FOR SELECT
  USING (
    campaign_id IN (
      SELECT c.id FROM crm_campaigns c
      WHERE c.brand_id IN (SELECT get_user_brand_ids(auth.uid()))
        OR c.brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
    )
  );

CREATE INDEX idx_crm_campaign_logs_campaign ON public.crm_campaign_logs(campaign_id);

-- ============================================
-- Trigger to update updated_at on crm tables
-- ============================================
CREATE TRIGGER set_crm_contacts_updated_at
  BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_crm_audiences_updated_at
  BEFORE UPDATE ON public.crm_audiences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_crm_campaigns_updated_at
  BEFORE UPDATE ON public.crm_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
