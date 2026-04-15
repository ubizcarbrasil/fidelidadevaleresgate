
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(
  p_brand_id uuid DEFAULT NULL,
  p_period_start timestamptz DEFAULT now() - interval '7 days',
  p_month_start timestamptz DEFAULT date_trunc('month', now())
)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'stores_active', (
      SELECT count(*) FROM stores
      WHERE is_active = true
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'offers_total', (
      SELECT count(*) FROM offers
      WHERE (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'offers_active', (
      SELECT count(*) FROM offers
      WHERE status = 'ACTIVE' AND is_active = true
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'customers_total', (
      SELECT count(*) FROM customers
      WHERE (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'customers_active', (
      SELECT count(*) FROM customers
      WHERE is_active = true
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'redemptions_total', (
      SELECT count(*) FROM redemptions
      WHERE (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'redemptions_period', (
      SELECT count(*) FROM redemptions
      WHERE created_at >= p_period_start
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'redemptions_pending', (
      SELECT count(*) FROM redemptions
      WHERE status = 'PENDING'
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'store_rules_pending', (
      SELECT count(*) FROM store_points_rules
      WHERE status = 'PENDING_APPROVAL'
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'earning_events_total', (
      SELECT count(*) FROM machine_rides
      WHERE ride_status = 'FINALIZED'
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'earning_events_period', (
      SELECT count(*) FROM machine_rides
      WHERE ride_status = 'FINALIZED'
        AND finalized_at >= p_period_start
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'motoristas_total', (
      SELECT count(*) FROM customers
      WHERE name ILIKE '%[MOTORISTA]%'
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'achadinhos_active', (
      SELECT count(*) FROM affiliate_deals
      WHERE is_active = true
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'achadinhos_stores', (
      SELECT count(DISTINCT store_name) FROM affiliate_deals
      WHERE is_active = true AND store_name IS NOT NULL
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'achadinhos_cities', (
      SELECT count(*) FROM branches
      WHERE is_active = true
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'product_redemptions_pending', (
      SELECT count(*) FROM product_redemption_orders
      WHERE status = 'PENDING'
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'product_redemptions_month', (
      SELECT count(*) FROM product_redemption_orders
      WHERE created_at >= p_month_start
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'driver_points_total', (
      SELECT COALESCE(SUM(
        CASE WHEN b.last_points_reset_at IS NULL OR mr.finalized_at >= b.last_points_reset_at
             THEN mr.driver_points_credited ELSE 0 END
      ), 0)::bigint
      FROM machine_rides mr
      JOIN branches b ON b.id = mr.branch_id
      WHERE mr.ride_status = 'FINALIZED'
        AND mr.brand_id = p_brand_id
    ),
    'client_points_total', (
      SELECT COALESCE(SUM(
        CASE WHEN b.last_points_reset_at IS NULL OR mr.finalized_at >= b.last_points_reset_at
             THEN mr.points_credited ELSE 0 END
      ), 0)::bigint
      FROM machine_rides mr
      JOIN branches b ON b.id = mr.branch_id
      WHERE mr.ride_status = 'FINALIZED'
        AND mr.brand_id = p_brand_id
    )
  )
$$;
