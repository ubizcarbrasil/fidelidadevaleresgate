-- =====================================================================
-- CAMPEONATO DUELO MOTORISTA — Sub-fase C.1
-- Schema (7 tabelas), RLS multi-tenant e seed de plan_duelo_prize_ranges
-- =====================================================================

-- 1. duelo_seasons -----------------------------------------------------
CREATE TABLE public.duelo_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  phase text NOT NULL DEFAULT 'classification'
    CHECK (phase IN ('classification','knockout_r16','knockout_qf','knockout_sf','knockout_final','finished')),
  classification_starts_at timestamptz NOT NULL,
  classification_ends_at   timestamptz NOT NULL,
  knockout_starts_at       timestamptz NOT NULL,
  knockout_ends_at         timestamptz NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, branch_id, year, month)
);
CREATE INDEX idx_duelo_seasons_brand_branch_period
  ON public.duelo_seasons (brand_id, branch_id, year DESC, month DESC);
CREATE TRIGGER trg_duelo_seasons_updated_at
  BEFORE UPDATE ON public.duelo_seasons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. duelo_season_standings -------------------------------------------
CREATE TABLE public.duelo_season_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.duelo_seasons(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  points int NOT NULL DEFAULT 0,
  five_star_count int NOT NULL DEFAULT 0,
  last_ride_at timestamptz,
  position int,
  qualified boolean NOT NULL DEFAULT false,
  UNIQUE (season_id, driver_id)
);
CREATE INDEX idx_duelo_standings_ranking
  ON public.duelo_season_standings (season_id, points DESC, five_star_count DESC, last_ride_at ASC);

-- 3. duelo_brackets ----------------------------------------------------
CREATE TABLE public.duelo_brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.duelo_seasons(id) ON DELETE CASCADE,
  round text NOT NULL CHECK (round IN ('r16','qf','sf','final')),
  slot int NOT NULL,
  driver_a_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  driver_b_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  driver_a_rides int NOT NULL DEFAULT 0,
  driver_b_rides int NOT NULL DEFAULT 0,
  winner_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at   timestamptz NOT NULL,
  UNIQUE (season_id, round, slot)
);
CREATE INDEX idx_duelo_brackets_season_round
  ON public.duelo_brackets (season_id, round);

-- 4. duelo_match_events -----------------------------------------------
CREATE TABLE public.duelo_match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id uuid NOT NULL REFERENCES public.duelo_brackets(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'ride_completed',
  event_ref_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_duelo_match_events_bracket_driver
  ON public.duelo_match_events (bracket_id, driver_id);

-- 5. plan_duelo_prize_ranges ------------------------------------------
CREATE TABLE public.plan_duelo_prize_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text NOT NULL,
  position text NOT NULL CHECK (position IN ('champion','runner_up','semifinalist','quarterfinalist','r16')),
  min_points int NOT NULL CHECK (min_points >= 0),
  max_points int NOT NULL CHECK (max_points >= min_points),
  UNIQUE (plan_key, position)
);

-- 6. brand_duelo_prizes -----------------------------------------------
CREATE TABLE public.brand_duelo_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  position text NOT NULL CHECK (position IN ('champion','runner_up','semifinalist','quarterfinalist','r16')),
  points_reward int NOT NULL CHECK (points_reward >= 0),
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, position)
);
CREATE INDEX idx_brand_duelo_prizes_brand ON public.brand_duelo_prizes (brand_id);

-- 7. duelo_champions --------------------------------------------------
CREATE TABLE public.duelo_champions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL UNIQUE REFERENCES public.duelo_seasons(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  champion_driver_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  runner_up_driver_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  semifinalist_ids uuid[] NOT NULL DEFAULT '{}',
  quarterfinalist_ids uuid[] NOT NULL DEFAULT '{}',
  r16_ids uuid[] NOT NULL DEFAULT '{}',
  prizes_distributed boolean NOT NULL DEFAULT false,
  finalized_at timestamptz
);
CREATE INDEX idx_duelo_champions_brand_branch ON public.duelo_champions (brand_id, branch_id);

