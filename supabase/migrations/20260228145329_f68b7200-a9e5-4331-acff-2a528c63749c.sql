
-- Module Definitions (platform-level catalog)
CREATE TABLE public.module_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  is_core boolean NOT NULL DEFAULT false,
  schema_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.module_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read module_definitions"
  ON public.module_definitions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Root manages module_definitions"
  ON public.module_definitions FOR ALL
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE TRIGGER update_module_definitions_updated_at
  BEFORE UPDATE ON public.module_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Brand Modules (per-brand module activation)
CREATE TABLE public.brand_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  module_definition_id uuid NOT NULL REFERENCES public.module_definitions(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, module_definition_id)
);

ALTER TABLE public.brand_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select brand_modules"
  ON public.brand_modules FOR SELECT
  USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  );

CREATE POLICY "Manage brand_modules (root)"
  ON public.brand_modules FOR ALL
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Brand admins manage own brand_modules"
  ON public.brand_modules FOR ALL
  USING (
    user_has_permission(auth.uid(), 'settings.update'::text)
    AND (
      brand_id IN (SELECT get_user_brand_ids(auth.uid()))
      OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
    )
  );

CREATE TRIGGER update_brand_modules_updated_at
  BEFORE UPDATE ON public.brand_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed core modules
INSERT INTO public.module_definitions (key, name, description, category, is_core) VALUES
  ('home_sections', 'Home Sections', 'Layout modular da homepage com seções configuráveis', 'core', true),
  ('stores', 'Lojas', 'Cadastro e gestão de estabelecimentos', 'core', true),
  ('offers', 'Ofertas', 'Ofertas de resgate com regras de valor e compra mínima', 'core', true),
  ('redemption_qr', 'Resgate QR', 'Resgate via token/QR Code no PDV', 'core', true),
  ('wallet', 'Carteira', 'Saldo de pontos e créditos do cliente', 'core', true),
  ('categories', 'Categorias', 'Classificação de lojas e ofertas por categorias', 'general', false),
  ('missions', 'Missões', 'Desafios e gamificação para clientes', 'engagement', false),
  ('notifications', 'Notificações', 'Push notifications e alertas in-app', 'communication', false),
  ('approvals', 'Aprovações', 'Fluxo de aprovação de ofertas', 'governance', false),
  ('reports', 'Relatórios', 'Dashboards e relatórios gerenciais', 'analytics', false),
  ('coupons', 'Cupons', 'Cupons de desconto tradicionais', 'promotions', false),
  ('giftcards', 'Gift Cards', 'Cartões presente digitais', 'promotions', false),
  ('vouchers', 'Vouchers', 'Vouchers de desconto personalizados', 'promotions', false);
