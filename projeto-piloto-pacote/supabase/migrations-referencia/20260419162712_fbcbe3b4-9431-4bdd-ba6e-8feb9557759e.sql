-- ============================================================================
-- SUB-FASE 5.1: MODELOS DE NEGÓCIO — Schema + Seeds + Matriz N-N
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. business_models (catálogo dos 13 modelos comerciais)
-- ----------------------------------------------------------------------------
CREATE TABLE public.business_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  audience text NOT NULL CHECK (audience IN ('cliente','motorista','b2b')),
  icon text,
  color text,
  sort_order integer NOT NULL DEFAULT 0,
  pricing_model text NOT NULL DEFAULT 'included' 
    CHECK (pricing_model IN ('included','usage_based','fixed_addon')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_business_models_audience ON public.business_models(audience);
CREATE INDEX idx_business_models_sort_order ON public.business_models(sort_order);

ALTER TABLE public.business_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_models_select_authenticated"
  ON public.business_models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "business_models_root_admin_all"
  ON public.business_models FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'root_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));

CREATE TRIGGER trg_business_models_updated_at
  BEFORE UPDATE ON public.business_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 2. business_model_modules (matriz N-N modelo → módulo técnico)
-- ----------------------------------------------------------------------------
CREATE TABLE public.business_model_modules (
  business_model_id uuid NOT NULL REFERENCES public.business_models(id) ON DELETE CASCADE,
  module_definition_id uuid NOT NULL REFERENCES public.module_definitions(id) ON DELETE CASCADE,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_model_id, module_definition_id)
);

CREATE INDEX idx_bmm_module ON public.business_model_modules(module_definition_id);

ALTER TABLE public.business_model_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bmm_select_authenticated"
  ON public.business_model_modules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "bmm_root_admin_all"
  ON public.business_model_modules FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'root_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));

-- ----------------------------------------------------------------------------
-- 3. plan_business_models (modelos incluídos em cada plano)
-- ----------------------------------------------------------------------------
CREATE TABLE public.plan_business_models (
  plan_key text NOT NULL,
  business_model_id uuid NOT NULL REFERENCES public.business_models(id) ON DELETE CASCADE,
  is_included boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_key, business_model_id)
);

CREATE INDEX idx_pbm_business_model ON public.plan_business_models(business_model_id);

ALTER TABLE public.plan_business_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pbm_select_authenticated"
  ON public.plan_business_models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "pbm_root_admin_all"
  ON public.plan_business_models FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'root_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));

-- ----------------------------------------------------------------------------
-- 4. plan_ganha_ganha_pricing (preço por ponto Ganha-Ganha por plano)
-- ----------------------------------------------------------------------------
CREATE TABLE public.plan_ganha_ganha_pricing (
  plan_key text PRIMARY KEY,
  price_per_point_cents integer NOT NULL,
  min_margin_pct numeric NULL,
  max_margin_pct numeric NULL,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_ganha_ganha_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pggp_select_authenticated"
  ON public.plan_ganha_ganha_pricing FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "pggp_root_admin_all"
  ON public.plan_ganha_ganha_pricing FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'root_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));

CREATE TRIGGER trg_pggp_updated_at
  BEFORE UPDATE ON public.plan_ganha_ganha_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5. brand_business_models (ativação por marca)
-- ----------------------------------------------------------------------------
CREATE TABLE public.brand_business_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  business_model_id uuid NOT NULL REFERENCES public.business_models(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  ganha_ganha_margin_pct numeric NULL,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  activated_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, business_model_id)
);

CREATE INDEX idx_bbm_brand ON public.brand_business_models(brand_id);
CREATE INDEX idx_bbm_business_model ON public.brand_business_models(business_model_id);

ALTER TABLE public.brand_business_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bbm_select_scope"
  ON public.brand_business_models FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
  );

CREATE POLICY "bbm_root_admin_all"
  ON public.brand_business_models FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'root_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "bbm_brand_admin_manage"
  ON public.brand_business_models FOR ALL
  TO authenticated
  USING (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    AND has_role(auth.uid(), 'brand_admin'::app_role)
  )
  WITH CHECK (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    AND has_role(auth.uid(), 'brand_admin'::app_role)
  );

