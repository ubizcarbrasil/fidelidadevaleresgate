
-- 1. Add sync columns to affiliate_deals
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'manual';
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS origin_external_id TEXT;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS origin_url TEXT;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS origin_hash TEXT;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS is_flash_promo BOOLEAN DEFAULT false;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS visible_driver BOOLEAN DEFAULT true;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'manual';
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS sync_error TEXT;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS first_imported_at TIMESTAMPTZ;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_deals_origin_hash 
  ON affiliate_deals (brand_id, origin_hash) WHERE origin_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_affiliate_deals_origin 
  ON affiliate_deals (brand_id, origin) WHERE origin IS NOT NULL;

-- 2. Mirror sync logs table
CREATE TABLE IF NOT EXISTS mirror_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  origin TEXT NOT NULL DEFAULT 'divulgador_inteligente',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  total_read INT DEFAULT 0,
  total_new INT DEFAULT 0,
  total_updated INT DEFAULT 0,
  total_skipped INT DEFAULT 0,
  total_errors INT DEFAULT 0,
  status TEXT DEFAULT 'running',
  summary TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mirror_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_admin_read_sync_logs" ON mirror_sync_logs
  FOR SELECT TO authenticated
  USING (
    brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
    OR public.has_role(auth.uid(), 'root_admin')
  );

CREATE POLICY "root_admin_all_sync_logs" ON mirror_sync_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

-- 3. Mirror sync config table
CREATE TABLE IF NOT EXISTS mirror_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE UNIQUE,
  origin_url TEXT NOT NULL DEFAULT 'https://www.divulgadorinteligente.com/ubizresgata',
  extra_pages TEXT[] DEFAULT '{}',
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval_minutes INT DEFAULT 10,
  max_offers_per_read INT DEFAULT 100,
  max_pages INT DEFAULT 5,
  timeout_seconds INT DEFAULT 30,
  debug_mode BOOLEAN DEFAULT false,
  auto_activate BOOLEAN DEFAULT true,
  auto_visible_driver BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mirror_sync_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_admin_manage_sync_config" ON mirror_sync_config
  FOR ALL TO authenticated
  USING (
    brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
    OR public.has_role(auth.uid(), 'root_admin')
  )
  WITH CHECK (
    brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
    OR public.has_role(auth.uid(), 'root_admin')
  );

-- Service role policy for edge functions to insert logs
CREATE POLICY "service_role_sync_logs" ON mirror_sync_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
