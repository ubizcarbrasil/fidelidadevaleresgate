
-- ============================================================
-- C.2 — Promoção/Rebaixamento (3/3)
-- ============================================================

ALTER TABLE public.duelo_seasons
  ADD COLUMN IF NOT EXISTS promotion_applied_at timestamptz;

CREATE OR REPLACE FUNCTION public.duelo_apply_promotion_relegation(p_season_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season public.duelo_seasons%ROWTYPE;
  v_tier record;
  v_next_tier_id uuid;
  v_prev_tier_id uuid;
  v_max_order int;
  v_min_order int;
  v_zero_relegated int := 0;
  v_relegated int := 0;
  v_promoted int := 0;
  v_stayed int := 0;
  v_champion uuid;
  v_d record;
BEGIN
  SELECT * INTO v_season FROM public.duelo_seasons WHERE id = p_season_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Temporada % não encontrada', p_season_id;
  END IF;

  IF v_season.phase <> 'finished' THEN
    RAISE EXCEPTION 'Promoção/rebaixamento só aplica em fase finished (atual: %)', v_season.phase;
  END IF;

  IF v_season.promotion_applied_at IS NOT NULL THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'already_applied', 'at', v_season.promotion_applied_at);
  END IF;

  SELECT MAX(tier_order), MIN(tier_order)
    INTO v_max_order, v_min_order
    FROM public.duelo_season_tiers
   WHERE season_id = p_season_id;

  -- Garante position_in_tier final em standings sem qualified
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY tier_id
             ORDER BY points DESC NULLS LAST, last_ride_at ASC NULLS LAST
           ) AS pos
      FROM public.duelo_season_standings
     WHERE season_id = p_season_id
  )
  UPDATE public.duelo_season_standings st
     SET position_in_tier = r.pos
    FROM ranked r
   WHERE st.id = r.id
     AND (st.position_in_tier IS NULL OR st.position_in_tier <> r.pos);

  -- ===========================================================
  -- ETAPA 1: rebaixamento por zero pontos
  -- ===========================================================
  FOR v_tier IN
    SELECT * FROM public.duelo_season_tiers
     WHERE season_id = p_season_id
     ORDER BY tier_order
  LOOP
    SELECT id INTO v_next_tier_id
      FROM public.duelo_season_tiers
     WHERE season_id = p_season_id AND tier_order = v_tier.tier_order + 1;

    FOR v_d IN
      SELECT st.driver_id, st.id AS standing_id
        FROM public.duelo_season_standings st
       WHERE st.season_id = p_season_id
         AND st.tier_id = v_tier.id
         AND COALESCE(st.points, 0) = 0
    LOOP
      UPDATE public.duelo_season_standings
         SET relegated_auto = true
       WHERE id = v_d.standing_id;

      INSERT INTO public.duelo_driver_tier_history (
        season_id, driver_id, brand_id, branch_id,
        starting_tier_id, ending_tier_id, ending_position, outcome
      )
      SELECT p_season_id, v_d.driver_id, v_season.brand_id, v_season.branch_id,
             v_tier.id, COALESCE(v_next_tier_id, v_tier.id), st.position_in_tier,
             CASE WHEN v_next_tier_id IS NULL THEN 'stayed' ELSE 'relegated_zero' END
        FROM public.duelo_season_standings st
       WHERE st.id = v_d.standing_id
      ON CONFLICT DO NOTHING;

      v_zero_relegated := v_zero_relegated + 1;
    END LOOP;
  END LOOP;

  -- ===========================================================
  -- ETAPA 2: rebaixamento normal (excluindo já rebaixados por zero)
  -- ===========================================================
  FOR v_tier IN
    SELECT * FROM public.duelo_season_tiers
     WHERE season_id = p_season_id AND tier_order < v_max_order
     ORDER BY tier_order
  LOOP
    SELECT id INTO v_next_tier_id
      FROM public.duelo_season_tiers
     WHERE season_id = p_season_id AND tier_order = v_tier.tier_order + 1;

    FOR v_d IN
      SELECT st.driver_id, st.position_in_tier
        FROM public.duelo_season_standings st
       WHERE st.season_id = p_season_id
         AND st.tier_id = v_tier.id
         AND COALESCE(st.relegated_auto,false) = false
       ORDER BY st.position_in_tier DESC NULLS FIRST
       LIMIT v_tier.relegation_count
    LOOP
      INSERT INTO public.duelo_driver_tier_history (
        season_id, driver_id, brand_id, branch_id,
        starting_tier_id, ending_tier_id, ending_position, outcome
      )
      VALUES (
        p_season_id, v_d.driver_id, v_season.brand_id, v_season.branch_id,
        v_tier.id, v_next_tier_id, v_d.position_in_tier, 'relegated'
      )
      ON CONFLICT DO NOTHING;
      v_relegated := v_relegated + 1;
    END LOOP;
  END LOOP;

  -- ===========================================================
  -- ETAPA 3: promoção
  -- ===========================================================
  FOR v_tier IN
    SELECT * FROM public.duelo_season_tiers
     WHERE season_id = p_season_id AND tier_order > v_min_order
     ORDER BY tier_order
  LOOP
    SELECT id INTO v_prev_tier_id
      FROM public.duelo_season_tiers
     WHERE season_id = p_season_id AND tier_order = v_tier.tier_order - 1;

    -- Promove top N do tier inferior (tier_order maior = mais baixo)
    FOR v_d IN
      SELECT st.driver_id, st.position_in_tier, st.tier_id AS source_tier_id
        FROM public.duelo_season_standings st
       WHERE st.season_id = p_season_id
         AND st.tier_id = v_tier.id  -- tier ATUAL (mais baixo, será origem da promoção)
         AND COALESCE(st.relegated_auto,false) = false
         AND NOT EXISTS (
           SELECT 1 FROM public.duelo_driver_tier_history h
            WHERE h.season_id = p_season_id
              AND h.driver_id = st.driver_id
         )
       ORDER BY st.position_in_tier ASC NULLS LAST
       LIMIT (
         SELECT promotion_count FROM public.duelo_season_tiers WHERE id = v_tier.id
       )
    LOOP
      INSERT INTO public.duelo_driver_tier_history (
        season_id, driver_id, brand_id, branch_id,
        starting_tier_id, ending_tier_id, ending_position, outcome
      )
      VALUES (
        p_season_id, v_d.driver_id, v_season.brand_id, v_season.branch_id,
        v_tier.id, v_prev_tier_id, v_d.position_in_tier, 'promoted'
      )
      ON CONFLICT DO NOTHING;
      v_promoted := v_promoted + 1;
    END LOOP;
  END LOOP;

  -- ===========================================================
  -- ETAPA 4: stayed + champion do tier 1
  -- ===========================================================
  FOR v_d IN
    SELECT st.driver_id, st.tier_id, st.position_in_tier, t.tier_order
      FROM public.duelo_season_standings st
      JOIN public.duelo_season_tiers t ON t.id = st.tier_id
     WHERE st.season_id = p_season_id
       AND NOT EXISTS (
         SELECT 1 FROM public.duelo_driver_tier_history h
          WHERE h.season_id = p_season_id AND h.driver_id = st.driver_id
       )
  LOOP
    INSERT INTO public.duelo_driver_tier_history (
      season_id, driver_id, brand_id, branch_id,
      starting_tier_id, ending_tier_id, ending_position, outcome
    )
    VALUES (
      p_season_id, v_d.driver_id, v_season.brand_id, v_season.branch_id,
      v_d.tier_id, v_d.tier_id, v_d.position_in_tier,
      CASE WHEN v_d.tier_order = v_min_order AND v_d.position_in_tier = 1 THEN 'champion'
           ELSE 'stayed' END
    )
    ON CONFLICT DO NOTHING;
    v_stayed := v_stayed + 1;
  END LOOP;

  UPDATE public.duelo_seasons
     SET promotion_applied_at = now(),
         updated_at = now()
   WHERE id = p_season_id;

  INSERT INTO public.duelo_attempts_log (code, season_id, brand_id, branch_id, details_json)
  VALUES ('promotion_applied', p_season_id, v_season.brand_id, v_season.branch_id,
          jsonb_build_object(
            'zero_relegated', v_zero_relegated,
            'relegated', v_relegated,
            'promoted', v_promoted,
            'stayed', v_stayed
          ));

  RETURN jsonb_build_object(
    'season_id', p_season_id,
    'zero_relegated', v_zero_relegated,
    'relegated', v_relegated,
    'promoted', v_promoted,
    'stayed', v_stayed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.duelo_apply_promotion_relegation(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.duelo_apply_promotion_relegation(uuid) TO authenticated, service_role;

-- ROLLBACK:
-- DROP FUNCTION IF EXISTS public.duelo_apply_promotion_relegation(uuid);
-- ALTER TABLE public.duelo_seasons DROP COLUMN IF EXISTS promotion_applied_at;
