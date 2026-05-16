BEGIN;

ALTER FUNCTION public.duelo_increment_bracket_rides()
  RENAME TO campeonato_increment_bracket_rides;

ALTER FUNCTION public.duelo_update_standings_from_ride()
  RENAME TO campeonato_update_standings_from_ride;

ALTER FUNCTION public.set_updated_at_duelo_tiers()
  RENAME TO set_updated_at_campeonato;

DROP TABLE IF EXISTS public.plan_duelo_prize_ranges CASCADE;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'duelo_increment_bracket_rides',
        'duelo_update_standings_from_ride',
        'set_updated_at_duelo_tiers'
      )
  ) THEN
    RAISE EXCEPTION 'Ainda existem funções com nome duelo_* — verificar.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = 'campeonato_increment_bracket_rides'
  ) THEN
    RAISE EXCEPTION 'campeonato_increment_bracket_rides não encontrada.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = 'campeonato_update_standings_from_ride'
  ) THEN
    RAISE EXCEPTION 'campeonato_update_standings_from_ride não encontrada.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'plan_duelo_prize_ranges'
  ) THEN
    RAISE EXCEPTION 'plan_duelo_prize_ranges ainda existe — verificar.';
  END IF;
END $$;

COMMIT;