-- =====================================================================
-- CAMPEONATO DUELO MOTORISTA — SÉRIES HIERÁRQUICAS (SUB-FASE C.1)
-- Versão corrigida: respeita duelo_champions e brand_duelo_prizes existentes
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ALTERAÇÕES EM TABELAS EXISTENTES
-- ---------------------------------------------------------------------

ALTER TABLE public.duelo_seasons
  ADD COLUMN IF NOT EXISTS tiers_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS relegation_policy text NOT NULL DEFAULT 'auto_zero',
  ADD COLUMN IF NOT EXISTS tiers_config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tier_seeding_completed_at timestamptz NULL;

ALTER TABLE public.duelo_season_standings
  ADD COLUMN IF NOT EXISTS tier_id uuid NULL,
  ADD COLUMN IF NOT EXISTS position_in_tier integer NULL,
  ADD COLUMN IF NOT EXISTS relegated_auto boolean NOT NULL DEFAULT false;

ALTER TABLE public.duelo_brackets
  ADD COLUMN IF NOT EXISTS tier_id uuid NULL;

-- ---------------------------------------------------------------------
-- 2. NOVAS TABELAS
-- ---------------------------------------------------------------------

-- 2.1 Séries por temporada
CREATE TABLE IF NOT EXISTS public.duelo_season_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.duelo_seasons(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  name text NOT NULL,
  tier_order integer NOT NULL,
  target_size integer NOT NULL DEFAULT 16,
  promotion_count integer NOT NULL DEFAULT 0,
  relegation_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, tier_order),
  UNIQUE (season_id, name)
);

CREATE INDEX IF NOT EXISTS idx_duelo_season_tiers_season ON public.duelo_season_tiers(season_id);
CREATE INDEX IF NOT EXISTS idx_duelo_season_tiers_brand_branch ON public.duelo_season_tiers(brand_id, branch_id);

-- 2.2 Vínculo motorista ↔ série
CREATE TABLE IF NOT EXISTS public.duelo_tier_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.duelo_seasons(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES public.duelo_season_tiers(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'seed',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_duelo_tier_memberships_tier ON public.duelo_tier_memberships(tier_id);
CREATE INDEX IF NOT EXISTS idx_duelo_tier_memberships_driver ON public.duelo_tier_memberships(driver_id);
CREATE INDEX IF NOT EXISTS idx_duelo_tier_memberships_brand_branch ON public.duelo_tier_memberships(brand_id, branch_id);

-- 2.3 Histórico de séries por motorista
CREATE TABLE IF NOT EXISTS public.duelo_driver_tier_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.duelo_seasons(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  starting_tier_id uuid NULL REFERENCES public.duelo_season_tiers(id) ON DELETE SET NULL,
  ending_tier_id uuid NULL REFERENCES public.duelo_season_tiers(id) ON DELETE SET NULL,
  ending_position integer NULL,
  outcome text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_duelo_driver_tier_history_driver ON public.duelo_driver_tier_history(driver_id);
CREATE INDEX IF NOT EXISTS idx_duelo_driver_tier_history_brand_branch ON public.duelo_driver_tier_history(brand_id, branch_id);

-- 2.4 Faixas de prêmio por plano
CREATE TABLE IF NOT EXISTS public.plan_duelo_prize_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text NOT NULL,
  tier_name text NOT NULL,
  position text NOT NULL,
  min_points integer NOT NULL,
  max_points integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_key, tier_name, position)
);

-- 2.5 Prêmio escolhido pelo empreendedor (v2 — por série + posição)
CREATE TABLE IF NOT EXISTS public.brand_duelo_prizes_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  branch_id uuid NULL,
  tier_name text NOT NULL,
  position text NOT NULL,
  points_reward integer NOT NULL,
  updated_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, branch_id, tier_name, position)
);

CREATE INDEX IF NOT EXISTS idx_brand_duelo_prizes_v2_brand ON public.brand_duelo_prizes_v2(brand_id);

-- ---------------------------------------------------------------------
-- 3. BACKFILL — temporadas existentes ganham 1 série "Única"
-- ---------------------------------------------------------------------

DO $$
DECLARE
  v_season RECORD;
  v_tier_id uuid;
