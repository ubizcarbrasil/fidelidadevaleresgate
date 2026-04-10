
-- Drop the anon policy that exposes internal fields
DROP POLICY IF EXISTS "Anon read active affiliate deals" ON public.affiliate_deals;

-- Create a safe view excluding internal sync metadata
CREATE OR REPLACE VIEW public.public_affiliate_deals_safe AS
SELECT
  id, brand_id, branch_id, title, description, image_url,
  price, original_price, affiliate_url, store_name, category,
  is_active, click_count, order_index, created_at, updated_at,
  store_logo_url, badge_label, category_id, origin,
  is_featured, is_flash_promo, visible_driver, marketplace,
  current_status, is_redeemable, redeem_points_cost
FROM affiliate_deals
WHERE is_active = true;

-- Grant anon SELECT on the safe view
GRANT SELECT ON public.public_affiliate_deals_safe TO anon;
GRANT SELECT ON public.public_affiliate_deals_safe TO authenticated;
