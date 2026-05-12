
-- ============================================================================
-- Etapa 1 — Backend / Schema do Campeonato (inscrições, prêmios por temporada,
-- duração de fases mata-mata, foto do motorista, vagas dinâmicas).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- BLOCO 1 — Novas colunas em duelo_seasons
-- ---------------------------------------------------------------------------
ALTER TABLE public.duelo_seasons
  ADD COLUMN IF NOT EXISTS enrollment_mode      TEXT NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS entry_fee_cents      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entry_fee_currency   TEXT NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS enrollment_opens_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS enrollment_closes_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS default_match_hours  INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS published_at         TIMESTAMPTZ DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'duelo_seasons_enrollment_mode_chk') THEN
    ALTER TABLE public.duelo_seasons
      ADD CONSTRAINT duelo_seasons_enrollment_mode_chk
      CHECK (enrollment_mode IN ('auto','manual'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'duelo_seasons_entry_fee_chk') THEN
    ALTER TABLE public.duelo_seasons
      ADD CONSTRAINT duelo_seasons_entry_fee_chk CHECK (entry_fee_cents >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'duelo_seasons_default_match_hours_chk') THEN
    ALTER TABLE public.duelo_seasons
      ADD CONSTRAINT duelo_seasons_default_match_hours_chk CHECK (default_match_hours > 0);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- BLOCO 2 — duelo_season_phase_config
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.duelo_season_phase_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id       UUID NOT NULL REFERENCES public.duelo_seasons(id) ON DELETE CASCADE,
  phase           TEXT NOT NULL CHECK (phase IN ('R16','QF','SF','Final')),
  duration_hours  INTEGER NOT NULL DEFAULT 24 CHECK (duration_hours > 0),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (season_id, phase)
);

ALTER TABLE public.duelo_season_phase_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS phase_config_select ON public.duelo_season_phase_config;
CREATE POLICY phase_config_select ON public.duelo_season_phase_config
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

DROP POLICY IF EXISTS phase_config_admin_write ON public.duelo_season_phase_config;
CREATE POLICY phase_config_admin_write ON public.duelo_season_phase_config
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.duelo_seasons s WHERE s.id = season_id AND public.duelo_admin_can_manage(s.brand_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.duelo_seasons s WHERE s.id = season_id AND public.duelo_admin_can_manage(s.brand_id)));

-- ---------------------------------------------------------------------------
-- BLOCO 3 — duelo_season_prizes (complementa brand_duelo_prizes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.duelo_season_prizes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id    UUID NOT NULL REFERENCES public.duelo_seasons(id) ON DELETE CASCADE,
  tier_id      UUID REFERENCES public.duelo_season_tiers(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL CHECK (position > 0),
  prize_kind   TEXT NOT NULL DEFAULT 'points' CHECK (prize_kind IN ('points','money','item')),
  prize_value  NUMERIC NOT NULL DEFAULT 0 CHECK (prize_value >= 0),
  description  TEXT DEFAULT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (season_id, tier_id, position)
);

CREATE INDEX IF NOT EXISTS idx_duelo_season_prizes_season ON public.duelo_season_prizes(season_id);

ALTER TABLE public.duelo_season_prizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS season_prizes_select ON public.duelo_season_prizes;
CREATE POLICY season_prizes_select ON public.duelo_season_prizes
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

DROP POLICY IF EXISTS season_prizes_admin_write ON public.duelo_season_prizes;
CREATE POLICY season_prizes_admin_write ON public.duelo_season_prizes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.duelo_seasons s WHERE s.id = season_id AND public.duelo_admin_can_manage(s.brand_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.duelo_seasons s WHERE s.id = season_id AND public.duelo_admin_can_manage(s.brand_id)));

-- ---------------------------------------------------------------------------
-- BLOCO 4 — photo_url em customers e driver_profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.customers        ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT NULL;
ALTER TABLE public.driver_profiles  ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT NULL;

