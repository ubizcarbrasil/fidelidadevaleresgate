
-- =============================================
-- SECURITY DEFINER views to protect sensitive data
-- =============================================

-- 1. Safe view for customers — hides CPF and email from non-admin contexts
CREATE OR REPLACE VIEW public.customers_safe
WITH (security_invoker = false)
AS SELECT
  id, user_id, brand_id, branch_id, name,
  -- Mask phone: show only last 4 digits
  CASE WHEN phone IS NOT NULL THEN '***' || RIGHT(phone, 4) ELSE NULL END AS phone_masked,
  points_balance, money_balance, is_active,
  created_at, updated_at,
  crm_sync_status, ride_count, customer_tier
FROM public.customers;

-- 2. Safe view for CRM contacts — hides PII (cpf, email, phone, coordinates)
CREATE OR REPLACE VIEW public.crm_contacts_safe
WITH (security_invoker = false)
AS SELECT
  id, brand_id, branch_id, customer_id, external_id,
  name, source, gender, os_platform,
  CASE WHEN phone IS NOT NULL THEN '***' || RIGHT(phone, 4) ELSE NULL END AS phone_masked,
  CASE WHEN email IS NOT NULL THEN LEFT(email, 2) || '***@' || SPLIT_PART(email, '@', 2) ELSE NULL END AS email_masked,
  CASE WHEN cpf IS NOT NULL THEN '***.***.***-' || RIGHT(cpf, 2) ELSE NULL END AS cpf_masked,
  tags_json, is_active, created_at, updated_at,
  ride_count, first_ride_at, last_ride_at
FROM public.crm_contacts;

-- 3. Safe view for redemptions — hides customer CPF
CREATE OR REPLACE VIEW public.redemptions_safe
WITH (security_invoker = false)
AS SELECT
  id, brand_id, branch_id, customer_id, offer_id,
  token, status, purchase_value,
  created_at, expires_at, used_at,
  credit_value_applied, offer_snapshot_json
  -- customer_cpf and qr_data intentionally omitted
FROM public.redemptions;

-- 4. Safe view for profiles — hides email and phone from public queries
CREATE OR REPLACE VIEW public.profiles_safe
WITH (security_invoker = false)
AS SELECT
  id, full_name, avatar_url, created_at,
  selected_branch_id, tenant_id, brand_id, branch_id, is_active
  -- email and phone intentionally omitted
FROM public.profiles;

-- 5. Safe view for brand_api_keys — never expose hash
CREATE OR REPLACE VIEW public.brand_api_keys_safe
WITH (security_invoker = false)
AS SELECT
  id, brand_id, label, api_key_prefix,
  is_active, created_at, last_used_at, created_by
  -- api_key_hash intentionally omitted
FROM public.brand_api_keys;

-- 6. Safe view for audit_logs — expose for read without IP
CREATE OR REPLACE VIEW public.audit_logs_safe
WITH (security_invoker = false)
AS SELECT
  id, action, actor_user_id,
  entity_type, entity_id,
  scope_type, scope_id,
  changes_json, details_json,
  created_at
  -- ip_address intentionally omitted
FROM public.audit_logs;

-- Grant SELECT to authenticated and anon on safe views
GRANT SELECT ON public.customers_safe TO authenticated;
GRANT SELECT ON public.crm_contacts_safe TO authenticated;
GRANT SELECT ON public.redemptions_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.brand_api_keys_safe TO authenticated;
GRANT SELECT ON public.audit_logs_safe TO authenticated;

-- Also grant to anon for public_brands_safe and public_stores_safe (already exist)
-- Safe views for the customer PWA that may need anon access
GRANT SELECT ON public.profiles_safe TO anon;
