
-- TD-002: Safe view for brands (hides stripe_customer_id, brand_settings_json)
CREATE OR REPLACE VIEW public.public_brands_safe AS
SELECT
  id,
  name,
  slug,
  is_active,
  tenant_id,
  subscription_status,
  trial_expires_at,
  created_at,
  default_theme_id,
  home_layout_json
FROM public.brands;

-- TD-003: Safe view for stores (hides wizard_data_json, owner_user_id, rejection_reason, wizard_step)
CREATE OR REPLACE VIEW public.public_stores_safe AS
SELECT
  id,
  name,
  brand_id,
  branch_id,
  is_active,
  segment,
  phone,
  address,
  logo_url,
  banner_url,
  description,
  slug,
  category,
  tags,
  store_type,
  approval_status,
  created_at
FROM public.stores;

COMMENT ON VIEW public.public_brands_safe IS 'Public-safe projection of brands table. Excludes stripe_customer_id and brand_settings_json.';
COMMENT ON VIEW public.public_stores_safe IS 'Public-safe projection of stores table. Excludes wizard_data_json, owner_user_id, rejection_reason.';
