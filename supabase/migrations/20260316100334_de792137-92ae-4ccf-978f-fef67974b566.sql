
INSERT INTO module_definitions (key, name, description, category, is_core, is_active)
VALUES ('users_management', 'Gestão de Usuários', 'Gerenciamento de usuários e equipe', 'governance', false, true)
ON CONFLICT DO NOTHING;
