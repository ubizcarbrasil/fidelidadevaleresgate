INSERT INTO module_definitions (key, name, description, category, is_active, is_core, customer_facing)
VALUES ('theme_integrations', 'Integrações do Tema', 'Seção de integrações externas no editor de tema (WhatsApp, etc.)', 'visual_theme', true, false, false)
ON CONFLICT (key) DO NOTHING;

-- Enable for all existing brands that have at least one theme module
INSERT INTO brand_modules (brand_id, module_definition_id, is_enabled)
SELECT DISTINCT bm.brand_id, md.id, true
FROM brand_modules bm
JOIN module_definitions md ON md.key = 'theme_integrations'
WHERE bm.brand_id NOT IN (
  SELECT bm2.brand_id FROM brand_modules bm2
  JOIN module_definitions md2 ON md2.id = bm2.module_definition_id
  WHERE md2.key = 'theme_integrations'
)
ON CONFLICT DO NOTHING;