-- =====================================================================
-- RLS
-- =====================================================================
ALTER TABLE public.duelo_seasons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duelo_season_standings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duelo_brackets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duelo_match_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_duelo_prize_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_duelo_prizes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duelo_champions         ENABLE ROW LEVEL SECURITY;

-- ---- duelo_seasons ----
CREATE POLICY "duelo_seasons_select_scope" ON public.duelo_seasons FOR SELECT TO authenticated
USING (
  has_role(auth.uid(),'root_admin'::app_role)
  OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
  OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
);
CREATE POLICY "duelo_seasons_root_all" ON public.duelo_seasons FOR ALL TO authenticated
USING (has_role(auth.uid(),'root_admin'::app_role))
WITH CHECK (has_role(auth.uid(),'root_admin'::app_role));
CREATE POLICY "duelo_seasons_brand_admin" ON public.duelo_seasons FOR ALL TO authenticated
USING (brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'::app_role))
WITH CHECK (brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'::app_role));
CREATE POLICY "duelo_seasons_branch_admin" ON public.duelo_seasons FOR ALL TO authenticated
USING (branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(),'branch_admin'::app_role))
WITH CHECK (branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(),'branch_admin'::app_role));

-- ---- duelo_season_standings ----
CREATE POLICY "duelo_standings_select_scope" ON public.duelo_season_standings FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.duelo_seasons s WHERE s.id = season_id AND (
    has_role(auth.uid(),'root_admin'::app_role)
    OR s.brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR s.branch_id IN (SELECT get_user_branch_ids(auth.uid()))
  )
));
CREATE POLICY "duelo_standings_admin_write" ON public.duelo_season_standings FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.duelo_seasons s WHERE s.id = season_id AND (
    has_role(auth.uid(),'root_admin'::app_role)
    OR (s.brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'::app_role))
    OR (s.branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(),'branch_admin'::app_role))
  )
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.duelo_seasons s WHERE s.id = season_id AND (
    has_role(auth.uid(),'root_admin'::app_role)
    OR (s.brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'::app_role))
    OR (s.branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(),'branch_admin'::app_role))
  )
));

-- ---- duelo_brackets ----
CREATE POLICY "duelo_brackets_select_scope" ON public.duelo_brackets FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.duelo_seasons s WHERE s.id = season_id AND (
    has_role(auth.uid(),'root_admin'::app_role)
    OR s.brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR s.branch_id IN (SELECT get_user_branch_ids(auth.uid()))
  )
));
CREATE POLICY "duelo_brackets_admin_write" ON public.duelo_brackets FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.duelo_seasons s WHERE s.id = season_id AND (
    has_role(auth.uid(),'root_admin'::app_role)
    OR (s.brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'::app_role))
    OR (s.branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(),'branch_admin'::app_role))
  )
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.duelo_seasons s WHERE s.id = season_id AND (
    has_role(auth.uid(),'root_admin'::app_role)
    OR (s.brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'::app_role))
    OR (s.branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(),'branch_admin'::app_role))
  )
));

-- ---- duelo_match_events ----
CREATE POLICY "duelo_match_events_select_scope" ON public.duelo_match_events FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.duelo_brackets b
  JOIN public.duelo_seasons s ON s.id = b.season_id
  WHERE b.id = bracket_id AND (
    has_role(auth.uid(),'root_admin'::app_role)
    OR s.brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR s.branch_id IN (SELECT get_user_branch_ids(auth.uid()))
  )
));
CREATE POLICY "duelo_match_events_admin_write" ON public.duelo_match_events FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.duelo_brackets b
  JOIN public.duelo_seasons s ON s.id = b.season_id
  WHERE b.id = bracket_id AND (
    has_role(auth.uid(),'root_admin'::app_role)
    OR (s.brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'::app_role))
    OR (s.branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(),'branch_admin'::app_role))
  )
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.duelo_brackets b
  JOIN public.duelo_seasons s ON s.id = b.season_id
  WHERE b.id = bracket_id AND (
    has_role(auth.uid(),'root_admin'::app_role)
    OR (s.brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'::app_role))
    OR (s.branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(),'branch_admin'::app_role))
  )
));

