UPDATE brands 
SET brand_settings_json = jsonb_set(
  COALESCE(brand_settings_json::jsonb, '{}'::jsonb),
  '{driver_public_base_url}',
  '"https://fidelidadevaleresgate.lovable.app"'
)
WHERE id = 'db15bd21-9137-4965-a0fb-540d8e8b26f1';