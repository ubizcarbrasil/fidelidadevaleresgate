
CREATE OR REPLACE FUNCTION public.get_branch_passenger_stats(p_branch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_brand_id uuid;
  v_month_start timestamptz;
BEGIN
  v_month_start := date_trunc('month', now());

  SELECT brand_id INTO v_brand_id FROM branches WHERE id = p_branch_id;

  result := jsonb_build_object(
    'customers_total', (SELECT COUNT(*)::bigint FROM customers WHERE branch_id = p_branch_id AND is_active = true AND name NOT ILIKE '%[MOTORISTA]%'),
    'customers_active_30d', (
      SELECT COUNT(DISTINCT r.customer_id)::bigint
      FROM redemptions r
      WHERE r.branch_id = p_branch_id
        AND r.created_at > now() - interval '30 days'
    ),
    'redemptions_month', (
      SELECT COUNT(*)::bigint FROM redemptions
      WHERE branch_id = p_branch_id AND created_at >= v_month_start
    ),
    'offers_active', (
      SELECT COUNT(*)::bigint FROM offers
      WHERE branch_id = p_branch_id AND is_active = true AND status = 'ACTIVE'
    ),
    'stores_active', (
      SELECT COUNT(*)::bigint FROM stores
      WHERE branch_id = p_branch_id AND is_active = true AND approval_status = 'APPROVED'
    )
  );

  RETURN result;
END;
$function$;