CREATE TRIGGER trg_bbm_updated_at
  BEFORE UPDATE ON public.brand_business_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 6. city_business_model_overrides (override por cidade)
-- ----------------------------------------------------------------------------
CREATE TABLE public.city_business_model_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  business_model_id uuid NOT NULL REFERENCES public.business_models(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (branch_id, business_model_id)
);

CREATE INDEX idx_cbmo_brand ON public.city_business_model_overrides(brand_id);
CREATE INDEX idx_cbmo_branch ON public.city_business_model_overrides(branch_id);
CREATE INDEX idx_cbmo_business_model ON public.city_business_model_overrides(business_model_id);

ALTER TABLE public.city_business_model_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cbmo_select_scope"
  ON public.city_business_model_overrides FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
  );

CREATE POLICY "cbmo_root_admin_all"
  ON public.city_business_model_overrides FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'root_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "cbmo_brand_admin_manage"
  ON public.city_business_model_overrides FOR ALL
  TO authenticated
  USING (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    AND has_role(auth.uid(), 'brand_admin'::app_role)
  )
  WITH CHECK (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    AND has_role(auth.uid(), 'brand_admin'::app_role)
  );

CREATE POLICY "cbmo_branch_admin_manage"
  ON public.city_business_model_overrides FOR ALL
  TO authenticated
  USING (
    branch_id IN (SELECT get_user_branch_ids(auth.uid()))
    AND has_role(auth.uid(), 'branch_admin'::app_role)
  )
  WITH CHECK (
    branch_id IN (SELECT get_user_branch_ids(auth.uid()))
    AND has_role(auth.uid(), 'branch_admin'::app_role)
  );

CREATE TRIGGER trg_cbmo_updated_at
  BEFORE UPDATE ON public.city_business_model_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.city_business_model_overrides REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.city_business_model_overrides;

-- ============================================================================
-- SEEDS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SEED 1: 13 modelos de negócio
-- ----------------------------------------------------------------------------
INSERT INTO public.business_models (key, name, description, audience, icon, color, sort_order, pricing_model) VALUES
  ('achadinho_cliente',        'Achadinho para Cliente',     'Ofertas afiliadas para clientes da marca',                    'cliente',   'ShoppingBag', '#3B82F6', 10,  'included'),
  ('pontua_cliente',           'Pontua Cliente',             'Sistema de acúmulo de pontos para clientes',                  'cliente',   'Star',        '#3B82F6', 20,  'included'),
  ('resgate_pontos_cliente',   'Resgate por Pontos Cliente', 'Resgate de produtos com pontos pelo cliente',                 'cliente',   'Gift',        '#3B82F6', 30,  'included'),
  ('resgate_cidade_cliente',   'Resgate na Cidade Cliente',  'Resgate de ofertas locais na cidade pelo cliente',            'cliente',   'MapPin',      '#3B82F6', 40,  'included'),
  ('achadinho_motorista',      'Achadinho para Motorista',   'Ofertas afiliadas exclusivas para motoristas',                'motorista', 'ShoppingBag', '#F59E0B', 50,  'included'),
  ('pontua_motorista',         'Pontua Motorista',           'Sistema de pontuação por corridas para motoristas',           'motorista', 'Star',        '#F59E0B', 60,  'included'),
  ('duelo_motorista',          'Duelo Motorista',            'Competições 1×1 entre motoristas',                            'motorista', 'Swords',      '#F59E0B', 70,  'included'),
  ('aposta_motorista',         'Aposta Motorista',           'Sistema de apostas em metas para motoristas',                 'motorista', 'Dices',       '#F59E0B', 80,  'included'),
  ('cinturao_motorista',       'Cinturão Motorista',         'Disputa de cinturão de campeão na cidade',                    'motorista', 'Crown',       '#F59E0B', 90,  'included'),
  ('resgate_pontos_motorista', 'Resgate por Pontos Motorista','Resgate de produtos com pontos pelo motorista',              'motorista', 'Gift',        '#F59E0B', 100, 'included'),
  ('resgate_cidade_motorista', 'Resgate na Cidade Motorista','Resgate de ofertas locais na cidade pelo motorista',          'motorista', 'MapPin',      '#F59E0B', 110, 'included'),
  ('rank_motorista',           'Rank Motorista',             'Ranking competitivo entre motoristas',                        'motorista', 'Trophy',      '#F59E0B', 120, 'included'),
  ('ganha_ganha',              'Ganha-Ganha',                'Ecossistema compartilhado de fidelidade B2B com cobrança por uso','b2b',   'Handshake',   '#10B981', 130, 'usage_based')
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- SEED 2: pricing Ganha-Ganha (4 planos × R$ 0,10)
-- ----------------------------------------------------------------------------
INSERT INTO public.plan_ganha_ganha_pricing (plan_key, price_per_point_cents) VALUES
  ('free',         10),
  ('starter',      10),
  ('profissional', 10),
  ('enterprise',   10)
