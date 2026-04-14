CREATE OR REPLACE VIEW public.public_brand_modules_safe
WITH (security_invoker = false)
AS
SELECT bm.brand_id, md.key AS module_key, bm.is_enabled
FROM brand_modules bm
JOIN module_definitions md ON md.id = bm.module_definition_id;

GRANT SELECT ON public.public_brand_modules_safe TO anon, authenticated;