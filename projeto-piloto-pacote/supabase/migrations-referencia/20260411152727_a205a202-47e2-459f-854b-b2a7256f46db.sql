CREATE OR REPLACE FUNCTION public.get_branch_dashboard_stats_v2(p_branch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_total_drivers bigint;
  v_today_start timestamptz;
  v_month_start timestamptz;
  v_prev_month_start timestamptz;
BEGIN
  v_today_start := date_trunc('day', now());
  v_month_start := date_trunc('month', now());
  v_prev_month_start := date_trunc('month', now() - interval '1 month');

  SELECT COUNT(*)::bigint INTO v_total_drivers
  FROM customers
  WHERE branch_id = p_branch_id AND name ILIKE '%[MOTORISTA]%' AND is_active = true;

  result := jsonb_build_object(
    'redemptions_total', (SELECT COUNT(*)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id),
    'redemptions_pending', (SELECT COUNT(*)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id AND status = 'PENDING'),
    'redemptions_approved', (SELECT COUNT(*)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id AND status = 'APPROVED'),
    'redemptions_shipped', (SELECT COUNT(*)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id AND status = 'SHIPPED'),
    'redemptions_delivered', (SELECT COUNT(*)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id AND status = 'DELIVERED'),
    'redemptions_rejected', (SELECT COUNT(*)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id AND status = 'REJECTED'),

    'points_total', (SELECT COALESCE(SUM(driver_points_credited), 0) FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED'),
    'points_today', (SELECT COALESCE(SUM(driver_points_credited), 0) FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED' AND finalized_at >= v_today_start),
    'points_month', (SELECT COALESCE(SUM(driver_points_credited), 0) FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED' AND finalized_at >= v_month_start),
    'points_avg_per_driver', (CASE WHEN v_total_drivers > 0 THEN (SELECT COALESCE(SUM(driver_points_credited), 0) FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED') / v_total_drivers ELSE 0 END),

    'drivers_total', v_total_drivers,
    'drivers_scored', (SELECT COUNT(DISTINCT driver_customer_id)::bigint FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED' AND driver_points_credited > 0),
    'drivers_redeemed', (SELECT COUNT(DISTINCT customer_id)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id),

    'rides_total', (SELECT COUNT(*)::bigint FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED'),
    'rides_today', (SELECT COUNT(*)::bigint FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED' AND finalized_at >= v_today_start),
    'rides_month', (SELECT COUNT(*)::bigint FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED' AND finalized_at >= v_month_start),
    'rides_prev_month', (SELECT COUNT(*)::bigint FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED' AND finalized_at >= v_prev_month_start AND finalized_at < v_month_start),
    'rides_avg_per_driver', (CASE WHEN v_total_drivers > 0 THEN (SELECT COUNT(*)::bigint FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED') / v_total_drivers ELSE 0 END),

    'wallet_balance', (SELECT COALESCE(balance, 0) FROM branch_points_wallet WHERE branch_id = p_branch_id),
    'wallet_total_loaded', (SELECT COALESCE(total_loaded, 0) FROM branch_points_wallet WHERE branch_id = p_branch_id),
    'wallet_total_distributed', (SELECT COALESCE(total_distributed, 0) FROM branch_points_wallet WHERE branch_id = p_branch_id),
    'wallet_low_threshold', (SELECT COALESCE(low_balance_threshold, 1000) FROM branch_points_wallet WHERE branch_id = p_branch_id),
    'active_rules', (SELECT COUNT(*)::bigint FROM driver_points_rules WHERE branch_id = p_branch_id AND is_active = true)
  );

  RETURN result;
END;
$function$;