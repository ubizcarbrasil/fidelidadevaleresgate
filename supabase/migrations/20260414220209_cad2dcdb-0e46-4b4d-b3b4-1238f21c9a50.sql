
-- 1. Update get_points_summary to respect last_points_reset_at
CREATE OR REPLACE FUNCTION public.get_points_summary(p_brand_id uuid)
 RETURNS TABLE(driver_points_total bigint, client_points_total bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(SUM(
      CASE WHEN b.last_points_reset_at IS NULL OR mr.finalized_at >= b.last_points_reset_at
           THEN mr.driver_points_credited ELSE 0 END
    ), 0)::bigint AS driver_points_total,
    COALESCE(SUM(
      CASE WHEN b.last_points_reset_at IS NULL OR mr.finalized_at >= b.last_points_reset_at
           THEN mr.points_credited ELSE 0 END
    ), 0)::bigint AS client_points_total
  FROM machine_rides mr
  JOIN branches b ON b.id = mr.branch_id
  WHERE mr.ride_status = 'FINALIZED'
    AND mr.brand_id = p_brand_id;
$$;

-- 2. Create reprocess_missing_driver_points RPC
CREATE OR REPLACE FUNCTION public.reprocess_missing_driver_points(p_branch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_rule RECORD;
  v_ride RECORD;
  v_points integer;
  v_processed integer := 0;
  v_skipped integer := 0;
  v_brand_id uuid;
BEGIN
  -- Get brand_id from branch
  SELECT brand_id INTO v_brand_id FROM branches WHERE id = p_branch_id;
  IF v_brand_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cidade não encontrada');
  END IF;

  -- Get active driver rule for this branch
  SELECT * INTO v_rule
  FROM driver_points_rules
  WHERE branch_id = p_branch_id AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhuma regra de pontuação ativa para esta cidade');
  END IF;

  -- Process rides with 0 driver points but valid driver
  FOR v_ride IN
    SELECT id, driver_customer_id, points_credited
    FROM machine_rides
    WHERE branch_id = p_branch_id
      AND ride_status = 'FINALIZED'
      AND driver_customer_id IS NOT NULL
      AND COALESCE(driver_points_credited, 0) = 0
    ORDER BY finalized_at ASC
    LIMIT 5000
  LOOP
    -- Calculate points based on rule mode
    IF v_rule.mode = 'FIXED' THEN
      v_points := v_rule.fixed_points;
    ELSIF v_rule.mode = 'PERCENT' THEN
      v_points := CEIL(COALESCE(v_ride.points_credited, 0) * v_rule.percent_value / 100.0);
    ELSIF v_rule.mode = 'POINTS_PER_REAL' THEN
      -- Cannot calculate without ride value, use fixed fallback
      v_points := COALESCE(v_rule.fixed_points, 1);
    ELSE
      v_points := COALESCE(v_rule.fixed_points, 1);
    END IF;

    IF v_points <= 0 THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Update the ride record
    UPDATE machine_rides
    SET driver_points_credited = v_points
    WHERE id = v_ride.id;

    -- Credit the driver
    UPDATE customers
    SET points_balance = points_balance + v_points
    WHERE id = v_ride.driver_customer_id;

    -- Record in ledger
    INSERT INTO points_ledger (
      customer_id, brand_id, branch_id,
      entry_type, points_amount, reason,
      reference_type, reference_id, created_by_user_id
    ) VALUES (
      v_ride.driver_customer_id, v_brand_id, p_branch_id,
      'CREDIT', v_points,
      'Reprocessamento: pontos de corrida não creditados anteriormente',
      'MANUAL_ADJUSTMENT'::ledger_reference_type, v_ride.id, NULL
    );

    v_processed := v_processed + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'processed', v_processed,
    'skipped', v_skipped
  );
END;
$$;
