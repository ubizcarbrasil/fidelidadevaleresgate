
CREATE OR REPLACE FUNCTION public.get_branch_points_ranking(p_branch_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(participant_name text, participant_type text, total_points bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(c.name, 'Motorista') AS participant_name,
    'driver'::text AS participant_type,
    c.points_balance::bigint AS total_points
  FROM customers c
  WHERE c.branch_id = p_branch_id
    AND c.name ILIKE '%[MOTORISTA]%'
    AND c.points_balance > 0
  ORDER BY c.points_balance DESC
  LIMIT p_limit;
$function$;

CREATE OR REPLACE FUNCTION public.get_points_ranking(p_brand_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(participant_name text, participant_type text, total_points bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  (SELECT
    COALESCE(c.name, 'Passageiro') AS participant_name,
    'passenger'::text AS participant_type,
    c.points_balance::bigint AS total_points
  FROM customers c
  JOIN branches b ON b.id = c.branch_id
  WHERE b.brand_id = p_brand_id
    AND c.name NOT ILIKE '%[MOTORISTA]%'
    AND c.points_balance > 0
    AND LOWER(c.name) != 'maçaneta'
  ORDER BY c.points_balance DESC
  LIMIT p_limit)
  UNION ALL
  (SELECT
    COALESCE(c.name, 'Motorista') AS participant_name,
    'driver'::text AS participant_type,
    c.points_balance::bigint AS total_points
  FROM customers c
  JOIN branches b ON b.id = c.branch_id
  WHERE b.brand_id = p_brand_id
    AND c.name ILIKE '%[MOTORISTA]%'
    AND c.points_balance > 0
  ORDER BY c.points_balance DESC
  LIMIT p_limit);
$function$;