BEGIN
  FOR v_season IN
    SELECT s.id, s.brand_id, s.branch_id
    FROM public.duelo_seasons s
    WHERE NOT EXISTS (
      SELECT 1 FROM public.duelo_season_tiers t WHERE t.season_id = s.id
    )
  LOOP
    INSERT INTO public.duelo_season_tiers (
      season_id, brand_id, branch_id, name, tier_order,
      target_size, promotion_count, relegation_count
    )
    VALUES (
      v_season.id, v_season.brand_id, v_season.branch_id, 'Única', 1,
      16, 0, 0
    )
    RETURNING id INTO v_tier_id;

    UPDATE public.duelo_season_standings
       SET tier_id = v_tier_id
     WHERE season_id = v_season.id AND tier_id IS NULL;

    UPDATE public.duelo_brackets
       SET tier_id = v_tier_id
     WHERE season_id = v_season.id AND tier_id IS NULL;

    INSERT INTO public.duelo_driver_tier_history (
      season_id, driver_id, brand_id, branch_id,
      starting_tier_id, ending_tier_id, outcome
    )
    SELECT
      v_season.id, st.driver_id, v_season.brand_id, v_season.branch_id,
      v_tier_id, v_tier_id, 'stayed'
    FROM public.duelo_season_standings st
    WHERE st.season_id = v_season.id AND st.qualified = true
    ON CONFLICT (season_id, driver_id) DO NOTHING;

    UPDATE public.duelo_seasons
       SET tier_seeding_completed_at = COALESCE(tier_seeding_completed_at, now())
     WHERE id = v_season.id;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 4. FK PÓS-BACKFILL
-- ---------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'duelo_season_standings_tier_id_fkey'
  ) THEN
    ALTER TABLE public.duelo_season_standings
      ADD CONSTRAINT duelo_season_standings_tier_id_fkey
      FOREIGN KEY (tier_id) REFERENCES public.duelo_season_tiers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'duelo_brackets_tier_id_fkey'
  ) THEN
    ALTER TABLE public.duelo_brackets
      ADD CONSTRAINT duelo_brackets_tier_id_fkey
      FOREIGN KEY (tier_id) REFERENCES public.duelo_season_tiers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 5. TRIGGERS
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.duelo_validate_tier_config()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.target_size < (NEW.promotion_count + NEW.relegation_count) THEN
    RAISE EXCEPTION 'target_size (%) deve ser >= promotion_count (%) + relegation_count (%)',
      NEW.target_size, NEW.promotion_count, NEW.relegation_count;
  END IF;
  IF NEW.tier_order < 1 THEN
    RAISE EXCEPTION 'tier_order deve ser >= 1';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_duelo_validate_tier_config ON public.duelo_season_tiers;
CREATE TRIGGER trg_duelo_validate_tier_config
  BEFORE INSERT OR UPDATE ON public.duelo_season_tiers
  FOR EACH ROW EXECUTE FUNCTION public.duelo_validate_tier_config();

CREATE OR REPLACE FUNCTION public.duelo_guard_tier_membership_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_allow text;
BEGIN
  IF NEW.source = 'seed' THEN
    BEGIN
      v_allow := current_setting('app.allow_tier_seed', true);
    EXCEPTION WHEN OTHERS THEN
      v_allow := NULL;
    END;
    IF v_allow IS DISTINCT FROM 'on' THEN
      RAISE EXCEPTION 'Inserção em duelo_tier_memberships com source=seed só é permitida via RPC duelo_seed_initial_tier_memberships';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_duelo_guard_tier_membership_insert ON public.duelo_tier_memberships;
CREATE TRIGGER trg_duelo_guard_tier_membership_insert
  BEFORE INSERT ON public.duelo_tier_memberships
  FOR EACH ROW EXECUTE FUNCTION public.duelo_guard_tier_membership_insert();

CREATE OR REPLACE FUNCTION public.duelo_sync_tier_history()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.duelo_driver_tier_history (
    season_id, driver_id, brand_id, branch_id,
    starting_tier_id, ending_tier_id, outcome
  )
  VALUES (
    NEW.season_id, NEW.driver_id, NEW.brand_id, NEW.branch_id,
    NEW.tier_id, NEW.tier_id, 'stayed'
  )
  ON CONFLICT (season_id, driver_id) DO UPDATE
    SET ending_tier_id = EXCLUDED.ending_tier_id,
        updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_duelo_sync_tier_history ON public.duelo_tier_memberships;
CREATE TRIGGER trg_duelo_sync_tier_history
  AFTER INSERT OR UPDATE OF tier_id ON public.duelo_tier_memberships
  FOR EACH ROW EXECUTE FUNCTION public.duelo_sync_tier_history();

CREATE OR REPLACE FUNCTION public.set_updated_at_duelo_tiers()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_brand_duelo_prizes_v2_updated_at ON public.brand_duelo_prizes_v2;
CREATE TRIGGER trg_brand_duelo_prizes_v2_updated_at
  BEFORE UPDATE ON public.brand_duelo_prizes_v2
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_duelo_tiers();

DROP TRIGGER IF EXISTS trg_plan_duelo_prize_ranges_updated_at ON public.plan_duelo_prize_ranges;
CREATE TRIGGER trg_plan_duelo_prize_ranges_updated_at
  BEFORE UPDATE ON public.plan_duelo_prize_ranges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_duelo_tiers();

