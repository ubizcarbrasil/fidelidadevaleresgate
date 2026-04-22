ALTER TABLE public.duelo_seasons
  ADD COLUMN IF NOT EXISTS scoring_mode text NOT NULL DEFAULT 'total_points',
  ADD COLUMN IF NOT EXISTS scoring_config_json jsonb NOT NULL DEFAULT '{"win":3,"draw":1,"loss":0}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'duelo_seasons_scoring_mode_chk'
  ) THEN
    ALTER TABLE public.duelo_seasons
      ADD CONSTRAINT duelo_seasons_scoring_mode_chk
      CHECK (scoring_mode IN ('total_points','daily_matchup'));
  END IF;
END $$;