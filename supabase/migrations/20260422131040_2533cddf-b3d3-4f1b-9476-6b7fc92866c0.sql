-- 1) Coluna nova com default cobrindo todos os 3 formatos
ALTER TABLE public.brand_business_models
ADD COLUMN IF NOT EXISTS allowed_engagement_formats text[]
  NOT NULL DEFAULT ARRAY['duelo','mass_duel','campeonato']::text[];

-- 2) Backfill explícito (defensivo — cobre linhas que possam ter NULL por algum motivo)
UPDATE public.brand_business_models
   SET allowed_engagement_formats = ARRAY['duelo','mass_duel','campeonato']::text[]
 WHERE allowed_engagement_formats IS NULL
    OR array_length(allowed_engagement_formats, 1) IS NULL;

-- 3) Trigger de validação: garante que o array só contém formatos válidos,
--    tem ao menos 1 item, e o engagement_format ativo está dentro dele.
CREATE OR REPLACE FUNCTION public.validate_brand_business_model_formats()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_invalid text;
BEGIN
  -- Deve ter pelo menos 1 formato liberado
  IF NEW.allowed_engagement_formats IS NULL
     OR array_length(NEW.allowed_engagement_formats, 1) IS NULL
     OR array_length(NEW.allowed_engagement_formats, 1) < 1 THEN
    RAISE EXCEPTION 'Pelo menos 1 formato de engajamento deve estar liberado.';
  END IF;

  -- Só aceita os 3 formatos conhecidos
  SELECT f INTO v_invalid
    FROM unnest(NEW.allowed_engagement_formats) AS f
   WHERE f NOT IN ('duelo','mass_duel','campeonato')
   LIMIT 1;

  IF v_invalid IS NOT NULL THEN
    RAISE EXCEPTION 'Formato inválido na lista de liberados: %', v_invalid;
  END IF;

  -- O formato ativo deve estar entre os liberados
  IF NEW.engagement_format IS NOT NULL
     AND NEW.engagement_format <> ALL (NEW.allowed_engagement_formats) THEN
    RAISE EXCEPTION 'Formato ativo (%) não está na lista de formatos liberados desta marca.',
      NEW.engagement_format;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_brand_business_model_formats
  ON public.brand_business_models;

CREATE TRIGGER trg_validate_brand_business_model_formats
BEFORE INSERT OR UPDATE OF allowed_engagement_formats, engagement_format
ON public.brand_business_models
FOR EACH ROW
EXECUTE FUNCTION public.validate_brand_business_model_formats();

-- 4) Atualiza RPC duelo_change_engagement_format para validar contra a lista permitida
CREATE OR REPLACE FUNCTION public.duelo_change_engagement_format(
  p_brand_id uuid,
  p_new_format text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous text;
  v_count int;
  v_allowed text[];
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

  SELECT COUNT(*)
    INTO v_count
  FROM public.duelo_seasons
  WHERE brand_id = p_brand_id
    AND phase <> 'finished';

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Não é possível trocar formato com temporada ativa. Aguarde finalização ou cancele a temporada.';
  END IF;

  SELECT bbm.engagement_format, bbm.allowed_engagement_formats
    INTO v_previous, v_allowed
  FROM public.brand_business_models bbm
  JOIN public.business_models bm ON bm.id = bbm.business_model_id
  WHERE bbm.brand_id = p_brand_id
    AND bm.key = 'duelo_motorista'
  LIMIT 1;

  IF v_allowed IS NOT NULL AND p_new_format <> ALL (v_allowed) THEN
    RAISE EXCEPTION 'Formato % não está liberado para esta marca. Fale com o suporte.', p_new_format;
  END IF;

  UPDATE public.brand_business_models bbm
     SET engagement_format = p_new_format,
         updated_at = now()
    FROM public.business_models bm
   WHERE bbm.business_model_id = bm.id
     AND bm.key = 'duelo_motorista'
     AND bbm.brand_id = p_brand_id;

  INSERT INTO public.duelo_attempts_log (
    code,
    brand_id,
    details_json
  ) VALUES (
    'format_changed',
    p_brand_id,
    jsonb_build_object(
      'brand_id', p_brand_id,
      'previous_format', v_previous,
      'new_format', p_new_format,
      'changed_by', auth.uid()
    )
  );

  RETURN jsonb_build_object(
    'previous_format', v_previous,
    'new_format', p_new_format,
    'changed_at', now()
  );
END;
$$;

-- 5) RPC para Root atualizar a lista de formatos permitidos de uma marca
CREATE OR REPLACE FUNCTION public.duelo_set_allowed_formats(
  p_brand_id uuid,
  p_formats text[]
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_format text;
  v_fallback text;
BEGIN
  -- Apenas Root pode mudar
  IF NOT public.has_role(auth.uid(), 'root_admin') THEN
    RAISE EXCEPTION 'Apenas administradores root podem alterar formatos liberados.';
  END IF;

  IF p_formats IS NULL OR array_length(p_formats, 1) IS NULL OR array_length(p_formats, 1) < 1 THEN
    RAISE EXCEPTION 'Pelo menos 1 formato deve estar liberado.';
  END IF;

  -- Pega o formato ativo atual da marca
  SELECT bbm.engagement_format
    INTO v_current_format
  FROM public.brand_business_models bbm
  JOIN public.business_models bm ON bm.id = bbm.business_model_id
  WHERE bbm.brand_id = p_brand_id
    AND bm.key = 'duelo_motorista'
  LIMIT 1;

  -- Se o formato ativo não estiver na nova lista, troca para o primeiro disponível
  IF v_current_format IS NOT NULL AND v_current_format <> ALL (p_formats) THEN
    v_fallback := p_formats[1];
    UPDATE public.brand_business_models bbm
       SET engagement_format = v_fallback,
           allowed_engagement_formats = p_formats,
           updated_at = now()
      FROM public.business_models bm
     WHERE bbm.business_model_id = bm.id
       AND bm.key = 'duelo_motorista'
       AND bbm.brand_id = p_brand_id;
  ELSE
    UPDATE public.brand_business_models bbm
       SET allowed_engagement_formats = p_formats,
           updated_at = now()
      FROM public.business_models bm
     WHERE bbm.business_model_id = bm.id
       AND bm.key = 'duelo_motorista'
       AND bbm.brand_id = p_brand_id;
  END IF;

  RETURN jsonb_build_object(
    'brand_id', p_brand_id,
    'allowed_formats', p_formats,
    'previous_active', v_current_format,
    'new_active', COALESCE(v_fallback, v_current_format),
    'fallback_applied', v_fallback IS NOT NULL
  );
END;
$$;

-- 6) RPC para qualquer usuário autenticado da marca ler os formatos permitidos
CREATE OR REPLACE FUNCTION public.duelo_get_allowed_formats(
  p_brand_id uuid
) RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(bbm.allowed_engagement_formats, ARRAY['duelo','mass_duel','campeonato']::text[])
  FROM public.brand_business_models bbm
  JOIN public.business_models bm ON bm.id = bbm.business_model_id
  WHERE bbm.brand_id = p_brand_id
    AND bm.key = 'duelo_motorista'
  LIMIT 1;
$$;