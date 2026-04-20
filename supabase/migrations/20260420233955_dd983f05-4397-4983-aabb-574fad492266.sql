-- 1) CLEANUP: remove o domínio app.valeresgate.com.br de brand_domains
DELETE FROM public.brand_domains
WHERE domain = 'app.valeresgate.com.br';

-- 2) DATA FIX: Drive Clientes (id já confirmado: de899cb5-17dc-413f-8ddc-961842b698ae)
DO $$
DECLARE
  v_brand_id uuid;
BEGIN
  SELECT id INTO v_brand_id
  FROM public.brands
  WHERE slug = 'drive-clientes'
  LIMIT 1;

  IF v_brand_id IS NULL THEN
    RAISE NOTICE 'Brand Drive Clientes não encontrada — pulando data fix';
    RETURN;
  END IF;

  -- 2a) Insere brand_modules baseado em plan_module_templates (plan_key='clienteresgata')
  INSERT INTO public.brand_modules (brand_id, module_definition_id, is_enabled, order_index, config_json)
  SELECT
    v_brand_id,
    pmt.module_definition_id,
    COALESCE(pmt.is_enabled, true),
    0,
    '{}'::jsonb
  FROM public.plan_module_templates pmt
  WHERE pmt.plan_key = 'clienteresgata'
  ON CONFLICT (brand_id, module_definition_id) DO NOTHING;

  -- 2b) Insere brand_business_models baseado em plan_business_models (plan_key='clienteresgata')
  INSERT INTO public.brand_business_models (brand_id, business_model_id, is_enabled, activated_at, config_json)
  SELECT
    v_brand_id,
    pbm.business_model_id,
    true,
    now(),
    '{}'::jsonb
  FROM public.plan_business_models pbm
  WHERE pbm.plan_key = 'clienteresgata'
    AND pbm.is_included = true
  ON CONFLICT (brand_id, business_model_id) DO NOTHING;

  -- 2c) PASSENGER_ONLY para todas as branches da Drive Clientes
  UPDATE public.branches
  SET scoring_model = 'PASSENGER_ONLY'
  WHERE brand_id = v_brand_id;

  RAISE NOTICE 'Data fix aplicado para brand_id=%', v_brand_id;
END $$;