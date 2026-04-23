-- =====================================================================
-- SPRINT 4B — D9 (Apostas exige Duelo) + UI por cidade
-- =====================================================================
-- 1) branch_has_feature: aceita 'duelo' e faz OR das duas chaves de aposta
-- 2) branch_set_feature: mutação com D9, cascata e dual-write
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) branch_has_feature estendida
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.branch_has_feature(
  p_branch_id uuid,
  p_feature   text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id    uuid;
  v_settings    jsonb;
  v_flag_val    jsonb;
  v_flag_val_2  jsonb;
  v_aposta_on   boolean;
BEGIN
  IF p_feature NOT IN ('duelo','cinturao','aposta','ranking') THEN
    RAISE EXCEPTION 'Feature invalida: %', p_feature USING ERRCODE = '22023';
  END IF;

  SELECT brand_id, COALESCE(branch_settings_json, '{}'::jsonb)
    INTO v_brand_id, v_settings
    FROM branches
   WHERE id = p_branch_id;

  IF v_brand_id IS NULL THEN
    RETURN false;
  END IF;

  -- ----- DUELO: default ON; só desliga se enable_driver_duels = false -----
  IF p_feature = 'duelo' THEN
    v_flag_val := v_settings -> 'enable_driver_duels';
    IF v_flag_val IS NOT NULL
       AND jsonb_typeof(v_flag_val) = 'boolean'
       AND (v_flag_val)::text::boolean = false THEN
      RETURN false;
    END IF;
    -- Sem helper de marca para 'duelo' (não está no whitelist de brand_has_feature);
    -- política: cidade controla via flag. Default ON quando flag ausente.
    RETURN true;
  END IF;

  -- ----- APOSTA: default OFF; OR das duas chaves (dual-write Sprint 4B) -----
  IF p_feature = 'aposta' THEN
    v_flag_val   := v_settings -> 'enable_side_bets';
    v_flag_val_2 := v_settings -> 'enable_duel_side_bets';

    v_aposta_on := false;
    IF v_flag_val IS NOT NULL
       AND jsonb_typeof(v_flag_val) = 'boolean'
       AND (v_flag_val)::text::boolean = true THEN
      v_aposta_on := true;
    END IF;
    IF NOT v_aposta_on
       AND v_flag_val_2 IS NOT NULL
       AND jsonb_typeof(v_flag_val_2) = 'boolean'
       AND (v_flag_val_2)::text::boolean = true THEN
      v_aposta_on := true;
    END IF;

    IF v_aposta_on THEN
      RETURN public.brand_has_feature(v_brand_id, 'aposta');
    END IF;
    RETURN false;
  END IF;

  -- ----- CINTURAO / RANKING: default ON; só desliga se = false -----
  v_flag_val := v_settings -> CASE p_feature
    WHEN 'cinturao' THEN 'enable_city_belt'
    WHEN 'ranking'  THEN 'enable_city_ranking'
  END;

  IF v_flag_val IS NOT NULL
     AND jsonb_typeof(v_flag_val) = 'boolean'
     AND (v_flag_val)::text::boolean = false THEN
    RETURN false;
  END IF;
  RETURN public.brand_has_feature(v_brand_id, p_feature);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.branch_has_feature(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 2) branch_set_feature: mutação com D9 + cascata + dual-write
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.branch_set_feature(
  p_branch_id          uuid,
  p_feature            text,
  p_enabled            boolean,
  p_cascade_side_bets  boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id      uuid;
  v_settings      jsonb;
  v_caller        uuid := auth.uid();
  v_is_root       boolean;
  v_in_brand      boolean := false;
  v_apostas_on    boolean;
  v_applied       jsonb := '[]'::jsonb;
  v_cascaded      jsonb := '[]'::jsonb;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Nao autenticado' USING ERRCODE = '42501';
  END IF;

  IF p_feature NOT IN ('duelo','cinturao','aposta','ranking') THEN
    RAISE EXCEPTION 'Feature invalida: %', p_feature USING ERRCODE = '22023';
  END IF;

  -- Lock + leitura
  SELECT brand_id, COALESCE(branch_settings_json, '{}'::jsonb)
    INTO v_brand_id, v_settings
    FROM branches
   WHERE id = p_branch_id
   FOR UPDATE;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Cidade nao encontrada' USING ERRCODE = 'P0002';
  END IF;

  -- Autorização: root OU admin da marca
  v_is_root := public.has_role(v_caller, 'root_admin'::app_role);
  IF NOT v_is_root THEN
    SELECT v_brand_id = ANY(public.get_user_brand_ids(v_caller)) INTO v_in_brand;
    IF NOT v_in_brand THEN
      RAISE EXCEPTION 'Sem permissao para esta marca' USING ERRCODE = '42501';
    END IF;
  END IF;

  -- D9: ligar aposta exige duelo ligado
  IF p_feature = 'aposta' AND p_enabled = true THEN
    IF public.branch_has_feature(p_branch_id, 'duelo') = false THEN
      RAISE EXCEPTION 'Apostas exigem que Duelo esteja ativo nesta cidade'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  -- Cascata: desligar duelo quando há apostas ativas
  IF p_feature = 'duelo' AND p_enabled = false THEN
    v_apostas_on := public.branch_has_feature(p_branch_id, 'aposta');
    IF v_apostas_on AND p_cascade_side_bets = false THEN
      RAISE EXCEPTION 'Desativar Duelo vai desligar Apostas. Confirme com p_cascade_side_bets=true'
        USING ERRCODE = '23514';
    END IF;

    IF v_apostas_on AND p_cascade_side_bets = true THEN
      -- Desliga apostas em ambas as chaves (dual-write)
      v_settings := jsonb_set(v_settings, '{enable_side_bets}',      to_jsonb(false), true);
      v_settings := jsonb_set(v_settings, '{enable_duel_side_bets}', to_jsonb(false), true);
      v_cascaded := v_cascaded || to_jsonb('aposta'::text);
    END IF;
  END IF;

  -- Aplicação principal
  IF p_feature = 'duelo' THEN
    v_settings := jsonb_set(v_settings, '{enable_driver_duels}', to_jsonb(p_enabled), true);
  ELSIF p_feature = 'cinturao' THEN
    v_settings := jsonb_set(v_settings, '{enable_city_belt}', to_jsonb(p_enabled), true);
  ELSIF p_feature = 'ranking' THEN
    v_settings := jsonb_set(v_settings, '{enable_city_ranking}', to_jsonb(p_enabled), true);
  ELSIF p_feature = 'aposta' THEN
    -- Dual-write: ambas as chaves recebem o mesmo valor (Sprint 4B D1)
    v_settings := jsonb_set(v_settings, '{enable_side_bets}',      to_jsonb(p_enabled), true);
    v_settings := jsonb_set(v_settings, '{enable_duel_side_bets}', to_jsonb(p_enabled), true);
  END IF;

  v_applied := v_applied || to_jsonb(p_feature);

  UPDATE branches
     SET branch_settings_json = v_settings
   WHERE id = p_branch_id;

  RETURN jsonb_build_object(
    'applied',  v_applied,
    'cascaded', v_cascaded
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.branch_set_feature(uuid, text, boolean, boolean) TO authenticated;

-- ROLLBACK:
--   DROP FUNCTION IF EXISTS public.branch_set_feature(uuid, text, boolean, boolean);
--   -- branch_has_feature: restaurar versão Sprint 3 (whitelist sem 'duelo' e leitura única de enable_side_bets)