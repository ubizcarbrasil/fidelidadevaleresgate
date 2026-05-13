-- =========================================================================
-- FASE B — Rename duelo_* → campeonato_* (migration atômica)
-- 16 tabelas + reescrita dinâmica de todas as funções que as referenciam
-- + 13 RPCs renomeadas com wrappers de compatibilidade duelo_*
-- =========================================================================

-- PART 1: RENAME das 16 tabelas
ALTER TABLE public.duelo_seasons                    RENAME TO campeonato_seasons;
ALTER TABLE public.duelo_season_tiers               RENAME TO campeonato_season_tiers;
ALTER TABLE public.duelo_season_enrollments         RENAME TO campeonato_season_enrollments;
ALTER TABLE public.duelo_tier_memberships           RENAME TO campeonato_tier_memberships;
ALTER TABLE public.duelo_brackets                   RENAME TO campeonato_brackets;
ALTER TABLE public.duelo_match_events               RENAME TO campeonato_match_events;
ALTER TABLE public.duelo_season_standings           RENAME TO campeonato_season_standings;
ALTER TABLE public.duelo_season_prizes              RENAME TO campeonato_season_prizes;
ALTER TABLE public.duelo_artilharia_window_prizes   RENAME TO campeonato_artilharia_window_prizes;
ALTER TABLE public.duelo_prize_distributions        RENAME TO campeonato_prize_distributions;
ALTER TABLE public.duelo_champions                  RENAME TO campeonato_champions;
ALTER TABLE public.duelo_driver_tier_history        RENAME TO campeonato_driver_tier_history;
ALTER TABLE public.duelo_season_phase_config        RENAME TO campeonato_season_phase_config;
ALTER TABLE public.duelo_classificacao_auditoria    RENAME TO campeonato_classificacao_auditoria;
ALTER TABLE public.duelo_notifications              RENAME TO campeonato_notifications;
ALTER TABLE public.duelo_attempts_log               RENAME TO campeonato_attempts_log;

-- PART 2: Reescrita dinâmica de TODAS as funções que referenciam as
-- 16 tabelas no corpo. Substitui apenas nomes de tabela (com word boundary)
-- preservando 100% da lógica, assinatura, SECURITY DEFINER e search_path.
DO $rebuild$
DECLARE
  fn record;
  newdef text;
  pair record;
BEGIN
  FOR fn IN
    SELECT p.oid, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND pg_get_functiondef(p.oid) ~
        E'\\mduelo_(seasons|season_tiers|season_enrollments|tier_memberships|brackets|match_events|season_standings|season_prizes|artilharia_window_prizes|prize_distributions|champions|driver_tier_history|season_phase_config|classificacao_auditoria|notifications|attempts_log)\\M'
  LOOP
    newdef := pg_get_functiondef(fn.oid);
    -- Ordem: nomes longos primeiro para evitar colisão de prefixo
    FOR pair IN SELECT * FROM (VALUES
      ('duelo_artilharia_window_prizes','campeonato_artilharia_window_prizes'),
      ('duelo_classificacao_auditoria','campeonato_classificacao_auditoria'),
      ('duelo_prize_distributions','campeonato_prize_distributions'),
      ('duelo_season_phase_config','campeonato_season_phase_config'),
      ('duelo_season_enrollments','campeonato_season_enrollments'),
      ('duelo_driver_tier_history','campeonato_driver_tier_history'),
      ('duelo_tier_memberships','campeonato_tier_memberships'),
      ('duelo_season_standings','campeonato_season_standings'),
      ('duelo_season_prizes','campeonato_season_prizes'),
      ('duelo_season_tiers','campeonato_season_tiers'),
      ('duelo_match_events','campeonato_match_events'),
      ('duelo_notifications','campeonato_notifications'),
      ('duelo_attempts_log','campeonato_attempts_log'),
      ('duelo_champions','campeonato_champions'),
      ('duelo_brackets','campeonato_brackets'),
      ('duelo_seasons','campeonato_seasons')
    ) AS t(old_name, new_name)
    LOOP
      newdef := regexp_replace(newdef, E'\\m' || pair.old_name || E'\\M', pair.new_name, 'g');
    END LOOP;
    EXECUTE newdef;
  END LOOP;
END;
$rebuild$;

