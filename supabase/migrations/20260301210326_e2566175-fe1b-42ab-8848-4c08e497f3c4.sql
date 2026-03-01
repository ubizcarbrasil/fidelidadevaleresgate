
-- Insert new section templates using the new enum values
INSERT INTO public.section_templates (key, name, type, schema_json, is_active)
VALUES 
  ('MANUAL_LINKS_CAROUSEL', 'Carrossel de Links Manuais', 'MANUAL_LINKS_CAROUSEL', '{"description": "Sessão com cards manuais de imagem + link"}', true),
  ('MANUAL_LINKS_GRID', 'Grade de Links Manuais', 'MANUAL_LINKS_GRID', '{"description": "Grade de cards manuais com imagem + link"}', true),
  ('LIST_INFO', 'Lista com Informações', 'LIST_INFO', '{"description": "Lista vertical com logo + nome + infos + seta"}', true),
  ('GRID_INFO', 'Grade com Informações', 'GRID_INFO', '{"description": "Grade com logo + nome + infos (2 colunas)"}', true),
  ('GRID_LOGOS', 'Grade de Logos/Atalhos', 'GRID_LOGOS', '{"description": "Grade só com logo (atalhos rápidos)"}', true)
ON CONFLICT (key) DO NOTHING;
