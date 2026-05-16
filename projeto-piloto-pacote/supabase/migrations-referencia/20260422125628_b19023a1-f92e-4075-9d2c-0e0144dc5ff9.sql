-- Corrige o erro "op ANY/ALL (array) requires array on right side" ao trocar formato de engajamento.
-- Causa: get_user_brand_ids retorna SETOF uuid, não uuid[]. Trocar ANY(...) por IN (SELECT ...).

CREATE OR REPLACE FUNCTION public.duelo_change_engagement_format(
  p_brand_id uuid, p_new_format text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_previous text; v_count int;
BEGIN
  IF p_new_format NOT IN ('duelo','mass_duel','campeonato') THEN
    RAISE EXCEPTION 'Formato inválido: %', p_new_format;
  END IF;
  IF NOT (has_role(auth.uid(),'root_admin')
       OR (p_brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
           AND has_role(auth.uid(),'brand_admin'))) THEN
    RAISE EXCEPTION 'Sem autorização para alterar formato';
  END IF;
  SELECT COUNT(*) INTO v_count FROM public.duelo_seasons
   WHERE brand_id = p_brand_id AND phase <> 'finished';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Não é possível trocar formato com temporada ativa. Aguarde finalização ou cancele a temporada.';
  END IF;
  SELECT bbm.engagement_format INTO v_previous
    FROM public.brand_business_models bbm
    JOIN public.business_models bm ON bm.id = bbm.business_model_id
   WHERE bbm.brand_id = p_brand_id AND bm.key = 'duelo_motorista' LIMIT 1;
  UPDATE public.brand_business_models bbm
     SET engagement_format = p_new_format, updated_at = now()
    FROM public.business_models bm
   WHERE bbm.business_model_id = bm.id
     AND bm.key = 'duelo_motorista'
     AND bbm.brand_id = p_brand_id;
  INSERT INTO public.duelo_attempts_log(code, payload)
    VALUES ('format_changed', jsonb_build_object(
      'brand_id', p_brand_id, 'previous_format', v_previous,
      'new_format', p_new_format, 'changed_by', auth.uid()));
  RETURN jsonb_build_object('previous_format', v_previous,
    'new_format', p_new_format, 'changed_at', now());
END; $$;