DROP TRIGGER IF EXISTS trg_duelo_driver_tier_history_updated_at ON public.duelo_driver_tier_history;
CREATE TRIGGER trg_duelo_driver_tier_history_updated_at
  BEFORE UPDATE ON public.duelo_driver_tier_history
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_duelo_tiers();

-- ---------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------

ALTER TABLE public.duelo_season_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duelo_tier_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duelo_driver_tier_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_duelo_prize_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_duelo_prizes_v2 ENABLE ROW LEVEL SECURITY;

-- duelo_season_tiers
CREATE POLICY "duelo_season_tiers_root_all"
  ON public.duelo_season_tiers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "duelo_season_tiers_brand_admin_all"
  ON public.duelo_season_tiers FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())))
  WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE POLICY "duelo_season_tiers_branch_admin_select"
  ON public.duelo_season_tiers FOR SELECT TO authenticated
  USING (branch_id IN (SELECT public.get_user_branch_ids(auth.uid())));

CREATE POLICY "duelo_season_tiers_public_read"
  ON public.duelo_season_tiers FOR SELECT TO anon, authenticated
  USING (true);

-- duelo_tier_memberships
CREATE POLICY "duelo_tier_memberships_root_all"
  ON public.duelo_tier_memberships FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "duelo_tier_memberships_brand_admin_all"
  ON public.duelo_tier_memberships FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())))
  WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE POLICY "duelo_tier_memberships_branch_admin_select"
  ON public.duelo_tier_memberships FOR SELECT TO authenticated
  USING (branch_id IN (SELECT public.get_user_branch_ids(auth.uid())));

CREATE POLICY "duelo_tier_memberships_public_read"
  ON public.duelo_tier_memberships FOR SELECT TO anon, authenticated
  USING (true);

-- duelo_driver_tier_history
CREATE POLICY "duelo_driver_tier_history_root_all"
  ON public.duelo_driver_tier_history FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "duelo_driver_tier_history_brand_admin_all"
  ON public.duelo_driver_tier_history FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())))
  WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE POLICY "duelo_driver_tier_history_public_read"
  ON public.duelo_driver_tier_history FOR SELECT TO anon, authenticated
  USING (true);

-- plan_duelo_prize_ranges (Root gerencia, todos leem)
CREATE POLICY "plan_duelo_prize_ranges_root_all"
  ON public.plan_duelo_prize_ranges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "plan_duelo_prize_ranges_public_read"
  ON public.plan_duelo_prize_ranges FOR SELECT TO anon, authenticated
  USING (true);

-- brand_duelo_prizes_v2
CREATE POLICY "brand_duelo_prizes_v2_root_all"
  ON public.brand_duelo_prizes_v2 FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "brand_duelo_prizes_v2_brand_admin_all"
  ON public.brand_duelo_prizes_v2 FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())))
  WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE POLICY "brand_duelo_prizes_v2_branch_admin_select"
  ON public.brand_duelo_prizes_v2 FOR SELECT TO authenticated
  USING (branch_id IS NULL OR branch_id IN (SELECT public.get_user_branch_ids(auth.uid())));

CREATE POLICY "brand_duelo_prizes_v2_public_read"
  ON public.brand_duelo_prizes_v2 FOR SELECT TO anon, authenticated
  USING (true);

