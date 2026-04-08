
CREATE OR REPLACE FUNCTION public.lookup_driver_by_id(p_brand_id uuid, p_customer_id uuid)
 RETURNS TABLE(id uuid, name text, cpf text, email text, phone text, points_balance numeric, money_balance numeric, brand_id uuid, branch_id uuid, branch_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT c.id, c.name, c.cpf, c.email, c.phone,
         c.points_balance, c.money_balance,
         c.brand_id, c.branch_id,
         b.name AS branch_name
  FROM customers c
  LEFT JOIN branches b ON b.id = c.branch_id
  WHERE c.brand_id = p_brand_id
    AND c.id = p_customer_id
    AND c.name ILIKE '%[MOTORISTA]%'
  LIMIT 1;
$$;
