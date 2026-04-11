-- 1. Ativar módulo customer_product_redeem para todas as marcas ativas
INSERT INTO brand_modules (brand_id, module_definition_id, is_enabled)
SELECT b.id, md.id, true
FROM brands b, module_definitions md
WHERE md.key = 'customer_product_redeem'
  AND b.is_active = true
ON CONFLICT DO NOTHING;

-- 2. Ativar espelhamento de catálogo do motorista para o cliente
UPDATE brands
SET brand_settings_json = jsonb_set(
  COALESCE(brand_settings_json::jsonb, '{}'),
  '{customer_redeem_mirror_driver}',
  'true'
)
WHERE is_active = true;