ON CONFLICT (plan_key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- SEED 3: plan_business_models (4 planos × 13 modelos = 52 linhas)
-- ----------------------------------------------------------------------------
INSERT INTO public.plan_business_models (plan_key, business_model_id, is_included)
SELECT p.plan_key, bm.id, true
FROM (VALUES ('free'),('starter'),('profissional'),('enterprise')) AS p(plan_key)
CROSS JOIN public.business_models bm
ON CONFLICT (plan_key, business_model_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- SEED 4: business_model_modules (matriz N-N aprovada)
-- ----------------------------------------------------------------------------
WITH matrix(model_key, module_key, is_required) AS (
  VALUES
    -- achadinho_cliente
    ('achadinho_cliente','affiliate_deals',true),
    ('achadinho_cliente','affiliate_categories',true),
    ('achadinho_cliente','affiliate_governance',true),
    ('achadinho_cliente','customers',true),
    ('achadinho_cliente','home_sections',true),
    ('achadinho_cliente','points',true),
    ('achadinho_cliente','affiliate_mirror',false),
    ('achadinho_cliente','sponsored',false),
    ('achadinho_cliente','notifications',false),
    ('achadinho_cliente','categories',false),
    -- pontua_cliente
    ('pontua_cliente','points',true),
    ('pontua_cliente','points_rules',true),
    ('pontua_cliente','customers',true),
    ('pontua_cliente','stores',true),
    ('pontua_cliente','earn_points_store',true),
    ('pontua_cliente','wallet',true),
    ('pontua_cliente','notifications',false),
    ('pontua_cliente','home_sections',false),
    ('pontua_cliente','crm',false),
    -- resgate_pontos_cliente
    ('resgate_pontos_cliente','points',true),
    ('resgate_pontos_cliente','customers',true),
    ('resgate_pontos_cliente','product_redemptions',true),
    ('resgate_pontos_cliente','product_redemption_orders',true),
    ('resgate_pontos_cliente','customer_product_redeem',true),
    ('resgate_pontos_cliente','redemption_qr',true),
    ('resgate_pontos_cliente','redemption_rules',true),
    ('resgate_pontos_cliente','wallet',true),
    ('resgate_pontos_cliente','notifications',false),
    ('resgate_pontos_cliente','home_sections',false),
    -- resgate_cidade_cliente
    ('resgate_cidade_cliente','offers',true),
    ('resgate_cidade_cliente','customers',true),
    ('resgate_cidade_cliente','points',true),
    ('resgate_cidade_cliente','redemption_qr',true),
    ('resgate_cidade_cliente','redemption_rules',true),
    ('resgate_cidade_cliente','branches',true),
    ('resgate_cidade_cliente','wallet',true),
    ('resgate_cidade_cliente','notifications',false),
    -- achadinho_motorista
    ('achadinho_motorista','affiliate_deals',true),
    ('achadinho_motorista','affiliate_categories',true),
    ('achadinho_motorista','achadinhos_motorista',true),
    ('achadinho_motorista','driver_hub',true),
    ('achadinho_motorista','points',true),
    ('achadinho_motorista','driver_panel_view',false),
    ('achadinho_motorista','notifications',false),
    -- pontua_motorista
    ('pontua_motorista','points',true),
    ('pontua_motorista','points_rules',true),
    ('pontua_motorista','achadinhos_motorista',true),
    ('pontua_motorista','machine_integration',true),
    ('pontua_motorista','driver_hub',true),
    ('pontua_motorista','wallet',true),
    ('pontua_motorista','notifications',false),
    -- duelo_motorista
    ('duelo_motorista','achadinhos_motorista',true),
    ('duelo_motorista','points',true),
    ('duelo_motorista','driver_hub',true),
    ('duelo_motorista','machine_integration',true),
    ('duelo_motorista','notifications',false),
    -- aposta_motorista
    ('aposta_motorista','achadinhos_motorista',true),
    ('aposta_motorista','points',true),
    ('aposta_motorista','driver_hub',true),
    ('aposta_motorista','machine_integration',true),
    ('aposta_motorista','notifications',false),
    -- cinturao_motorista
    ('cinturao_motorista','achadinhos_motorista',true),
    ('cinturao_motorista','points',true),
    ('cinturao_motorista','driver_hub',true),
    ('cinturao_motorista','machine_integration',true),
    ('cinturao_motorista','notifications',false),
    -- resgate_pontos_motorista
    ('resgate_pontos_motorista','points',true),
    ('resgate_pontos_motorista','product_redemptions',true),
    ('resgate_pontos_motorista','product_redemption_orders',true),
    ('resgate_pontos_motorista','driver_hub',true),
    ('resgate_pontos_motorista','achadinhos_motorista',true),
    ('resgate_pontos_motorista','redemption_rules',true),
    ('resgate_pontos_motorista','wallet',true),
    ('resgate_pontos_motorista','notifications',false),
    -- resgate_cidade_motorista
    ('resgate_cidade_motorista','offers',true),
    ('resgate_cidade_motorista','points',true),
    ('resgate_cidade_motorista','driver_hub',true),
    ('resgate_cidade_motorista','branches',true),
    ('resgate_cidade_motorista','redemption_qr',true),
    ('resgate_cidade_motorista','achadinhos_motorista',true),
    ('resgate_cidade_motorista','wallet',true),
    ('resgate_cidade_motorista','notifications',false),
    -- rank_motorista
    ('rank_motorista','achadinhos_motorista',true),
    ('rank_motorista','points',true),
    ('rank_motorista','driver_hub',true),
    ('rank_motorista','machine_integration',true),
    ('rank_motorista','notifications',false),
    -- ganha_ganha
    ('ganha_ganha','ganha_ganha',true),
    ('ganha_ganha','points',true),
    ('ganha_ganha','points_rules',true),
    ('ganha_ganha','stores',true),
    ('ganha_ganha','gg_dashboard',true),
    ('ganha_ganha','gg_store_summary',true),
    ('ganha_ganha','multi_emitter',true),
    ('ganha_ganha','store_permissions',true),
    ('ganha_ganha','earn_points_store',true),
    ('ganha_ganha','customers',true),
    ('ganha_ganha','wallet',true),
    ('ganha_ganha','notifications',false)
)
INSERT INTO public.business_model_modules (business_model_id, module_definition_id, is_required)
SELECT bm.id, md.id, m.is_required
FROM matrix m
JOIN public.business_models bm ON bm.key = m.model_key
JOIN public.module_definitions md ON md.key = m.module_key
ON CONFLICT (business_model_id, module_definition_id) DO NOTHING;

-- ============================================================================
-- DOWN MIGRATION (referência apenas — não executar)
-- ============================================================================
-- ALTER PUBLICATION supabase_realtime DROP TABLE public.city_business_model_overrides;
-- DROP TABLE IF EXISTS public.city_business_model_overrides CASCADE;
-- DROP TABLE IF EXISTS public.brand_business_models CASCADE;
-- DROP TABLE IF EXISTS public.plan_ganha_ganha_pricing CASCADE;
-- DROP TABLE IF EXISTS public.plan_business_models CASCADE;
-- DROP TABLE IF EXISTS public.business_model_modules CASCADE;
-- DROP TABLE IF EXISTS public.business_models CASCADE;