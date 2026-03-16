
INSERT INTO module_definitions (key, name, description, category, is_core, is_active) VALUES
  ('brand_theme', 'Aparência da Marca', 'Personalização visual da marca', 'visual', false, true),
  ('offer_card_config', 'Layout de Ofertas', 'Configuração de cards de oferta', 'visual', false, true),
  ('guide_brand', 'Guia do Empreendedor', 'Jornada guiada do empreendedor', 'engagement', false, true),
  ('guide_emitter', 'Guia do Emissor', 'Jornada guiada do emissor', 'engagement', false, true),
  ('store_permissions', 'Permissão de Parceiros', 'Gestão de permissões de lojas parceiras', 'governance', false, true),
  ('access_hub', 'Gestão de Acessos', 'Central de gestão de acessos', 'governance', false, true),
  ('brand_settings', 'Configurações', 'Configurações gerais da marca', 'general', false, true),
  ('csv_import', 'Importação de Dados', 'Importação de dados via CSV', 'general', false, true),
  ('sponsored', 'Patrocinados', 'Gestão de colocações patrocinadas', 'comercial', false, true),
  ('theme_colors', 'Cores do Tema', 'Personalização de cores da marca', 'visual', false, true),
  ('theme_typography', 'Tipografia', 'Personalização de fontes da marca', 'visual', false, true),
  ('theme_images', 'Imagens da Marca', 'Logo, favicon e imagem de fundo', 'visual', false, true),
  ('theme_texts', 'Textos da Marca', 'Nome de exibição, slogan e rodapé', 'visual', false, true),
  ('theme_layout', 'Layout & Dimensões', 'Ajustes de dimensões e espaçamentos', 'visual', false, true),
  ('theme_offer_cards', 'Etiquetas de Ofertas', 'Badges e etiquetas dos cards de oferta', 'visual', false, true)
ON CONFLICT (key) DO NOTHING;
