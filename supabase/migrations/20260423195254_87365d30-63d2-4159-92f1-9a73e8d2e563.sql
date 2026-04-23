-- Sprint 1 / Tarefa 3: backfill de config_json.features em brand_business_models do duelo_motorista
-- Espelha is_enabled de cinturao_motorista, aposta_motorista, rank_motorista e campeonato_motorista
-- para dentro de duelo_motorista.config_json.features.{cinturao,aposta,ranking,campeonato}.
-- Idempotente: re-executar produz o mesmo resultado.
-- Rollback (limpa apenas as chaves espelhadas, preservando o resto do config_json):
--   UPDATE public.brand_business_models bbm
--   SET config_json = bbm.config_json #- '{features,cinturao}' #- '{features,aposta}'
--                     #- '{features,ranking}' #- '{features,campeonato}'
--   WHERE bbm.business_model_id = (SELECT id FROM public.business_models WHERE key='duelo_motorista');

DO $$
DECLARE
  v_duelo_id uuid;
  v_brand record;
  v_features jsonb;
  v_cinturao boolean;
  v_aposta   boolean;
  v_ranking  boolean;
  v_campeonato boolean;
  v_updated int := 0;
BEGIN
  SELECT id INTO v_duelo_id FROM public.business_models WHERE key = 'duelo_motorista';
  IF v_duelo_id IS NULL THEN
    RAISE NOTICE 'duelo_motorista business_model não encontrado — abortando backfill';
    RETURN;
  END IF;

  FOR v_brand IN
    SELECT bbm.id AS bbm_id, bbm.brand_id, bbm.config_json
    FROM public.brand_business_models bbm
    WHERE bbm.business_model_id = v_duelo_id
  LOOP
    -- Lê estado real dos auxiliares para esta marca (ausente = false)
    SELECT COALESCE(bool_or(bbm2.is_enabled), false) INTO v_cinturao
      FROM public.brand_business_models bbm2
      JOIN public.business_models bm2 ON bm2.id = bbm2.business_model_id
      WHERE bbm2.brand_id = v_brand.brand_id AND bm2.key = 'cinturao_motorista';

    SELECT COALESCE(bool_or(bbm2.is_enabled), false) INTO v_aposta
      FROM public.brand_business_models bbm2
      JOIN public.business_models bm2 ON bm2.id = bbm2.business_model_id
      WHERE bbm2.brand_id = v_brand.brand_id AND bm2.key = 'aposta_motorista';

    SELECT COALESCE(bool_or(bbm2.is_enabled), false) INTO v_ranking
      FROM public.brand_business_models bbm2
      JOIN public.business_models bm2 ON bm2.id = bbm2.business_model_id
      WHERE bbm2.brand_id = v_brand.brand_id AND bm2.key = 'rank_motorista';

    SELECT COALESCE(bool_or(bbm2.is_enabled), false) INTO v_campeonato
      FROM public.brand_business_models bbm2
      JOIN public.business_models bm2 ON bm2.id = bbm2.business_model_id
      WHERE bbm2.brand_id = v_brand.brand_id AND bm2.key = 'campeonato_motorista';

    -- Mescla preservando chaves preexistentes em features
    v_features := COALESCE(v_brand.config_json -> 'features', '{}'::jsonb)
                  || jsonb_build_object(
                       'cinturao', v_cinturao,
                       'aposta', v_aposta,
                       'ranking', v_ranking,
                       'campeonato', v_campeonato
                     );

    UPDATE public.brand_business_models
       SET config_json = COALESCE(config_json, '{}'::jsonb) || jsonb_build_object('features', v_features),
           updated_at  = now()
     WHERE id = v_brand.bbm_id;

    v_updated := v_updated + 1;
    RAISE NOTICE 'Backfill brand_id=% : cinturao=% aposta=% ranking=% campeonato=%',
      v_brand.brand_id, v_cinturao, v_aposta, v_ranking, v_campeonato;
  END LOOP;

  RAISE NOTICE 'Backfill concluído: % brand_business_models atualizados', v_updated;
END $$;