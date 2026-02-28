
-- 1) Home Template Library (platform-level)
CREATE TABLE public.home_template_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  preview_image_url text,
  template_payload_json jsonb NOT NULL DEFAULT '{"sections":[]}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_template_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read templates"
  ON public.home_template_library FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Root manages home templates"
  ON public.home_template_library FOR ALL
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE TRIGGER update_home_template_library_updated_at
  BEFORE UPDATE ON public.home_template_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Home Template Apply Jobs
CREATE TABLE public.home_template_apply_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  template_id uuid NOT NULL REFERENCES public.home_template_library(id) ON DELETE CASCADE,
  scope_type text NOT NULL DEFAULT 'BRAND',
  scope_id uuid,
  overwrite boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  logs_json jsonb NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public.home_template_apply_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages apply jobs"
  ON public.home_template_apply_jobs FOR ALL
  USING (has_role(auth.uid(), 'root_admin'::app_role));

-- 3) Seed 4 initial templates
INSERT INTO public.home_template_library (key, name, description, is_default, template_payload_json) VALUES
(
  'ofertas-classico',
  'Ofertas Clássico',
  'Layout clássico de app de ofertas: banner hero, carrossel de ofertas, grade de lojas e lista de vouchers.',
  true,
  '{
    "sections": [
      {"title": "Destaques", "subtitle": "As melhores ofertas para você", "cta_text": "Ver todas", "template_type": "BANNER_CAROUSEL", "order_index": 0, "visual_json": {"aspect_ratio": "16:9"}, "sources": [{"source_type": "OFFERS", "filters_json": {"status": "ACTIVE"}, "limit": 5}]},
      {"title": "Ofertas do Dia", "subtitle": "Aproveite antes que acabe", "cta_text": "Ver mais", "template_type": "OFFERS_CAROUSEL", "order_index": 1, "visual_json": {}, "sources": [{"source_type": "OFFERS", "filters_json": {"status": "ACTIVE"}, "limit": 10}]},
      {"title": "Lojas Parceiras", "subtitle": "Conheça nossos parceiros", "cta_text": null, "template_type": "STORES_GRID", "order_index": 2, "visual_json": {"columns": 3}, "sources": [{"source_type": "STORES", "filters_json": {}, "limit": 12}]},
      {"title": "Vouchers Disponíveis", "subtitle": "Resgate agora", "cta_text": "Ver vouchers", "template_type": "VOUCHERS_CARDS", "order_index": 3, "visual_json": {}, "sources": [{"source_type": "MANUAL", "filters_json": {}, "limit": 6}]}
    ]
  }'::jsonb
),
(
  'catalogo-categorias',
  'Catálogo por Categoria',
  'Foco em categorias e listas organizadas. Ideal para plataformas com muitas lojas e variedade de ofertas.',
  false,
  '{
    "sections": [
      {"title": "Categorias", "subtitle": "Explore por tipo", "cta_text": null, "template_type": "STORES_GRID", "order_index": 0, "visual_json": {"columns": 4, "show_category_badge": true}, "sources": [{"source_type": "CATEGORIES", "filters_json": {}, "limit": 8}]},
      {"title": "Ofertas em Destaque", "subtitle": null, "cta_text": "Ver todas", "template_type": "OFFERS_GRID", "order_index": 1, "visual_json": {"columns": 2}, "sources": [{"source_type": "OFFERS", "filters_json": {"status": "ACTIVE"}, "limit": 8}]},
      {"title": "Todas as Lojas", "subtitle": "Lista completa", "cta_text": null, "template_type": "STORES_LIST", "order_index": 2, "visual_json": {}, "sources": [{"source_type": "STORES", "filters_json": {}, "limit": 20}]}
    ]
  }'::jsonb
),
(
  'perto-de-voce',
  'Perto de Você',
  'Layout orientado por localização: destaca a filial/cidade do usuário com ofertas e lojas próximas.',
  false,
  '{
    "sections": [
      {"title": "Perto de Você", "subtitle": "Ofertas na sua região", "cta_text": "Ver mapa", "template_type": "BANNER_CAROUSEL", "order_index": 0, "visual_json": {"aspect_ratio": "21:9"}, "sources": [{"source_type": "OFFERS", "filters_json": {"status": "ACTIVE", "nearby": true}, "limit": 4}]},
      {"title": "Lojas Próximas", "subtitle": null, "cta_text": null, "template_type": "STORES_LIST", "order_index": 1, "visual_json": {"show_distance": true}, "sources": [{"source_type": "STORES", "filters_json": {"nearby": true}, "limit": 10}]},
      {"title": "Ofertas da Cidade", "subtitle": null, "cta_text": "Explorar", "template_type": "OFFERS_CAROUSEL", "order_index": 2, "visual_json": {}, "sources": [{"source_type": "OFFERS", "filters_json": {"status": "ACTIVE"}, "limit": 8}]}
    ]
  }'::jsonb
),
(
  'minimalista-premium',
  'Minimalista Premium',
  'Design clean e sofisticado com poucas seções. Ideal para marcas premium com curadoria de ofertas.',
  false,
  '{
    "sections": [
      {"title": "Exclusivo para Você", "subtitle": "Ofertas selecionadas", "cta_text": null, "template_type": "OFFERS_CAROUSEL", "order_index": 0, "visual_json": {"card_style": "premium"}, "sources": [{"source_type": "OFFERS", "filters_json": {"status": "ACTIVE"}, "limit": 6}]},
      {"title": "Parceiros", "subtitle": null, "cta_text": null, "template_type": "STORES_GRID", "order_index": 1, "visual_json": {"columns": 2, "card_style": "minimal"}, "sources": [{"source_type": "STORES", "filters_json": {}, "limit": 4}]}
    ]
  }'::jsonb
);
