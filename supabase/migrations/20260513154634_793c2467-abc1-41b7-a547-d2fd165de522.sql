CREATE OR REPLACE FUNCTION public.duelo_get_engagement_format(p_brand_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT bbm.engagement_format
       FROM public.brand_business_models bbm
       JOIN public.business_models bm ON bm.id = bbm.business_model_id
      WHERE bbm.brand_id = p_brand_id
        AND bm.key = 'duelo_motorista'
        AND bbm.is_enabled = true
      LIMIT 1),
    'duelo'
  );
$function$;

GRANT EXECUTE ON FUNCTION public.duelo_get_engagement_format(uuid) TO anon, authenticated;