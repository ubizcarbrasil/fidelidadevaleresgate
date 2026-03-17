
-- Fix: Convert views to SECURITY INVOKER so they respect underlying RLS
-- This masks sensitive columns while still enforcing row-level security

DROP VIEW IF EXISTS public.customers_safe;
DROP VIEW IF EXISTS public.crm_contacts_safe;
DROP VIEW IF EXISTS public.redemptions_safe;
DROP VIEW IF EXISTS public.profiles_safe;
DROP VIEW IF EXISTS public.brand_api_keys_safe;
DROP VIEW IF EXISTS public.audit_logs_safe;

-- 1. customers_safe — hides CPF, email, full phone
CREATE VIEW public.customers_safe
WITH (security_invoker = true)
AS SELECT
  id, user_id, brand_id, branch_id, name,
  CASE WHEN phone IS NOT NULL THEN '***' || RIGHT(phone, 4) ELSE NULL END AS phone_masked,
  points_balance, money_balance, is_active,
  created_at, updated_at,
  crm_sync_status, ride_count, customer_tier
FROM public.customers;

-- 2. crm_contacts_safe — hides PII
CREATE VIEW public.crm_contacts_safe
WITH (security_invoker = true)
AS SELECT
  id, brand_id, branch_id, customer_id, external_id,
  name, source, gender, os_platform,
  CASE WHEN phone IS NOT NULL THEN '***' || RIGHT(phone, 4) ELSE NULL END AS phone_masked,
  CASE WHEN email IS NOT NULL THEN LEFT(email, 2) || '***@' || SPLIT_PART(email, '@', 2) ELSE NULL END AS email_masked,
  CASE WHEN cpf IS NOT NULL THEN '***.***.***-' || RIGHT(cpf, 2) ELSE NULL END AS cpf_masked,
  tags_json, is_active, created_at, updated_at,
  ride_count, first_ride_at, last_ride_at
FROM public.crm_contacts;

-- 3. redemptions_safe — hides customer_cpf and qr_data
CREATE VIEW public.redemptions_safe
WITH (security_invoker = true)
AS SELECT
  id, brand_id, branch_id, customer_id, offer_id,
  token, status, purchase_value,
  created_at, expires_at, used_at,
  credit_value_applied, offer_snapshot_json
FROM public.redemptions;

-- 4. profiles_safe — hides email and phone
CREATE VIEW public.profiles_safe
WITH (security_invoker = true)
AS SELECT
  id, full_name, avatar_url, created_at,
  selected_branch_id, tenant_id, brand_id, branch_id, is_active
FROM public.profiles;

-- 5. brand_api_keys_safe — hides api_key_hash
CREATE VIEW public.brand_api_keys_safe
WITH (security_invoker = true)
AS SELECT
  id, brand_id, label, api_key_prefix,
  is_active, created_at, last_used_at, created_by
FROM public.brand_api_keys;

-- 6. audit_logs_safe — hides ip_address
CREATE VIEW public.audit_logs_safe
WITH (security_invoker = true)
AS SELECT
  id, action, actor_user_id,
  entity_type, entity_id,
  scope_type, scope_id,
  changes_json, details_json,
  created_at
FROM public.audit_logs;

-- Also fix the pre-existing views to be security_invoker
DROP VIEW IF EXISTS public.public_brands_safe CASCADE;
CREATE VIEW public.public_brands_safe
WITH (security_invoker = true)
AS SELECT
  id, name, slug, is_active, tenant_id,
  subscription_status, trial_expires_at, created_at,
  default_theme_id, home_layout_json
FROM public.brands;

DROP VIEW IF EXISTS public.public_stores_safe CASCADE;
CREATE VIEW public.public_stores_safe
WITH (security_invoker = true)
AS SELECT
  id, name, brand_id, branch_id, is_active,
  segment, phone, address, logo_url, banner_url,
  description, slug, category, tags, store_type,
  approval_status, created_at
FROM public.stores;

-- Grant SELECT on all safe views
GRANT SELECT ON public.customers_safe TO authenticated;
GRANT SELECT ON public.crm_contacts_safe TO authenticated;
GRANT SELECT ON public.redemptions_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO authenticated, anon;
GRANT SELECT ON public.brand_api_keys_safe TO authenticated;
GRANT SELECT ON public.audit_logs_safe TO authenticated;
GRANT SELECT ON public.public_brands_safe TO authenticated, anon;
GRANT SELECT ON public.public_stores_safe TO authenticated, anon;
