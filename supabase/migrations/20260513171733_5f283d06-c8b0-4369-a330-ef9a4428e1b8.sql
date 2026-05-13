
-- Drop old signatures
DROP FUNCTION IF EXISTS public.driver_enroll_season(uuid);
DROP FUNCTION IF EXISTS public.driver_list_upcoming_seasons(uuid);

-- 1) driver_enroll_season com p_driver_id explícito
CREATE OR REPLACE FUNCTION public.driver_enroll_season(p_season_id uuid, p_driver_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  -- 0. Identificar o motorista pelo p_driver_id (sessão impersonada — sem auth.uid())
  SELECT * INTO v_customer
    FROM public.customers
   WHERE id = p_driver_id
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

  -- 1b. Garantir que driver pertence à brand da temporada
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_season.brand_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado.');
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

  -- 7. Verificar vagas no menor tier
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

  -- 8. Status conforme enrollment_mode
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
$function$;

REVOKE ALL ON FUNCTION public.driver_enroll_season(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.driver_enroll_season(uuid, uuid) TO authenticated, anon;

-- 2) driver_list_upcoming_seasons com p_driver_id
CREATE OR REPLACE FUNCTION public.driver_list_upcoming_seasons(p_branch_id uuid, p_driver_id uuid)
RETURNS TABLE(season_id uuid, name text, year integer, month integer, enrollment_opens_at timestamp with time zone, enrollment_closes_at timestamp with time zone, entry_fee_cents integer, entry_fee_currency text, tiers_count integer, my_enrollment_status text, prizes_summary jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
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
        AND e.driver_id = p_driver_id
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
$function$;

REVOKE ALL ON FUNCTION public.driver_list_upcoming_seasons(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.driver_list_upcoming_seasons(uuid, uuid) TO authenticated, anon;

-- 3) Nova RPC: driver_get_my_enrollments
CREATE OR REPLACE FUNCTION public.driver_get_my_enrollments(p_driver_id uuid)
RETURNS TABLE(
  id uuid,
  season_id uuid,
  status text,
  tier_id uuid,
  notes text,
  created_at timestamptz,
  season_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = p_driver_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT e.id, e.season_id, e.status, e.tier_id, e.notes, e.created_at, s.name AS season_name
    FROM public.duelo_season_enrollments e
    JOIN public.duelo_seasons s ON s.id = e.season_id
   WHERE e.driver_id = p_driver_id
   ORDER BY e.created_at DESC
   LIMIT 10;
END;
$function$;

REVOKE ALL ON FUNCTION public.driver_get_my_enrollments(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.driver_get_my_enrollments(uuid) TO authenticated, anon;

-- 4) Simplificar policies de duelo_season_enrollments
-- Motorista acessa exclusivamente via RPCs SECURITY DEFINER. Acesso direto fica restrito a admins.
DROP POLICY IF EXISTS dse_insert_self ON public.duelo_season_enrollments;
DROP POLICY IF EXISTS dse_select_self_or_admin ON public.duelo_season_enrollments;

CREATE POLICY dse_admin_select ON public.duelo_season_enrollments
  FOR SELECT USING (public.duelo_admin_can_manage(brand_id));

CREATE POLICY dse_admin_insert ON public.duelo_season_enrollments
  FOR INSERT WITH CHECK (public.duelo_admin_can_manage(brand_id));

COMMENT ON TABLE public.duelo_season_enrollments IS
  'Acesso de motoristas (sessão impersonada) ocorre exclusivamente via RPCs SECURITY DEFINER: driver_enroll_season e driver_get_my_enrollments. RLS direta restrita a administradores.';
