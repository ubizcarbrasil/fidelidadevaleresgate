DELETE FROM city_business_model_overrides
WHERE brand_id = 'db15bd21-9137-4965-a0fb-540d8e8b26f1'
  AND branch_id = 'ece001ed-950e-4ae5-b59b-196952ae961f'
  AND business_model_id = (SELECT id FROM business_models WHERE key = 'pontua_cliente');

DELETE FROM brand_business_models
WHERE brand_id = 'db15bd21-9137-4965-a0fb-540d8e8b26f1'
  AND business_model_id = (SELECT id FROM business_models WHERE key = 'pontua_cliente');