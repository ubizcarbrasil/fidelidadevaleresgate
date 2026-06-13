CREATE OR REPLACE FUNCTION public.import_drivers_update_batch(p_updates jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_updated_count integer;
BEGIN
  IF p_updates IS NULL OR jsonb_array_length(p_updates) = 0 THEN RETURN 0; END IF;
  WITH src AS (
    SELECT * FROM jsonb_to_recordset(p_updates) AS u(
      id uuid, cpf text, phone text, email text, name text, external_driver_id text
    )
  )
  UPDATE public.customers c SET
    cpf = COALESCE(src.cpf, c.cpf),
    phone = COALESCE(src.phone, c.phone),
    email = COALESCE(src.email, c.email),
    name = COALESCE(src.name, c.name),
    external_driver_id = COALESCE(src.external_driver_id, c.external_driver_id),
    updated_at = now()
  FROM src WHERE c.id = src.id;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;
REVOKE ALL ON FUNCTION public.import_drivers_update_batch(jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.import_drivers_update_batch(jsonb) TO service_role;
COMMENT ON FUNCTION public.import_drivers_update_batch(jsonb) IS 'F5.4: batched UPDATE de customers durante CSV import.';

CREATE OR REPLACE FUNCTION public.cleanup_stuck_driver_import_jobs(p_max_age_minutes integer DEFAULT 30)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_marked integer;
BEGIN
  IF p_max_age_minutes IS NULL OR p_max_age_minutes < 5 THEN
    RAISE EXCEPTION 'p_max_age_minutes must be >= 5';
  END IF;
  UPDATE public.driver_import_jobs SET
    status = 'error',
    finished_at = now(),
    errors_json = errors_json || jsonb_build_array(
      jsonb_build_object('linha', 0, 'motivo',
        format('Job marcado como erro automaticamente: rodando há mais de %s min sem progresso (provável crash do edge function).', p_max_age_minutes))
    )
  WHERE status = 'running' AND started_at < now() - (p_max_age_minutes || ' minutes')::interval;
  GET DIAGNOSTICS v_marked = ROW_COUNT;
  RETURN v_marked;
END;
$$;
REVOKE ALL ON FUNCTION public.cleanup_stuck_driver_import_jobs(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.cleanup_stuck_driver_import_jobs(integer) TO service_role, authenticated;
COMMENT ON FUNCTION public.cleanup_stuck_driver_import_jobs(integer) IS 'F5.4: marca como error jobs travados.';

CREATE OR REPLACE FUNCTION public.increment_customer_balance(
  p_customer_id uuid, p_points integer DEFAULT 0, p_money numeric DEFAULT 0
) RETURNS TABLE (new_points_balance numeric, new_money_balance numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  UPDATE customers SET
    points_balance = COALESCE(points_balance, 0) + COALESCE(p_points, 0),
    money_balance = COALESCE(money_balance, 0) + COALESCE(p_money, 0),
    updated_at = now()
  WHERE id = p_customer_id
  RETURNING points_balance, money_balance;
END;
$$;
REVOKE ALL ON FUNCTION public.increment_customer_balance(uuid, integer, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_customer_balance(uuid, integer, numeric) TO service_role;
COMMENT ON FUNCTION public.increment_customer_balance(uuid, integer, numeric) IS 'Atomic increment de points_balance/money_balance.';