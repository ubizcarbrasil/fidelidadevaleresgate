
-- 1) Add new columns
ALTER TABLE public.campeonato_artilharia_window_prizes
  ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS prize_kind TEXT,
  ADD COLUMN IF NOT EXISTS prize_value TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 2) Constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'campeonato_artilharia_window_prizes_position_check'
  ) THEN
    ALTER TABLE public.campeonato_artilharia_window_prizes
      ADD CONSTRAINT campeonato_artilharia_window_prizes_position_check
      CHECK (position BETWEEN 1 AND 50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'campeonato_artilharia_window_prizes_prize_kind_check'
  ) THEN
    ALTER TABLE public.campeonato_artilharia_window_prizes
      ADD CONSTRAINT campeonato_artilharia_window_prizes_prize_kind_check
      CHECK (prize_kind IS NULL OR prize_kind IN ('points','item'));
  END IF;
END $$;

-- 3) Drop old unique (season_id, window_key) and create (season_id, window_key, position)
ALTER TABLE public.campeonato_artilharia_window_prizes
  DROP CONSTRAINT IF EXISTS duelo_artilharia_window_prizes_season_id_window_key_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'campeonato_artilharia_window_prizes_season_window_pos_key'
  ) THEN
    ALTER TABLE public.campeonato_artilharia_window_prizes
      ADD CONSTRAINT campeonato_artilharia_window_prizes_season_window_pos_key
      UNIQUE (season_id, window_key, position);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campeonato_artilharia_window_prizes_swp
  ON public.campeonato_artilharia_window_prizes (season_id, window_key, position);

-- 4) Backfill: legacy rows (single label/enabled) become position=1 with description fallback
UPDATE public.campeonato_artilharia_window_prizes
   SET description = COALESCE(NULLIF(description, ''), label)
 WHERE position = 1
   AND (description IS NULL OR description = '')
   AND label IS NOT NULL;

-- 5) Update RPC driver_get_top_riders to read position=1
CREATE OR REPLACE FUNCTION public.driver_get_top_riders(p_season_id uuid, p_window text)
 RETURNS TABLE(rank integer, driver_id uuid, driver_name text, photo_url text, total_rides integer, has_prize boolean, prize_label text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_interval INTERVAL;
  v_brand_id UUID;
  v_branch_id UUID;
  v_window_enabled BOOLEAN := false;
  v_window_label TEXT := NULL;
BEGIN
  v_interval := CASE p_window
    WHEN '24h' THEN INTERVAL '24 hours'
    WHEN '7d'  THEN INTERVAL '7 days'
    WHEN '15d' THEN INTERVAL '15 days'
    WHEN '30d' THEN INTERVAL '30 days'
    ELSE INTERVAL '24 hours'
  END;

  SELECT brand_id, branch_id INTO v_brand_id, v_branch_id
    FROM public.campeonato_seasons
   WHERE id = p_season_id;
  IF v_brand_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(awp.enabled, false) OR (awp.prize_kind IS NOT NULL OR COALESCE(awp.description,'') <> '' OR COALESCE(awp.prize_value,'') <> ''),
    COALESCE(NULLIF(awp.description, ''), awp.label)
  INTO v_window_enabled, v_window_label
    FROM public.campeonato_artilharia_window_prizes awp
   WHERE awp.season_id = p_season_id
     AND awp.window_key = p_window
     AND awp.position = 1;

  RETURN QUERY
  WITH membros AS (
    SELECT tm.driver_id
      FROM public.campeonato_tier_memberships tm
      JOIN public.campeonato_season_tiers t ON t.id = tm.tier_id
     WHERE t.season_id = p_season_id
  ),
  contagem AS (
    SELECT mr.driver_id, COUNT(*)::INTEGER AS total_rides
      FROM public.machine_rides mr
      JOIN membros m ON m.driver_id = mr.driver_id
     WHERE mr.brand_id  = v_brand_id
       AND mr.branch_id = v_branch_id
       AND mr.created_at >= NOW() - v_interval
     GROUP BY mr.driver_id
  ),
  ranqueado AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY c.total_rides DESC, c.driver_id ASC)::INTEGER AS rank,
      c.driver_id,
      c.total_rides
    FROM contagem c
    ORDER BY c.total_rides DESC
    LIMIT 20
  )
  SELECT
    r.rank,
    r.driver_id,
    cu.name AS driver_name,
    COALESCE(cu.photo_url, dp.photo_url) AS photo_url,
    r.total_rides,
    (COALESCE(v_window_enabled, false) AND r.rank = 1) AS has_prize,
    CASE WHEN r.rank = 1 THEN v_window_label ELSE NULL END AS prize_label
  FROM ranqueado r
  LEFT JOIN public.customers cu ON cu.id = r.driver_id
  LEFT JOIN public.driver_profiles dp ON dp.driver_id = r.driver_id
  ORDER BY r.rank;
END;
$function$;
