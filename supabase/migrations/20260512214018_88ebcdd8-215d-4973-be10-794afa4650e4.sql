
CREATE TABLE IF NOT EXISTS public.duelo_artilharia_window_prizes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id   UUID NOT NULL REFERENCES public.duelo_seasons(id) ON DELETE CASCADE,
  window_key  TEXT NOT NULL CHECK (window_key IN ('24h','7d','15d','30d')),
  enabled     BOOLEAN NOT NULL DEFAULT false,
  label       TEXT DEFAULT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (season_id, window_key)
);

CREATE INDEX IF NOT EXISTS idx_duelo_artilharia_window_prizes_season
  ON public.duelo_artilharia_window_prizes(season_id);

ALTER TABLE public.duelo_artilharia_window_prizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS artilharia_window_prizes_select ON public.duelo_artilharia_window_prizes;
CREATE POLICY artilharia_window_prizes_select ON public.duelo_artilharia_window_prizes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.duelo_seasons s
      WHERE s.id = season_id
        AND (
          public.duelo_admin_can_manage(s.brand_id)
          OR EXISTS (
            SELECT 1 FROM public.customers c
            WHERE c.user_id = auth.uid()
              AND c.brand_id = s.brand_id
              AND c.branch_id = s.branch_id
          )
        )
    )
  );

DROP POLICY IF EXISTS artilharia_window_prizes_admin_write ON public.duelo_artilharia_window_prizes;
CREATE POLICY artilharia_window_prizes_admin_write ON public.duelo_artilharia_window_prizes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.duelo_seasons s WHERE s.id = season_id AND public.duelo_admin_can_manage(s.brand_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.duelo_seasons s WHERE s.id = season_id AND public.duelo_admin_can_manage(s.brand_id)));

CREATE OR REPLACE FUNCTION public.tg_duelo_artilharia_window_prizes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_duelo_artilharia_window_prizes_updated_at ON public.duelo_artilharia_window_prizes;
CREATE TRIGGER trg_duelo_artilharia_window_prizes_updated_at
  BEFORE UPDATE ON public.duelo_artilharia_window_prizes
  FOR EACH ROW EXECUTE FUNCTION public.tg_duelo_artilharia_window_prizes_updated_at();

DROP FUNCTION IF EXISTS public.driver_get_top_riders(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.driver_get_top_riders(p_season_id UUID, p_window TEXT)
RETURNS TABLE (
  rank         INTEGER,
  driver_id    UUID,
  driver_name  TEXT,
  photo_url    TEXT,
  total_rides  INTEGER,
  has_prize    BOOLEAN,
  prize_label  TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    FROM public.duelo_seasons
   WHERE id = p_season_id;
  IF v_brand_id IS NULL THEN
    RETURN;
  END IF;

  SELECT awp.enabled, awp.label INTO v_window_enabled, v_window_label
    FROM public.duelo_artilharia_window_prizes awp
   WHERE awp.season_id = p_season_id
     AND awp.window_key = p_window;

  RETURN QUERY
  WITH membros AS (
    SELECT tm.driver_id
      FROM public.duelo_tier_memberships tm
      JOIN public.duelo_season_tiers t ON t.id = tm.tier_id
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
    CASE WHEN COALESCE(v_window_enabled, false) AND r.rank = 1
         THEN v_window_label
         ELSE NULL END AS prize_label
  FROM ranqueado r
  LEFT JOIN public.customers cu       ON cu.id = r.driver_id
  LEFT JOIN public.driver_profiles dp ON dp.customer_id = r.driver_id
  ORDER BY r.rank;
END;
$$;

REVOKE ALL ON FUNCTION public.driver_get_top_riders(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.driver_get_top_riders(UUID, TEXT) TO authenticated;
