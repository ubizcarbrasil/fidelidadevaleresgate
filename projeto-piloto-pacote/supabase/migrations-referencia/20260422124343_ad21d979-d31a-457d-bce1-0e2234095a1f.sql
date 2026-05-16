
-- ============================================================================
-- Registrar "Campeonato Motorista" como Modelo de Negócio + Módulo
-- ============================================================================

-- 1) Inserir o módulo no catálogo
INSERT INTO public.module_definitions (key, name, description, category, is_core, is_active, customer_facing)
VALUES (
  'campeonato_motorista',
  'Campeonato Motorista',
  'Temporadas mensais com séries hierárquicas (A, B, C…), mata-mata e premiações para motoristas — o "Brasileirão" da cidade',
  'engajamento',
  false,
  true,
  true
)
ON CONFLICT (key) DO NOTHING;

-- 2) Inserir o modelo de negócio no catálogo
INSERT INTO public.business_models (
  key, name, description, audience, icon, color, sort_order,
  pricing_model, is_sellable_addon, is_active
)
VALUES (
  'campeonato_motorista',
  'Campeonato Motorista',
  'Temporadas mensais com séries hierárquicas (A, B, C…), mata-mata e premiações para motoristas — o "Brasileirão" da cidade',
  'motorista',
  'Trophy',
  '#F59E0B',
  95,
  'included',
  true,
  true
)
ON CONFLICT (key) DO NOTHING;

-- 3) Vincular o modelo aos módulos pré-requisito (mesmo padrão do duelo_motorista)
INSERT INTO public.business_model_modules (business_model_id, module_definition_id, is_required)
SELECT bm.id, md.id, true
FROM public.business_models bm
CROSS JOIN public.module_definitions md
WHERE bm.key = 'campeonato_motorista'
  AND md.key IN (
    'points',
    'notifications',
    'driver_hub',
    'machine_integration',
    'achadinhos_motorista',
    'campeonato_motorista'
  )
ON CONFLICT DO NOTHING;

-- 4) Incluir o modelo nos planos padrão
INSERT INTO public.plan_business_models (plan_key, business_model_id, is_included)
SELECT plan_key, bm.id, true
FROM public.business_models bm
CROSS JOIN (VALUES ('free'), ('starter'), ('profissional'), ('enterprise'), ('vr_motorista_premium')) AS p(plan_key)
WHERE bm.key = 'campeonato_motorista'
ON CONFLICT DO NOTHING;

-- 5) Incluir o módulo nos templates de plano
INSERT INTO public.plan_module_templates (plan_key, module_definition_id, is_enabled)
SELECT plan_key, md.id, true
FROM public.module_definitions md
CROSS JOIN (VALUES ('free'), ('starter'), ('profissional'), ('enterprise'), ('vr_motorista_premium')) AS p(plan_key)
WHERE md.key = 'campeonato_motorista'
ON CONFLICT DO NOTHING;

-- 6) Backfill da flag legada para marcas de planos pagos que ainda não tenham a flag definida
UPDATE public.brands
SET brand_settings_json = COALESCE(brand_settings_json, '{}'::jsonb) || jsonb_build_object('duelo_campeonato_enabled', true)
WHERE subscription_plan IN ('starter', 'profissional', 'enterprise')
  AND NOT (COALESCE(brand_settings_json, '{}'::jsonb) ? 'duelo_campeonato_enabled');

-- 7) Trigger de sincronização bidirecional: brand_modules.is_enabled (campeonato_motorista) <-> brand_settings_json.duelo_campeonato_enabled
CREATE OR REPLACE FUNCTION public.sync_campeonato_motorista_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_module_key text;
BEGIN
  SELECT key INTO v_module_key
  FROM public.module_definitions
  WHERE id = NEW.module_definition_id;

  IF v_module_key = 'campeonato_motorista' THEN
    UPDATE public.brands
    SET brand_settings_json =
      COALESCE(brand_settings_json, '{}'::jsonb)
      || jsonb_build_object('duelo_campeonato_enabled', NEW.is_enabled)
    WHERE id = NEW.brand_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_campeonato_motorista_flag ON public.brand_modules;

CREATE TRIGGER trg_sync_campeonato_motorista_flag
AFTER INSERT OR UPDATE OF is_enabled ON public.brand_modules
FOR EACH ROW
EXECUTE FUNCTION public.sync_campeonato_motorista_flag();
