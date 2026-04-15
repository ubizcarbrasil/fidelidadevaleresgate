
-- Fix public_brands_safe: remove security_invoker so anon can read brand data
DROP VIEW IF EXISTS public.public_brands_safe;
CREATE VIEW public.public_brands_safe AS
SELECT id, name, slug, is_active, subscription_status, tenant_id,
       default_theme_id, home_layout_json, brand_settings_json,
       created_at, trial_expires_at, subscription_plan
FROM public.brands;

GRANT SELECT ON public.public_brands_safe TO anon, authenticated;

-- Fix public_affiliate_deals_safe: also needs anon access for driver marketplace
DROP VIEW IF EXISTS public.public_affiliate_deals_safe;
CREATE VIEW public.public_affiliate_deals_safe AS
SELECT id, brand_id, branch_id, title, description, image_url, affiliate_url,
       category, category_id, price, original_price, store_name, store_logo_url,
       badge_label, is_active, is_featured, is_flash_promo, is_redeemable,
       redeem_points_cost, redeemable_by, custom_points_per_real,
       click_count, order_index, created_at, updated_at, current_status,
       marketplace, source_group_id, source_group_name, visible_driver
FROM public.affiliate_deals;

GRANT SELECT ON public.public_affiliate_deals_safe TO anon, authenticated;

-- Fix public_brand_modules_safe: needs anon access for module checks
DROP VIEW IF EXISTS public.public_brand_modules_safe;
CREATE VIEW public.public_brand_modules_safe AS
SELECT id, brand_id, module_definition_id, is_enabled, config_json, order_index, created_at, updated_at
FROM public.brand_modules;

GRANT SELECT ON public.public_brand_modules_safe TO anon, authenticated;
