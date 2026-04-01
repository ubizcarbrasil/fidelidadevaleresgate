
CREATE OR REPLACE FUNCTION public.get_driver_ledger(p_customer_id uuid)
RETURNS TABLE(
  id uuid, entry_type text, points_amount numeric, money_amount numeric,
  reason text, reference_type text, created_at timestamptz, branch_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  -- Corridas finalizadas (machine_rides)
  SELECT
    mr.id,
    'CREDIT'::text AS entry_type,
    mr.driver_points_credited AS points_amount,
    mr.ride_value AS money_amount,
    ('Corrida - ' || COALESCE(mr.passenger_name, 'Passageiro'))::text AS reason,
    'MACHINE_RIDE'::text AS reference_type,
    mr.finalized_at AS created_at,
    b.name AS branch_name
  FROM machine_rides mr
  LEFT JOIN branches b ON b.id = mr.branch_id
  WHERE mr.driver_customer_id = p_customer_id
    AND mr.ride_status = 'FINALIZED'
    AND mr.driver_points_credited > 0

  UNION ALL

  -- Ajustes manuais, resgates e outros lançamentos (points_ledger)
  SELECT
    l.id,
    l.entry_type::text,
    l.points_amount,
    l.money_amount,
    l.reason,
    l.reference_type::text,
    l.created_at,
    br.name AS branch_name
  FROM points_ledger l
  LEFT JOIN branches br ON br.id = l.branch_id
  WHERE l.customer_id = p_customer_id

  ORDER BY created_at DESC
  LIMIT 200;
$$;
