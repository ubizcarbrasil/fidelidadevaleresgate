
-- 1. Novos campos em driver_duels
ALTER TABLE public.driver_duels
  ADD COLUMN IF NOT EXISTS duel_mode text NOT NULL DEFAULT 'rides',
  ADD COLUMN IF NOT EXISTS season_id uuid NULL,
  ADD COLUMN IF NOT EXISTS is_rematch boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rematch_of uuid NULL REFERENCES public.driver_duels(id),
  ADD COLUMN IF NOT EXISTS prize_points integer NOT NULL DEFAULT 0;

-- 2. Tabela gamification_seasons
CREATE TABLE public.gamification_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  config_json jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view seasons" ON public.gamification_seasons FOR SELECT TO anon, authenticated USING (true);

-- Trigger de validação de status
CREATE OR REPLACE FUNCTION public.validate_season_status()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('upcoming', 'active', 'finished') THEN
    RAISE EXCEPTION 'status must be upcoming, active, or finished';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_season_status
  BEFORE INSERT OR UPDATE ON public.gamification_seasons
  FOR EACH ROW EXECUTE FUNCTION public.validate_season_status();

-- FK de season_id em driver_duels
ALTER TABLE public.driver_duels
  ADD CONSTRAINT driver_duels_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.gamification_seasons(id);

-- 3. Tabela driver_achievements
CREATE TABLE public.driver_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  achievement_label text NOT NULL,
  icon_name text DEFAULT 'Trophy',
  achieved_at timestamptz NOT NULL DEFAULT now(),
  metadata_json jsonb DEFAULT '{}',
  UNIQUE (customer_id, achievement_key)
);

ALTER TABLE public.driver_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements" ON public.driver_achievements FOR SELECT TO anon, authenticated USING (true);

-- 4. Tabela city_feed_events
CREATE TABLE public.city_feed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  metadata_json jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.city_feed_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feed" ON public.city_feed_events FOR SELECT TO anon, authenticated USING (true);

-- Realtime para city_feed_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.city_feed_events;