-- ---------------------------------------------------------------------
-- 7. RPC: SEED INICIAL DE MOTORISTAS NAS SÉRIES
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.duelo_seed_initial_tier_memberships(
  p_season_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_branch_id uuid;
  v_already_seeded timestamptz;
  v_prior_seeded_count integer;
  v_seeded_count integer := 0;
  v_low_overflow_count integer := 0;
  v_by_tier jsonb := '{}'::jsonb;
  v_low_tier_id uuid;
BEGIN
  SELECT brand_id, branch_id, tier_seeding_completed_at
    INTO v_brand_id, v_branch_id, v_already_seeded
  FROM public.duelo_seasons
  WHERE id = p_season_id;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Temporada % não encontrada', p_season_id;
  END IF;

  IF NOT (
    public.has_role(auth.uid(), 'root_admin')
    OR v_brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
    OR v_branch_id IN (SELECT public.get_user_branch_ids(auth.uid()))
  ) THEN
    RAISE EXCEPTION 'Sem permissão para semear esta temporada';
  END IF;

  IF v_already_seeded IS NOT NULL THEN
    RAISE EXCEPTION 'Esta temporada já foi semeada em %', v_already_seeded;
  END IF;

  SELECT COUNT(*) INTO v_prior_seeded_count
  FROM public.duelo_seasons
  WHERE branch_id = v_branch_id
    AND id <> p_season_id
    AND tier_seeding_completed_at IS NOT NULL;

  IF v_prior_seeded_count > 0 THEN
    RAISE EXCEPTION 'A cidade % já tem temporada anterior semeada — use promoção/rebaixamento, não re-seed', v_branch_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.duelo_season_tiers WHERE season_id = p_season_id) THEN
    RAISE EXCEPTION 'Temporada % não tem séries (duelo_season_tiers) configuradas', p_season_id;
  END IF;

  SELECT id INTO v_low_tier_id
  FROM public.duelo_season_tiers
  WHERE season_id = p_season_id
  ORDER BY tier_order DESC
  LIMIT 1;

  PERFORM set_config('app.allow_tier_seed', 'on', true);

  WITH elegiveis AS (
    SELECT id AS driver_id, created_at
    FROM public.customers
    WHERE brand_id  = v_brand_id
      AND branch_id = v_branch_id
      AND is_active = true
      AND name ILIKE '%[MOTORISTA]%'
  ),
  metricas_90d AS (
    SELECT
      e.driver_id,
      e.created_at,
      COUNT(r.id)                       AS rides_90d,
      COALESCE(SUM(r.ride_value), 0)    AS total_value_90d,
      MAX(r.finalized_at)               AS last_finalized_at,
      COUNT(*) FILTER (
        WHERE r.finalized_at >= now() - interval '30 days'
      )                                 AS rides_30d
    FROM elegiveis e
    LEFT JOIN public.machine_rides r
      ON r.driver_customer_id = e.driver_id
     AND r.branch_id          = v_branch_id
     AND r.ride_status        = 'FINALIZED'
     AND r.finalized_at       >= now() - interval '90 days'
    GROUP BY e.driver_id, e.created_at
  ),
  ranqueados AS (
    SELECT
      m.driver_id,
      m.created_at,
      m.rides_90d,
      m.total_value_90d,
      m.last_finalized_at,
      (now() - m.created_at < interval '30 days') AS is_novo,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE WHEN now() - m.created_at < interval '30 days' THEN 1 ELSE 0 END ASC,
          m.rides_90d         DESC,
          m.total_value_90d   DESC,
          m.last_finalized_at DESC NULLS LAST,
          m.created_at        ASC
      ) AS rn
    FROM metricas_90d m
    WHERE m.rides_30d >= 1
       OR now() - m.created_at < interval '30 days'
  ),
  tiers_ord AS (
    SELECT
      id AS tier_id,
      tier_order,
      target_size,
      SUM(target_size) OVER (ORDER BY tier_order) AS cumul_top
    FROM public.duelo_season_tiers
    WHERE season_id = p_season_id
  ),
  alocacao AS (
    SELECT
      r.driver_id,
      r.is_novo,
      CASE
        WHEN r.is_novo THEN v_low_tier_id
        ELSE COALESCE(
          (SELECT t.tier_id FROM tiers_ord t WHERE r.rn <= t.cumul_top ORDER BY t.tier_order LIMIT 1),
          v_low_tier_id
        )
      END AS tier_id
    FROM ranqueados r
  ),
  inserted AS (
    INSERT INTO public.duelo_tier_memberships (
      season_id, tier_id, driver_id, brand_id, branch_id, source
    )
    SELECT p_season_id, a.tier_id, a.driver_id, v_brand_id, v_branch_id, 'seed'
    FROM alocacao a
    WHERE a.tier_id IS NOT NULL
    ON CONFLICT (season_id, driver_id) DO NOTHING
    RETURNING tier_id, driver_id
  ),
  agg AS (
    SELECT
      i.tier_id,
      t.name AS tier_name,
      COUNT(*) AS cnt,
      SUM(CASE WHEN a.is_novo AND i.tier_id = v_low_tier_id THEN 1 ELSE 0 END) AS overflow
    FROM inserted i
    JOIN alocacao a ON a.driver_id = i.driver_id
    JOIN public.duelo_season_tiers t ON t.id = i.tier_id
    GROUP BY i.tier_id, t.name
  )
  SELECT
    COALESCE(SUM(cnt), 0)::int,
    COALESCE(SUM(overflow), 0)::int,
    COALESCE(jsonb_object_agg(tier_name, cnt), '{}'::jsonb)
  INTO v_seeded_count, v_low_overflow_count, v_by_tier
  FROM agg;

  UPDATE public.duelo_seasons
     SET tier_seeding_completed_at = now()
   WHERE id = p_season_id;

  RETURN jsonb_build_object(
    'season_id', p_season_id,
    'seeded_count', COALESCE(v_seeded_count, 0),
    'low_tier_overflow_count', COALESCE(v_low_overflow_count, 0),
    'by_tier', COALESCE(v_by_tier, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.duelo_seed_initial_tier_memberships(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.duelo_seed_initial_tier_memberships(uuid) TO authenticated;