-- PART 3: Rename das 13 RPCs duelo_* → campeonato_* + wrappers de compat

ALTER FUNCTION public.duelo_add_driver_to_season(uuid, uuid, uuid, integer, text)
  RENAME TO campeonato_add_driver_to_season;
ALTER FUNCTION public.duelo_advance_phases()
  RENAME TO campeonato_advance_phases;
ALTER FUNCTION public.duelo_backfill_standings(uuid)
  RENAME TO campeonato_backfill_standings;
ALTER FUNCTION public.duelo_calculate_prizes(uuid)
  RENAME TO campeonato_calculate_prizes;
ALTER FUNCTION public.duelo_cancel_prize(uuid, text)
  RENAME TO campeonato_cancel_prize;
ALTER FUNCTION public.duelo_cancel_season(uuid, text)
  RENAME TO campeonato_cancel_season;
ALTER FUNCTION public.duelo_change_engagement_format(uuid, text)
  RENAME TO campeonato_change_engagement_format;
ALTER FUNCTION public.duelo_get_engagement_format(uuid)
  RENAME TO campeonato_get_engagement_format;
ALTER FUNCTION public.duelo_materialize_and_seed_season(uuid, uuid)
  RENAME TO campeonato_materialize_and_seed_season;
ALTER FUNCTION public.duelo_pause_season(uuid)
  RENAME TO campeonato_pause_season;
ALTER FUNCTION public.duelo_reconcile_standings(integer)
  RENAME TO campeonato_reconcile_standings;
ALTER FUNCTION public.duelo_resume_season(uuid)
  RENAME TO campeonato_resume_season;
ALTER FUNCTION public.duelo_update_prize(uuid, text, text, integer)
  RENAME TO campeonato_update_prize;

-- Wrappers de compatibilidade duelo_* → campeonato_* (preservar defaults)

CREATE OR REPLACE FUNCTION public.duelo_add_driver_to_season(
  p_season_id uuid, p_driver_id uuid, p_tier_id uuid,
  p_initial_points integer DEFAULT 0, p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.campeonato_add_driver_to_season(p_season_id, p_driver_id, p_tier_id, p_initial_points, p_reason);
$$;

CREATE OR REPLACE FUNCTION public.duelo_advance_phases()
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.campeonato_advance_phases();
$$;

CREATE OR REPLACE FUNCTION public.duelo_backfill_standings(p_season_id uuid)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.campeonato_backfill_standings(p_season_id);
$$;

CREATE OR REPLACE FUNCTION public.duelo_calculate_prizes(p_season_id uuid)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.campeonato_calculate_prizes(p_season_id);
$$;

CREATE OR REPLACE FUNCTION public.duelo_cancel_prize(p_distribution_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.campeonato_cancel_prize(p_distribution_id, p_reason);
$$;

CREATE OR REPLACE FUNCTION public.duelo_cancel_season(p_season_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.campeonato_cancel_season(p_season_id, p_reason);
$$;

CREATE OR REPLACE FUNCTION public.duelo_change_engagement_format(p_brand_id uuid, p_new_format text)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.campeonato_change_engagement_format(p_brand_id, p_new_format);
$$;

CREATE OR REPLACE FUNCTION public.duelo_get_engagement_format(p_brand_id uuid)
RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.campeonato_get_engagement_format(p_brand_id);
$$;

CREATE OR REPLACE FUNCTION public.duelo_materialize_and_seed_season(
  p_season_id uuid, p_caller uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.campeonato_materialize_and_seed_season(p_season_id, p_caller);
$$;

CREATE OR REPLACE FUNCTION public.duelo_pause_season(p_season_id uuid)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.campeonato_pause_season(p_season_id);
$$;

CREATE OR REPLACE FUNCTION public.duelo_reconcile_standings(p_hours integer DEFAULT 48)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.campeonato_reconcile_standings(p_hours);
$$;

CREATE OR REPLACE FUNCTION public.duelo_resume_season(p_season_id uuid)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.campeonato_resume_season(p_season_id);
$$;

CREATE OR REPLACE FUNCTION public.duelo_update_prize(
  p_brand_id uuid, p_tier_name text, p_position text, p_new_points integer
) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.campeonato_update_prize(p_brand_id, p_tier_name, p_position, p_new_points);
$$;