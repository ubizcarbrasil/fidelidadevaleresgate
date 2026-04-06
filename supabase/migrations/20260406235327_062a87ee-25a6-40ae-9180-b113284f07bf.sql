
-- Políticas (drop if exist para evitar conflito)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Conquistas visíveis publicamente" ON public.driver_achievements;
  DROP POLICY IF EXISTS "Sistema concede conquistas" ON public.driver_achievements;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.driver_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conquistas visíveis publicamente"
  ON public.driver_achievements FOR SELECT
  USING (true);

CREATE POLICY "Sistema concede conquistas"
  ON public.driver_achievements FOR INSERT
  WITH CHECK (false);

-- Função para conceder conquista (sem duplicar)
CREATE OR REPLACE FUNCTION public.grant_achievement(
  p_customer_id uuid,
  p_branch_id uuid,
  p_brand_id uuid,
  p_key text,
  p_label text,
  p_icon text DEFAULT 'Trophy',
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO driver_achievements (customer_id, branch_id, brand_id, achievement_key, achievement_label, icon_name, metadata_json)
  VALUES (p_customer_id, p_branch_id, p_brand_id, p_key, p_label, p_icon, p_metadata)
  ON CONFLICT (customer_id, achievement_key) DO NOTHING;
  RETURN FOUND;
END;
$$;

-- Função que verifica e concede conquistas após um duelo finalizado
CREATE OR REPLACE FUNCTION public.grant_duel_achievements(p_duel_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_winner_customer_id uuid;
  v_loser_customer_id uuid;
  v_challenger_cid uuid;
  v_challenged_cid uuid;
  v_total_duels bigint;
  v_streak bigint;
  v_is_belt_holder boolean;
  v_check_cid uuid;
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status = 'finished';
  IF NOT FOUND THEN RETURN; END IF;

  SELECT customer_id INTO v_challenger_cid FROM driver_duel_participants WHERE id = v_duel.challenger_id;
  SELECT customer_id INTO v_challenged_cid FROM driver_duel_participants WHERE id = v_duel.challenged_id;

  -- Estreia no Ringue
  PERFORM grant_achievement(v_challenger_cid, v_duel.branch_id, v_duel.brand_id, 'first_duel_participated', 'Estreia no Ringue', 'Zap');
  PERFORM grant_achievement(v_challenged_cid, v_duel.branch_id, v_duel.brand_id, 'first_duel_participated', 'Estreia no Ringue', 'Zap');

  IF v_duel.winner_id IS NOT NULL THEN
    SELECT customer_id INTO v_winner_customer_id FROM driver_duel_participants WHERE id = v_duel.winner_id;
    IF v_duel.winner_id = v_duel.challenger_id THEN
      v_loser_customer_id := v_challenged_cid;
    ELSE
      v_loser_customer_id := v_challenger_cid;
    END IF;

    -- Primeira Vitória
    PERFORM grant_achievement(v_winner_customer_id, v_duel.branch_id, v_duel.brand_id, 'first_duel_win', 'Primeira Vitória', 'Swords');

    -- Vingança Completa
    IF EXISTS (
      SELECT 1 FROM driver_duels d2
      JOIN driver_duel_participants p1 ON p1.id = d2.winner_id
      WHERE d2.status = 'finished' AND d2.id != p_duel_id
        AND p1.customer_id = v_loser_customer_id
        AND (
          (d2.challenger_id = v_duel.challenger_id AND d2.challenged_id = v_duel.challenged_id) OR
          (d2.challenger_id = v_duel.challenged_id AND d2.challenged_id = v_duel.challenger_id)
        )
    ) THEN
      PERFORM grant_achievement(v_winner_customer_id, v_duel.branch_id, v_duel.brand_id, 'rematch_winner', 'Vingança Completa', 'RotateCcw');
    END IF;

    -- Sequência de 5 vitórias
    WITH recent AS (
      SELECT d.id, pw.customer_id AS winner_cid, d.end_at
      FROM driver_duels d
      LEFT JOIN driver_duel_participants pw ON pw.id = d.winner_id
      WHERE d.status = 'finished' AND d.branch_id = v_duel.branch_id
        AND (
          EXISTS (SELECT 1 FROM driver_duel_participants dp WHERE dp.id = d.challenger_id AND dp.customer_id = v_winner_customer_id) OR
          EXISTS (SELECT 1 FROM driver_duel_participants dp WHERE dp.id = d.challenged_id AND dp.customer_id = v_winner_customer_id)
        )
      ORDER BY d.end_at DESC
    )
    SELECT COUNT(*) INTO v_streak FROM (
      SELECT * FROM recent WHERE winner_cid = v_winner_customer_id
      AND end_at >= COALESCE(
        (SELECT end_at FROM recent WHERE winner_cid IS DISTINCT FROM v_winner_customer_id ORDER BY end_at DESC LIMIT 1),
        '1970-01-01'::timestamptz
      )
    ) s;

    IF v_streak >= 5 THEN
      PERFORM grant_achievement(v_winner_customer_id, v_duel.branch_id, v_duel.brand_id, 'five_wins_streak', '5 Vitórias Seguidas', 'Flame');
    END IF;

    -- Dono do Cinturão
    IF EXISTS (SELECT 1 FROM city_belt_champions WHERE champion_customer_id = v_winner_customer_id AND branch_id = v_duel.branch_id) THEN
      PERFORM grant_achievement(v_winner_customer_id, v_duel.branch_id, v_duel.brand_id, 'belt_holder', 'Dono do Cinturão', 'Crown');
    END IF;

    -- Número 1 no ranking
    IF EXISTS (SELECT 1 FROM get_city_driver_ranking(v_duel.branch_id, 1) r WHERE r.customer_id = v_winner_customer_id) THEN
      PERFORM grant_achievement(v_winner_customer_id, v_duel.branch_id, v_duel.brand_id, 'top1_ranking', 'Número 1', 'Medal');
    END IF;
  END IF;

  -- Veterano (10 duelos) - ambos participantes
  FOR v_check_cid IN VALUES (v_challenger_cid), (v_challenged_cid) LOOP
    SELECT COUNT(*) INTO v_total_duels
    FROM driver_duels d
    WHERE d.status = 'finished'
      AND (
        EXISTS (SELECT 1 FROM driver_duel_participants dp WHERE dp.id = d.challenger_id AND dp.customer_id = v_check_cid) OR
        EXISTS (SELECT 1 FROM driver_duel_participants dp WHERE dp.id = d.challenged_id AND dp.customer_id = v_check_cid)
      );

    IF v_total_duels >= 10 THEN
      PERFORM grant_achievement(v_check_cid, v_duel.branch_id, v_duel.brand_id, 'ten_duels_completed', 'Veterano de Duelos', 'Target');
    END IF;
  END LOOP;
END;
$$;
