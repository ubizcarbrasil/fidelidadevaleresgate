ALTER TABLE stores DROP CONSTRAINT stores_brand_id_fkey,
  ADD CONSTRAINT stores_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

ALTER TABLE offers DROP CONSTRAINT offers_brand_id_fkey,
  ADD CONSTRAINT offers_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

ALTER TABLE customers DROP CONSTRAINT customers_brand_id_fkey,
  ADD CONSTRAINT customers_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

ALTER TABLE redemptions DROP CONSTRAINT redemptions_brand_id_fkey,
  ADD CONSTRAINT redemptions_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

ALTER TABLE coupons DROP CONSTRAINT coupons_brand_id_fkey,
  ADD CONSTRAINT coupons_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

ALTER TABLE store_points_rules DROP CONSTRAINT store_points_rules_brand_id_fkey,
  ADD CONSTRAINT store_points_rules_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

ALTER TABLE store_type_requests DROP CONSTRAINT store_type_requests_brand_id_fkey,
  ADD CONSTRAINT store_type_requests_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

ALTER TABLE store_catalog_items DROP CONSTRAINT store_catalog_items_brand_id_fkey,
  ADD CONSTRAINT store_catalog_items_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

ALTER TABLE store_catalog_categories DROP CONSTRAINT store_catalog_categories_brand_id_fkey,
  ADD CONSTRAINT store_catalog_categories_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

ALTER TABLE catalog_cart_orders DROP CONSTRAINT catalog_cart_orders_brand_id_fkey,
  ADD CONSTRAINT catalog_cart_orders_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

ALTER TABLE machine_ride_notifications DROP CONSTRAINT machine_ride_notifications_brand_id_fkey,
  ADD CONSTRAINT machine_ride_notifications_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;