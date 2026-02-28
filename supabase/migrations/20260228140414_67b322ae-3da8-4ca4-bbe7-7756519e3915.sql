
-- 1) Releases table for ROOT publications
CREATE TABLE public.releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  title text NOT NULL,
  description text,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages releases" ON public.releases
  FOR ALL USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Authenticated can read releases" ON public.releases
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 2) Add subdomain and is_active to brand_domains
ALTER TABLE public.brand_domains 
  ADD COLUMN IF NOT EXISTS subdomain text UNIQUE,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 3) Performance indexes
CREATE INDEX IF NOT EXISTS idx_offers_branch_active ON public.offers (brand_id, branch_id, is_active, status);
CREATE INDEX IF NOT EXISTS idx_offers_dates ON public.offers (start_at, end_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stores_branch_active ON public.stores (brand_id, branch_id, is_active);
CREATE INDEX IF NOT EXISTS idx_redemptions_branch_status ON public.redemptions (brand_id, branch_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_offers_title_search ON public.offers USING gin (to_tsvector('portuguese', title));
CREATE INDEX IF NOT EXISTS idx_stores_name_search ON public.stores USING gin (to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_brand_domains_subdomain ON public.brand_domains (subdomain) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);

-- 4) Update audit_logs to include actor_user_id, scope columns, changes_json
ALTER TABLE public.audit_logs 
  RENAME COLUMN user_id TO actor_user_id;
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS scope_type text,
  ADD COLUMN IF NOT EXISTS scope_id uuid,
  ADD COLUMN IF NOT EXISTS changes_json jsonb NOT NULL DEFAULT '{}'::jsonb;
