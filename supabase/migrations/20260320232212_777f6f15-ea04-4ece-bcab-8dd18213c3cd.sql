
ALTER TABLE public.module_definitions ADD COLUMN customer_facing boolean NOT NULL DEFAULT false;

UPDATE public.module_definitions SET customer_facing = true WHERE key IN (
  'stores', 'branches', 'customers', 'offers', 'vouchers', 'catalog',
  'affiliate_deals', 'sponsored', 'points', 'points_rules', 'earn_points_store',
  'ganha_ganha', 'wallet', 'redemption_qr', 'home_sections', 'banners',
  'notifications', 'welcome_tour', 'custom_pages'
);
