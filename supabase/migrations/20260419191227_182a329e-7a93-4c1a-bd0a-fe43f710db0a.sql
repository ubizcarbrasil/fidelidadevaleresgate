-- Índice para ranges arbitrários de data por brand
CREATE INDEX IF NOT EXISTS idx_gg_billing_brand_created
  ON public.ganha_ganha_billing_events (brand_id, created_at DESC);

-- ============================================================
-- 1) rpc_gg_report_summary
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_gg_report_summary(
  p_brand_id uuid,
  p_period_start date,
  p_period_end date,
  p_store_id uuid DEFAULT NULL,
  p_branch_id uuid DEFAULT NULL
)
RETURNS TABLE (
  total_earn_pts bigint,
  total_redeem_pts bigint,
  total_earn_fee numeric,
  total_redeem_fee numeric,
  total_fee numeric,
  n_events bigint,
  n_stores bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    has_role(auth.uid(),'root_admin'::app_role)
    OR (p_brand_id IS NOT NULL AND p_brand_id IN (SELECT get_user_brand_ids(auth.uid())))
    OR (p_store_id IS NOT NULL AND p_store_id IN (SELECT id FROM stores WHERE owner_user_id = auth.uid()))
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN bge.event_type='EARN' THEN bge.points_amount END),0)::bigint,
    COALESCE(SUM(CASE WHEN bge.event_type='REDEEM' THEN bge.points_amount END),0)::bigint,
    COALESCE(SUM(CASE WHEN bge.event_type='EARN' THEN bge.fee_total END),0)::numeric,
    COALESCE(SUM(CASE WHEN bge.event_type='REDEEM' THEN bge.fee_total END),0)::numeric,
    COALESCE(SUM(bge.fee_total),0)::numeric,
    COUNT(*)::bigint,
    COUNT(DISTINCT bge.store_id)::bigint
  FROM ganha_ganha_billing_events bge
  LEFT JOIN stores s ON s.id = bge.store_id
  WHERE (p_brand_id IS NULL OR bge.brand_id = p_brand_id)
    AND bge.created_at::date >= p_period_start
    AND bge.created_at::date <= p_period_end
    AND (p_store_id IS NULL OR bge.store_id = p_store_id)
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id);
END;
$$;

-- ============================================================
-- 2) rpc_gg_report_by_store
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_gg_report_by_store(
  p_brand_id uuid,
  p_period_start date,
  p_period_end date,
  p_branch_id uuid DEFAULT NULL
)
RETURNS TABLE (
  store_id uuid,
  store_name text,
  branch_id uuid,
  earn_pts bigint,
  redeem_pts bigint,
  earn_fee numeric,
  redeem_fee numeric,
  total_fee numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    has_role(auth.uid(),'root_admin'::app_role)
    OR (p_brand_id IS NOT NULL AND p_brand_id IN (SELECT get_user_brand_ids(auth.uid())))
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    bge.store_id,
    COALESCE(s.name, 'Loja desconhecida')::text,
    s.branch_id,
    COALESCE(SUM(CASE WHEN bge.event_type='EARN' THEN bge.points_amount END),0)::bigint,
    COALESCE(SUM(CASE WHEN bge.event_type='REDEEM' THEN bge.points_amount END),0)::bigint,
    COALESCE(SUM(CASE WHEN bge.event_type='EARN' THEN bge.fee_total END),0)::numeric,
    COALESCE(SUM(CASE WHEN bge.event_type='REDEEM' THEN bge.fee_total END),0)::numeric,
    COALESCE(SUM(bge.fee_total),0)::numeric
  FROM ganha_ganha_billing_events bge
  LEFT JOIN stores s ON s.id = bge.store_id
  WHERE (p_brand_id IS NULL OR bge.brand_id = p_brand_id)
    AND bge.created_at::date >= p_period_start
    AND bge.created_at::date <= p_period_end
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
  GROUP BY bge.store_id, s.name, s.branch_id
  ORDER BY 8 DESC;
END;
$$;

-- ============================================================
-- 3) rpc_gg_report_by_branch
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_gg_report_by_branch(
  p_brand_id uuid,
  p_period_start date,
  p_period_end date
)
RETURNS TABLE (
  branch_id uuid,
  branch_name text,
  branch_city text,
  branch_state text,
  total_pts bigint,
  total_fee numeric,
  n_stores bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    has_role(auth.uid(),'root_admin'::app_role)
    OR (p_brand_id IS NOT NULL AND p_brand_id IN (SELECT get_user_brand_ids(auth.uid())))
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    COALESCE(b.name,'(sem cidade)')::text,
    COALESCE(b.city,'')::text,
    COALESCE(b.state,'')::text,
    COALESCE(SUM(bge.points_amount),0)::bigint,
    COALESCE(SUM(bge.fee_total),0)::numeric,
    COUNT(DISTINCT bge.store_id)::bigint
  FROM ganha_ganha_billing_events bge
  LEFT JOIN stores s ON s.id = bge.store_id
  LEFT JOIN branches b ON b.id = s.branch_id
  WHERE (p_brand_id IS NULL OR bge.brand_id = p_brand_id)
    AND bge.created_at::date >= p_period_start
    AND bge.created_at::date <= p_period_end
  GROUP BY b.id, b.name, b.city, b.state
  ORDER BY 6 DESC;
END;
$$;

-- ============================================================
-- 4) rpc_gg_report_by_month
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_gg_report_by_month(
  p_brand_id uuid,
  p_year int
)
RETURNS TABLE (
  month text,
  earn_pts bigint,
  redeem_pts bigint,
  earn_fee numeric,
  redeem_fee numeric,
  total_fee numeric,
  n_events bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    has_role(auth.uid(),'root_admin'::app_role)
    OR (p_brand_id IS NOT NULL AND p_brand_id IN (SELECT get_user_brand_ids(auth.uid())))
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH months AS (
    SELECT to_char(make_date(p_year, m, 1),'YYYY-MM') AS month
    FROM generate_series(1,12) AS m
  )
  SELECT
    m.month,
    COALESCE(SUM(CASE WHEN bge.event_type='EARN' THEN bge.points_amount END),0)::bigint,
    COALESCE(SUM(CASE WHEN bge.event_type='REDEEM' THEN bge.points_amount END),0)::bigint,
    COALESCE(SUM(CASE WHEN bge.event_type='EARN' THEN bge.fee_total END),0)::numeric,
    COALESCE(SUM(CASE WHEN bge.event_type='REDEEM' THEN bge.fee_total END),0)::numeric,
    COALESCE(SUM(bge.fee_total),0)::numeric,
    COUNT(bge.id)::bigint
  FROM months m
  LEFT JOIN ganha_ganha_billing_events bge
    ON bge.period_month = m.month
   AND (p_brand_id IS NULL OR bge.brand_id = p_brand_id)
  GROUP BY m.month
  ORDER BY m.month;
END;
$$;

-- ROLLBACK:
-- DROP FUNCTION IF EXISTS public.rpc_gg_report_summary(uuid,date,date,uuid,uuid);
-- DROP FUNCTION IF EXISTS public.rpc_gg_report_by_store(uuid,date,date,uuid);
-- DROP FUNCTION IF EXISTS public.rpc_gg_report_by_branch(uuid,date,date);
-- DROP FUNCTION IF EXISTS public.rpc_gg_report_by_month(uuid,int);
-- DROP INDEX IF EXISTS idx_gg_billing_brand_created;