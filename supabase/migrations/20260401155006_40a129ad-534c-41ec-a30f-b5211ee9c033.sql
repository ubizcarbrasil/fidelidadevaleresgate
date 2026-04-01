
CREATE OR REPLACE FUNCTION public.get_driver_ledger(p_customer_id uuid)
RETURNS TABLE(
  id uuid,
  entry_type text,
  points_amount numeric,
  money_amount numeric,
  reason text,
  reference_type text,
  created_at timestamptz,
  branch_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.id,
         l.entry_type::text,
         l.points_amount,
         l.money_amount,
         l.reason,
         l.reference_type::text,
         l.created_at,
         b.name AS branch_name
  FROM points_ledger l
  LEFT JOIN branches b ON b.id = l.branch_id
  WHERE l.customer_id = p_customer_id
  ORDER BY l.created_at DESC
  LIMIT 100;
$$;