-- ---------------------------------------------------------------------------
-- BLOCO 5 — duelo_season_enrollments
-- NOTA: driver_id refere customers.id (padrão do domínio duelo, ver
-- driver_belongs_to_brand). Sem FK rígida para portabilidade entre branches.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.duelo_season_enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id   UUID NOT NULL REFERENCES public.duelo_seasons(id) ON DELETE CASCADE,
  driver_id   UUID NOT NULL,
  brand_id    UUID NOT NULL,
  branch_id   UUID NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  tier_id     UUID REFERENCES public.duelo_season_tiers(id) ON DELETE SET NULL,
  notes       TEXT DEFAULT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (season_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_dse_season_status ON public.duelo_season_enrollments(season_id, status);
CREATE INDEX IF NOT EXISTS idx_dse_driver        ON public.duelo_season_enrollments(driver_id);
CREATE INDEX IF NOT EXISTS idx_dse_brand_branch  ON public.duelo_season_enrollments(brand_id, branch_id);

DROP TRIGGER IF EXISTS trg_dse_updated_at ON public.duelo_season_enrollments;
CREATE TRIGGER trg_dse_updated_at
  BEFORE UPDATE ON public.duelo_season_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.duelo_season_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dse_select_self_or_admin ON public.duelo_season_enrollments;
CREATE POLICY dse_select_self_or_admin ON public.duelo_season_enrollments
  FOR SELECT TO authenticated USING (
    public.duelo_admin_can_manage(brand_id)
    OR driver_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS dse_insert_self ON public.duelo_season_enrollments;
CREATE POLICY dse_insert_self ON public.duelo_season_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.duelo_admin_can_manage(brand_id)
    OR driver_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS dse_admin_update ON public.duelo_season_enrollments;
CREATE POLICY dse_admin_update ON public.duelo_season_enrollments
  FOR UPDATE TO authenticated
  USING (public.duelo_admin_can_manage(brand_id))
  WITH CHECK (public.duelo_admin_can_manage(brand_id));

DROP POLICY IF EXISTS dse_admin_delete ON public.duelo_season_enrollments;
CREATE POLICY dse_admin_delete ON public.duelo_season_enrollments
  FOR DELETE TO authenticated
  USING (public.duelo_admin_can_manage(brand_id));

-- ---------------------------------------------------------------------------
-- BLOCO 6 — RPC driver_enroll_season
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.driver_enroll_season(p_season_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer       public.customers%ROWTYPE;
  v_season         public.duelo_seasons%ROWTYPE;
  v_photo          TEXT;
  v_existing       UUID;
  v_tier_id        UUID;
  v_tier_target    INTEGER;
  v_tier_active    INTEGER;
  v_status         TEXT;
  v_enrollment_id  UUID;
BEGIN
  -- 0. Identificar o motorista logado
  SELECT * INTO v_customer
    FROM public.customers
   WHERE user_id = auth.uid()
   LIMIT 1;
  IF v_customer.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Motorista não encontrado.');
  END IF;

  -- 1. Carregar a temporada e validar branch/brand
  SELECT * INTO v_season
    FROM public.duelo_seasons
   WHERE id = p_season_id
     AND brand_id  = v_customer.brand_id
     AND branch_id = v_customer.branch_id;
  IF v_season.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Campeonato não disponível para a sua cidade.');
  END IF;

  -- 2. Publicada?
  IF v_season.published_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este campeonato ainda não foi publicado.');
  END IF;

  -- 3. Janela de inscrição
  IF v_season.enrollment_opens_at IS NULL OR v_season.enrollment_closes_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Período de inscrição não configurado.');
  END IF;
  IF NOW() < v_season.enrollment_opens_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'As inscrições ainda não foram abertas.');
  END IF;
  IF NOW() > v_season.enrollment_closes_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'O período de inscrição encerrou.');
  END IF;

  -- 4. Taxa: somente grátis nesta etapa
  IF v_season.entry_fee_cents > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Inscrições pagas ainda não estão disponíveis.');
  END IF;

  -- 5. Já inscrito?
  SELECT id INTO v_existing
    FROM public.duelo_season_enrollments
   WHERE season_id = p_season_id
     AND driver_id = v_customer.id
   LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já está inscrito neste campeonato.');
  END IF;

  -- 6. Foto obrigatória (em customers OU driver_profiles)
  SELECT COALESCE(
           NULLIF(v_customer.photo_url, ''),
           NULLIF((SELECT photo_url FROM public.driver_profiles WHERE customer_id = v_customer.id), '')
         )
    INTO v_photo;
  IF v_photo IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Envie sua foto de perfil para participar do campeonato.');
  END IF;

  -- 7. Verificar vagas no menor tier (entrada padrão = série mais baixa)
  SELECT id, target_size INTO v_tier_id, v_tier_target
    FROM public.duelo_season_tiers
   WHERE season_id = p_season_id
   ORDER BY tier_order DESC
   LIMIT 1;
  IF v_tier_id IS NOT NULL AND v_tier_target IS NOT NULL THEN
    SELECT COUNT(*) INTO v_tier_active
      FROM public.duelo_season_enrollments
     WHERE season_id = p_season_id
       AND tier_id   = v_tier_id
       AND status   <> 'rejected';
    IF v_tier_active >= v_tier_target THEN
      RETURN jsonb_build_object('success', false, 'error', 'A série de entrada está sem vagas disponíveis.');
    END IF;
  END IF;

  -- 8. Definir status conforme enrollment_mode
  v_status := CASE WHEN v_season.enrollment_mode = 'auto' THEN 'approved' ELSE 'pending' END;

  INSERT INTO public.duelo_season_enrollments
    (season_id, driver_id, brand_id, branch_id, status, tier_id)
  VALUES
    (p_season_id, v_customer.id, v_customer.brand_id, v_customer.branch_id, v_status, v_tier_id)
  RETURNING id INTO v_enrollment_id;

  RETURN jsonb_build_object(
    'success',       true,
    'status',        v_status,
    'enrollment_id', v_enrollment_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.driver_enroll_season(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.driver_enroll_season(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- BLOCO 7 — RPC driver_list_upcoming_seasons
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.driver_list_upcoming_seasons(p_branch_id UUID)
RETURNS TABLE (
  season_id            UUID,
  name                 TEXT,
  year                 INTEGER,
  month                INTEGER,
  enrollment_opens_at  TIMESTAMPTZ,
  enrollment_closes_at TIMESTAMPTZ,
  entry_fee_cents      INTEGER,
  entry_fee_currency   TEXT,
  tiers_count          INTEGER,
  my_enrollment_status TEXT,
  prizes_summary       JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  SELECT id INTO v_customer_id
    FROM public.customers
   WHERE user_id = auth.uid()
     AND branch_id = p_branch_id
   LIMIT 1;

  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.year,
    s.month,
    s.enrollment_opens_at,
    s.enrollment_closes_at,
    s.entry_fee_cents,
    s.entry_fee_currency,
    s.tiers_count,
    (SELECT e.status
       FROM public.duelo_season_enrollments e
      WHERE e.season_id = s.id
        AND e.driver_id = v_customer_id
      LIMIT 1) AS my_enrollment_status,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'position',    p.position,
               'prize_kind',  p.prize_kind,
               'prize_value', p.prize_value,
               'description', p.description
             ) ORDER BY p.position)
        FROM (
          SELECT p2.position, p2.prize_kind, p2.prize_value, p2.description
            FROM public.duelo_season_prizes p2
            JOIN public.duelo_season_tiers t ON t.id = p2.tier_id
           WHERE p2.season_id = s.id
             AND t.tier_order = (
                   SELECT MIN(t2.tier_order)
                     FROM public.duelo_season_tiers t2
                    WHERE t2.season_id = s.id
                 )
           ORDER BY p2.position
           LIMIT 3
        ) p
    ), '[]'::jsonb) AS prizes_summary
  FROM public.duelo_seasons s
  WHERE s.branch_id = p_branch_id
    AND s.published_at IS NOT NULL
    AND s.classification_starts_at > NOW()
  ORDER BY s.classification_starts_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.driver_list_upcoming_seasons(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.driver_list_upcoming_seasons(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- BLOCO 8 — RPC driver_get_top_riders
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.driver_get_top_riders(p_season_id UUID, p_window TEXT)
RETURNS TABLE (
  rank         INTEGER,
  driver_id    UUID,
  driver_name  TEXT,
  photo_url    TEXT,
  total_rides  INTEGER,
  has_prize    BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interval INTERVAL;
  v_brand_id UUID;
  v_branch_id UUID;
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
    EXISTS (
      SELECT 1 FROM public.duelo_season_prizes pr
       WHERE pr.season_id = p_season_id
         AND pr.position  = r.rank
    ) AS has_prize
  FROM ranqueado r
  LEFT JOIN public.customers cu       ON cu.id = r.driver_id
  LEFT JOIN public.driver_profiles dp ON dp.customer_id = r.driver_id
  ORDER BY r.rank;
END;
$$;

REVOKE ALL ON FUNCTION public.driver_get_top_riders(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.driver_get_top_riders(UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- BLOCO 9 — Guard de capacidade em duelo_season_tiers.target_size
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._campeonato_check_tier_capacity(p_tier_id UUID, p_new_target INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(*) FROM public.duelo_season_enrollments
     WHERE tier_id = p_tier_id AND status = 'approved'
  ) <= p_new_target;
$$;

REVOKE ALL ON FUNCTION public._campeonato_check_tier_capacity(UUID, INTEGER) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._campeonato_guard_tier_target_size()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.target_size IS DISTINCT FROM OLD.target_size THEN
    IF NOT public._campeonato_check_tier_capacity(NEW.id, NEW.target_size) THEN
      RAISE EXCEPTION 'Não é possível reduzir vagas abaixo do número de motoristas já aprovados.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_campeonato_guard_tier_target_size ON public.duelo_season_tiers;
CREATE TRIGGER trg_campeonato_guard_tier_target_size
  BEFORE UPDATE ON public.duelo_season_tiers
  FOR EACH ROW EXECUTE FUNCTION public._campeonato_guard_tier_target_size();

-- ============================================================================
-- CRIADO NESTA MIGRATION:
-- [x] duelo_seasons: 7 colunas novas (enrollment_mode, entry_fee_cents,
--     entry_fee_currency, enrollment_opens_at, enrollment_closes_at,
--     default_match_hours, published_at) + CHECK constraints
-- [x] duelo_season_phase_config (nova tabela + RLS leitura brand/branch + write admin)
-- [x] duelo_season_prizes (nova tabela + RLS leitura brand/branch + write admin)
-- [x] customers.photo_url (nova coluna)
-- [x] driver_profiles.photo_url (nova coluna)
-- [x] duelo_season_enrollments (nova tabela + RLS self/admin + trigger updated_at)
-- [x] RPC driver_enroll_season (SECURITY DEFINER, REVOKE public, GRANT authenticated)
-- [x] RPC driver_list_upcoming_seasons (SECURITY DEFINER, REVOKE public, GRANT authenticated)
-- [x] RPC driver_get_top_riders (SECURITY DEFINER, REVOKE public, GRANT authenticated)
-- [x] Trigger _campeonato_guard_tier_target_size em duelo_season_tiers
--     (usa _campeonato_check_tier_capacity)
-- ============================================================================
