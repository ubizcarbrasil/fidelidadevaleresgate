DROP VIEW IF EXISTS public.public_brands_safe;
CREATE VIEW public.public_brands_safe
WITH (security_invoker = on) AS
SELECT
  id,
  name,
  slug,
  is_active,
  subscription_status,
  tenant_id,
  default_theme_id,
  home_layout_json,
  brand_settings_json,
  created_at,
  trial_expires_at
FROM public.brands;