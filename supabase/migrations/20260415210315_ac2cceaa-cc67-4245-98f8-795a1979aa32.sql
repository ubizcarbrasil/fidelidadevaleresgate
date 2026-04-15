
-- Ativar machine_integration para Ubiz Resgata (inserir se não existir)
INSERT INTO brand_modules (brand_id, module_definition_id, is_enabled)
SELECT 'db15bd21-9137-4965-a0fb-540d8e8b26f1', id, true
FROM module_definitions WHERE key = 'machine_integration'
ON CONFLICT (brand_id, module_definition_id) DO UPDATE SET is_enabled = true;

-- Definir scoring_model nas cidades com integração ativa mas sem scoring_model
UPDATE branches SET scoring_model = 'DRIVER_ONLY'
WHERE id IN (
  SELECT branch_id FROM machine_integrations 
  WHERE is_active = true AND brand_id = 'db15bd21-9137-4965-a0fb-540d8e8b26f1'
) AND scoring_model = 'BOTH';

-- Ativar driver_points_enabled para Olímpia
UPDATE machine_integrations SET driver_points_enabled = true
WHERE branch_id = 'ece001ed-950e-4ae5-b59b-196952ae961f';
