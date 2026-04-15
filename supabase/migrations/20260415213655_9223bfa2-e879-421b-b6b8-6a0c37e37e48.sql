
-- Para cidades com integração ativa da Ubiz Resgata, garantir que as flags essenciais estejam definidas
UPDATE branches
SET branch_settings_json = COALESCE(branch_settings_json, '{}'::jsonb)
  || jsonb_build_object(
    'enable_achadinhos_module', COALESCE((branch_settings_json->>'enable_achadinhos_module')::boolean, true),
    'enable_marketplace_module', COALESCE((branch_settings_json->>'enable_marketplace_module')::boolean, true),
    'enable_race_earn_module', COALESCE((branch_settings_json->>'enable_race_earn_module')::boolean, true),
    'enable_driver_points_purchase', true,
    'enable_duels_module', COALESCE((branch_settings_json->>'enable_duels_module')::boolean, true)
  )
WHERE id IN (
  SELECT branch_id FROM machine_integrations
  WHERE is_active = true AND brand_id = 'db15bd21-9137-4965-a0fb-540d8e8b26f1'
);
