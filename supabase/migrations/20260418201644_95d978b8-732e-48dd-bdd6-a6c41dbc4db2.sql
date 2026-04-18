-- Reactivate dormant module definitions referenced by menu
UPDATE public.module_definitions
   SET is_active = true
 WHERE key IN ('catalog','audit','crm','taxonomy','guide_brand','guide_emitter',
               'welcome_tour','app_icons','icon_library','offer_card_config',
               'page_builder','partner_landing','custom_pages','sponsored',
               'vouchers','ganha_ganha','multi_emitter');

-- Insert new module definitions for menu items that lack one
INSERT INTO public.module_definitions (key, name, description, category, is_core, is_active, customer_facing)
VALUES
  -- Dashboard (root may turn off everything)
  ('dashboard', 'Visão Geral (Dashboard)', 'Tela inicial do painel administrativo', 'essencial', false, true, false),

  -- Cidades / governança
  ('points_packages', 'Catálogo de Pacotes de Pontos', 'Gestão de pacotes de pontos comercializados', 'governanca', false, true, false),
  ('points_packages_store', 'Comprar Pontos (Cidade)', 'Loja de pacotes de pontos para a cidade', 'governanca', false, true, false),
  ('redemption_rules', 'Regras de Resgate', 'Configuração de regras de resgate', 'governanca', false, true, false),
  ('cities_guide', 'Guia de Cidades', 'Tutorial de gestão de cidades', 'governanca', false, true, false),
  ('city_onboarding', 'Onboarding de Cidade', 'Assistente de configuração de nova cidade', 'governanca', false, true, false),
  ('city_settings', 'Configuração por Cidade', 'Ajustes individuais por cidade', 'governanca', false, true, false),
  ('city_modules_config', 'Funcionalidades por Cidade', 'Override de módulos por cidade', 'governanca', false, true, false),
  ('clone_branch', 'Duplicar Região', 'Clonar configurações de uma cidade', 'governanca', false, true, false),
  ('brand_domains', 'Meus Domínios', 'Gestão de domínios da marca', 'governanca', false, true, false),
  ('driver_panel_config', 'Configurar Painel Motorista', 'Layout e funcionalidades do painel motorista', 'governanca', false, true, false),

  -- Personalização
  ('platform_theme', 'Tema da Plataforma', 'Tema visual padrão da plataforma', 'personalizacao', false, true, false),
  ('menu_labels', 'Nomenclaturas', 'Editor de rótulos do menu', 'personalizacao', false, true, false),

  -- Comercial / cidade
  ('branch_wallet', 'Carteira de Pontos (Cidade)', 'Saldo e movimentações de pontos da cidade', 'comercial', false, true, false),
  ('product_redemptions', 'Produtos de Resgate', 'Catálogo de produtos resgatáveis com pontos', 'comercial', false, true, false),
  ('product_redemption_orders', 'Pedidos de Resgate', 'Pedidos de resgate de produtos', 'comercial', false, true, false),
  ('driver_panel_view', 'Painel do Motorista (preview)', 'Acesso rápido ao painel do motorista', 'comercial', false, true, false),
  ('driver_points_purchase', 'Vendas para Motoristas', 'Pedidos de compra de pontos por motoristas', 'comercial', false, true, false),
  ('branch_reports', 'Relatórios da Cidade', 'Relatórios operacionais por cidade', 'comercial', false, true, false),

  -- Achadinhos granular
  ('affiliate_categories', 'Categorias de Achadinhos', 'Gestão de categorias dos achadinhos', 'comercial', false, true, false),
  ('affiliate_mirror', 'Espelhamento de Achadinhos', 'Espelhar ofertas externas', 'comercial', false, true, false),
  ('affiliate_governance', 'Governança de Ofertas', 'Aprovação e governança de achadinhos', 'comercial', false, true, false),

  -- Cashback / Ganha-Ganha
  ('gg_dashboard', 'Painel Cashback', 'Painel do programa Ganha-Ganha', 'fidelidade_pontos', false, true, false),
  ('gg_store_summary', 'Resumo Cashback por Parceiro', 'Resumo do Cashback por parceiro', 'fidelidade_pontos', false, true, false),

  -- Inteligência / governança extra
  ('manuais', 'Manuais da Plataforma', 'Manuais e documentação operacional', 'governanca', false, true, false)
ON CONFLICT (key) DO NOTHING;