-- ---- duelo_champions ----
CREATE POLICY "duelo_champions_select_scope" ON public.duelo_champions FOR SELECT TO authenticated
USING (
  has_role(auth.uid(),'root_admin'::app_role)
  OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
  OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
);
CREATE POLICY "duelo_champions_admin_write" ON public.duelo_champions FOR ALL TO authenticated
USING (
  has_role(auth.uid(),'root_admin'::app_role)
  OR (brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'::app_role))
  OR (branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(),'branch_admin'::app_role))
)
WITH CHECK (
  has_role(auth.uid(),'root_admin'::app_role)
  OR (brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'::app_role))
  OR (branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(),'branch_admin'::app_role))
);

-- ---- plan_duelo_prize_ranges ----
CREATE POLICY "plan_duelo_prize_ranges_select_all" ON public.plan_duelo_prize_ranges FOR SELECT TO authenticated USING (true);
CREATE POLICY "plan_duelo_prize_ranges_root_only" ON public.plan_duelo_prize_ranges FOR ALL TO authenticated
USING (has_role(auth.uid(),'root_admin'::app_role))
WITH CHECK (has_role(auth.uid(),'root_admin'::app_role));

-- ---- brand_duelo_prizes ----
CREATE POLICY "brand_duelo_prizes_select_scope" ON public.brand_duelo_prizes FOR SELECT TO authenticated
USING (has_role(auth.uid(),'root_admin'::app_role) OR brand_id IN (SELECT get_user_brand_ids(auth.uid())));
CREATE POLICY "brand_duelo_prizes_root_all" ON public.brand_duelo_prizes FOR ALL TO authenticated
USING (has_role(auth.uid(),'root_admin'::app_role))
WITH CHECK (has_role(auth.uid(),'root_admin'::app_role));
CREATE POLICY "brand_duelo_prizes_brand_admin" ON public.brand_duelo_prizes FOR ALL TO authenticated
USING (brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'::app_role))
WITH CHECK (brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'::app_role));

-- =====================================================================
-- SEED — plan_duelo_prize_ranges (4 planos × 5 posições = 20 linhas)
-- =====================================================================
INSERT INTO public.plan_duelo_prize_ranges (plan_key, position, min_points, max_points) VALUES
  ('free','champion',1000,5000),
  ('starter','champion',3000,15000),
  ('profissional','champion',5000,30000),
  ('enterprise','champion',10000,100000),
  ('free','runner_up',500,2500),
  ('starter','runner_up',1500,7500),
  ('profissional','runner_up',2500,15000),
  ('enterprise','runner_up',5000,50000),
  ('free','semifinalist',250,1250),
  ('starter','semifinalist',750,3750),
  ('profissional','semifinalist',1250,7500),
  ('enterprise','semifinalist',2500,25000),
  ('free','quarterfinalist',100,500),
  ('starter','quarterfinalist',300,1500),
  ('profissional','quarterfinalist',500,3000),
  ('enterprise','quarterfinalist',1000,10000),
  ('free','r16',30,150),
  ('starter','r16',100,500),
  ('profissional','r16',170,1000),
  ('enterprise','r16',350,3000);

-- ROLLBACK (ordem reversa de FK):
-- DROP TABLE IF EXISTS public.duelo_champions;
-- DROP TABLE IF EXISTS public.brand_duelo_prizes;
-- DROP TABLE IF EXISTS public.plan_duelo_prize_ranges;
-- DROP TABLE IF EXISTS public.duelo_match_events;
-- DROP TABLE IF EXISTS public.duelo_brackets;
-- DROP TABLE IF EXISTS public.duelo_season_standings;
-- DROP TABLE IF EXISTS public.duelo_seasons;