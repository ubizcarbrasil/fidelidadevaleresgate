-- 1) Data fix: garantir registro brand_business_models para Meu Mototáxi
--    com Campeonato como único formato liberado.

INSERT INTO public.brand_business_models (
  brand_id,
  business_model_id,
  is_enabled,
  engagement_format,
  allowed_engagement_formats,
  activated_at
)
SELECT
  'f6ca82ea-621c-4e97-8c20-326fc63a8fd0'::uuid,
  bm.id,
  true,
  'campeonato',
  ARRAY['campeonato']::text[],
  now()
FROM public.business_models bm
WHERE bm.key = 'duelo_motorista'
ON CONFLICT (brand_id, business_model_id) DO UPDATE
  SET is_enabled = true,
      engagement_format = 'campeonato',
      allowed_engagement_formats = ARRAY['campeonato']::text[],
      updated_at = now();

-- 2) Garantir flags em brand_settings_json (defensivo / idempotente)
UPDATE public.brands
   SET brand_settings_json = COALESCE(brand_settings_json, '{}'::jsonb)
       || jsonb_build_object(
            'duelo_campeonato_enabled', true,
            'duelo_series_enabled', true
          )
 WHERE id = 'f6ca82ea-621c-4e97-8c20-326fc63a8fd0'::uuid;

-- 3) Hardening: duelo_change_engagement_format vira UPSERT
CREATE OR REPLACE FUNCTION public.duelo_change_engagement_format(
  p_brand_id uuid,
  p_new_format text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_previous text;
  v_allowed text[];
  v_model_id uuid;
  v_rows int;
BEGIN
  IF p_new_format NOT IN ('duelo', 'mass_duel', 'campeonato') THEN
    RAISE EXCEPTION 'Formato inválido: %', p_new_format;
  END IF;

  IF NOT (
    public.has_role(auth.uid(), 'root_admin')
    OR (
      p_brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
      AND public.has_role(auth.uid(), 'brand_admin')
    )
  ) THEN
    RAISE EXCEPTION 'Sem autorização para alterar formato';
  END IF;

  -- Bloqueia troca com temporada ativa
  IF EXISTS (
    SELECT 1 FROM public.duelo_seasons
    WHERE brand_id = p_brand_id AND phase <> 'finished'
  ) THEN
    RAISE EXCEPTION 'Não é possível trocar formato com temporada ativa. Aguarde finalização ou cancele a temporada.';
  END IF;

  SELECT id INTO v_model_id
  FROM public.business_models
  WHERE key = 'duelo_motorista'
  LIMIT 1;

  IF v_model_id IS NULL THEN
    RAISE EXCEPTION 'Modelo de negócio duelo_motorista não cadastrado.';
  END IF;

  SELECT bbm.engagement_format, bbm.allowed_engagement_formats
    INTO v_previous, v_allowed
  FROM public.brand_business_models bbm
  WHERE bbm.brand_id = p_brand_id
    AND bbm.business_model_id = v_model_id
  LIMIT 1;

  IF v_allowed IS NOT NULL AND p_new_format <> ALL (v_allowed) THEN
    RAISE EXCEPTION 'Formato % não está liberado para esta marca. Fale com o suporte.', p_new_format;
  END IF;

  -- UPSERT: cria a linha se não existir
  INSERT INTO public.brand_business_models (
    brand_id, business_model_id, is_enabled, engagement_format, activated_at
  ) VALUES (
    p_brand_id, v_model_id, true, p_new_format, now()
  )
  ON CONFLICT (brand_id, business_model_id) DO UPDATE
    SET engagement_format = EXCLUDED.engagement_format,
        is_enabled = true,
        updated_at = now();

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  INSERT INTO public.duelo_attempts_log (code, brand_id, details_json)
  VALUES (
    'format_changed',
    p_brand_id,
    jsonb_build_object(
      'brand_id', p_brand_id,
      'previous_format', v_previous,
      'new_format', p_new_format,
      'changed_by', auth.uid(),
      'rows_affected', v_rows
    )
  );

  RETURN jsonb_build_object(
    'previous_format', v_previous,
    'new_format', p_new_format,
    'changed_at', now(),
    'rows_affected', v_rows
  );
END;
$function$;