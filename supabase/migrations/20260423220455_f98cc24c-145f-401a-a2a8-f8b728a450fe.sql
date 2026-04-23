-- Sprint 3 — Consolidar add-ons em features_json
-- Cria 3 RPCs aditivas. Não dropa nada. BMs legados permanecem is_active=true.
--
-- Mapping (regra Sprint 2 corretivo):
--   BM cinturao_motorista -> duelo_motorista.config_json.features.cinturao
--   BM aposta_motorista   -> duelo_motorista.config_json.features.aposta
--   BM rank_motorista     -> duelo_motorista.config_json.features.ranking
--
-- Defaults por cidade (branch_settings_json):
--   cinturao: enable_city_belt    (ausente/!=false => ON)
--   ranking : enable_city_ranking (ausente/!=false => ON)
--   aposta  : enable_side_bets    (=== true        => ON, default OFF)

-- 1) brand_has_feature ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.brand_has_feature(
  p_brand_id uuid,
  p_feature text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_legacy_key text;
  v_via_config boolean := false;
  v_via_legacy boolean := false;
BEGIN
  IF p_feature NOT IN ('cinturao','aposta','ranking') THEN
    RAISE EXCEPTION 'Feature invalida: %', p_feature USING ERRCODE = '22023';
  END IF;

  -- Caminho 1: leitura consolidada em duelo_motorista.config_json.features
  SELECT COALESCE(
           (bbm.config_json -> 'features' ->> p_feature)::boolean,
           false
         )
    INTO v_via_config
    FROM brand_business_models bbm
    JOIN business_models bm ON bm.id = bbm.business_model_id
   WHERE bbm.brand_id = p_brand_id
     AND bm.key = 'duelo_motorista'
     AND bbm.is_enabled = true
   LIMIT 1;

  v_via_config := COALESCE(v_via_config, false);

  -- Caminho 2 (rede de segurança DS3-4): BM legado ainda ativo na marca
  v_legacy_key := CASE p_feature
    WHEN 'cinturao' THEN 'cinturao_motorista'
    WHEN 'aposta'   THEN 'aposta_motorista'
    WHEN 'ranking'  THEN 'rank_motorista'
  END;

  SELECT EXISTS (
    SELECT 1
      FROM brand_business_models bbm
      JOIN business_models bm ON bm.id = bbm.business_model_id
     WHERE bbm.brand_id = p_brand_id
       AND bm.key = v_legacy_key
       AND bbm.is_enabled = true
  ) INTO v_via_legacy;

  RETURN v_via_config OR v_via_legacy;
END;
$$;

GRANT EXECUTE ON FUNCTION public.brand_has_feature(uuid, text) TO anon, authenticated, service_role;

-- 2) branch_has_feature -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.branch_has_feature(
  p_branch_id uuid,
  p_feature text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_settings jsonb;
  v_flag_key text;
  v_flag_val jsonb;
BEGIN
  IF p_feature NOT IN ('cinturao','aposta','ranking') THEN
    RAISE EXCEPTION 'Feature invalida: %', p_feature USING ERRCODE = '22023';
  END IF;

  SELECT brand_id, COALESCE(branch_settings_json, '{}'::jsonb)
    INTO v_brand_id, v_settings
    FROM branches
   WHERE id = p_branch_id;

  IF v_brand_id IS NULL THEN
    RETURN false;
  END IF;

  v_flag_key := CASE p_feature
    WHEN 'cinturao' THEN 'enable_city_belt'
    WHEN 'ranking'  THEN 'enable_city_ranking'
    WHEN 'aposta'   THEN 'enable_side_bets'
  END;

  v_flag_val := v_settings -> v_flag_key;

  -- Semântica por feature
  IF p_feature = 'aposta' THEN
    -- default OFF: precisa ser explicitamente true
    IF v_flag_val IS NOT NULL AND jsonb_typeof(v_flag_val) = 'boolean' THEN
      IF (v_flag_val)::text::boolean = true THEN
        RETURN public.brand_has_feature(v_brand_id, p_feature);
      ELSE
        RETURN false;
      END IF;
    END IF;
    -- ausente => OFF na cidade; só liga se a marca tiver E a cidade marcar
    RETURN false;
  ELSE
    -- cinturao / ranking: default ON, só desliga se explicitamente false
    IF v_flag_val IS NOT NULL
       AND jsonb_typeof(v_flag_val) = 'boolean'
       AND (v_flag_val)::text::boolean = false THEN
      RETURN false;
    END IF;
    -- ausente ou true => respeita a marca
    RETURN public.brand_has_feature(v_brand_id, p_feature);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.branch_has_feature(uuid, text) TO anon, authenticated, service_role;

-- 3) brand_set_duelo_feature -----------------------------------------------
CREATE OR REPLACE FUNCTION public.brand_set_duelo_feature(
  p_brand_id uuid,
  p_feature text,
  p_enabled boolean
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_root boolean;
  v_is_brand_admin boolean;
  v_duelo_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado' USING ERRCODE = '42501';
  END IF;

  IF p_feature NOT IN ('cinturao','aposta','ranking') THEN
    RAISE EXCEPTION 'Feature invalida: %', p_feature USING ERRCODE = '22023';
  END IF;

  v_is_root := public.has_role(v_uid, 'root_admin'::app_role);

  v_is_brand_admin := EXISTS (
    SELECT 1 FROM unnest(public.get_user_brand_ids(v_uid)) AS bid
     WHERE bid = p_brand_id
  );

  IF NOT (v_is_root OR v_is_brand_admin) THEN
    RAISE EXCEPTION 'Sem permissao para alterar features da marca' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_duelo_id FROM business_models WHERE key = 'duelo_motorista' LIMIT 1;
  IF v_duelo_id IS NULL THEN
    RAISE EXCEPTION 'Modelo duelo_motorista nao encontrado' USING ERRCODE = 'P0002';
  END IF;

  -- Garante linha brand_business_models para o duelo (não força is_enabled)
  INSERT INTO brand_business_models (brand_id, business_model_id, is_enabled, config_json)
  VALUES (p_brand_id, v_duelo_id, false,
          jsonb_build_object('features',
            jsonb_build_object('cinturao', false, 'aposta', false, 'ranking', false, 'campeonato', false)))
  ON CONFLICT (brand_id, business_model_id) DO NOTHING;

  -- Atualiza apenas a feature pedida
  UPDATE brand_business_models
     SET config_json = jsonb_set(
                         COALESCE(config_json, '{}'::jsonb),
                         ARRAY['features', p_feature],
                         to_jsonb(p_enabled),
                         true
                       ),
         updated_at = now()
   WHERE brand_id = p_brand_id
     AND business_model_id = v_duelo_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.brand_set_duelo_feature(uuid, text, boolean) TO authenticated;