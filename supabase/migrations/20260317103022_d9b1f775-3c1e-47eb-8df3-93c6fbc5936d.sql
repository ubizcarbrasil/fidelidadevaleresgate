
-- Populate plan_module_templates with correct IDs
-- The check constraint was already updated in the previous migration

INSERT INTO plan_module_templates (plan_key, module_definition_id, is_enabled)
VALUES
-- ===================== STARTER =====================
-- Core (always on)
('starter', 'cc3d14ca-1865-48dc-82b0-0109e4f9b938', true),  -- Carteira
('starter', '010a1b74-0398-411a-9dbf-953f3ef05f72', true),  -- Clientes
('starter', 'ff20a87c-0a33-4646-b324-50b79300717a', true),  -- Home Sections
('starter', 'e480e0da-de98-4994-9699-9cd8ba68e88a', true),  -- Lojas
('starter', '42f9a0f6-62a9-4cec-82d4-a66b6d955676', true),  -- Ofertas
('starter', '91bc1b90-7bac-449b-aede-ae24719baeda', true),  -- Resgate QR
-- Starter enabled
('starter', '54ccc9fa-3ac4-45f0-8f66-a03b3fcdcc32', true),  -- Achadinhos
('starter', '84cf5029-ea51-4b3a-9b7f-8193c2254242', true),  -- Cupons
('starter', '9b876f88-04ed-4602-941d-15beab0a486c', true),  -- Aparência da Marca
('starter', '4d0f7305-6eb7-4263-83d9-7413444f64b2', true),  -- Banners
('starter', 'e2d6e293-ab9f-4260-802f-f486e0aadb9c', true),  -- LP de Parceiros
('starter', '94109040-a46f-41a4-85d0-9c9b2ca93e19', true),  -- Links do Perfil
('starter', 'b2821a04-661e-4b7f-ab87-a426d6ce1425', true),  -- Relatórios
('starter', 'e3fb89a7-37e4-4726-8b9f-13e28b322005', true),  -- Taxonomia
('starter', '507c3083-887f-4a82-8be5-554e0dcea27b', true),  -- Aprovações
('starter', '937059aa-d18a-4d80-ba12-092978888c95', true),  -- Gestão de Usuários
('starter', '4ad55a24-4a49-487c-84a2-977bab7d2ebf', true),  -- Categorias
('starter', 'af21a377-ffa9-4ca8-ba84-06ee52b21489', true),  -- Integrações API
('starter', '0939af5f-5b90-44ca-83ff-125ed163b256', true),  -- Imagens da Marca
('starter', 'f41d1726-1c1d-4ec4-b7ae-597128752336', true),  -- Textos da Marca
-- Starter disabled
('starter', 'c9c404db-f3bb-471d-8aeb-3a99ac4a52e4', false), -- Catálogo
('starter', 'ea20135f-3fc9-4d29-8ddf-a90149cf917f', false), -- Patrocinados
('starter', '84af3fb9-c1ae-411c-b3fb-709ce29a1b6b', false), -- Vouchers
('starter', 'c85c7ec2-6080-45db-a0c2-ed01c943ba46', false), -- Cidades
('starter', 'a0a17517-163f-41cf-b335-bd768a7f1382', false), -- Pontos
('starter', '4f78013d-8a2b-4543-ac42-015c5f6cf448', false), -- Pontuar Cliente
('starter', '0cdd7a72-a2f1-4f91-9100-fb6953ad8926', false), -- Regras de Pontos
('starter', 'bf34723d-d4a2-428c-88cc-6bdf6704da4a', false), -- Ganha-Ganha
('starter', '12f065d4-a63d-4678-9a76-0a1629d84c6d', false), -- CRM
('starter', 'b52a71f3-40a9-4d16-867b-f116e7b1e12c', false), -- Guia do Emissor
('starter', '0ef715aa-7d72-4f2d-9201-a51e766cd50f', false), -- Guia do Empreendedor
('starter', '09d31bc9-e4b9-4e57-99f8-38ab5cdb5a17', false), -- Missões
('starter', 'c0344210-f0fe-4908-a27d-fba47215f319', false), -- Notificações
('starter', 'ed04286e-4643-4f7b-8246-8faffbce58fb', false), -- Tour de Boas-Vindas
('starter', 'f686cd9a-ae72-4d1d-87f9-3f14fe7ad7a5', false), -- TaxiMachine
('starter', 'd27cf4d7-9ac7-494b-b48c-033666e6b222', false), -- Meu Plano
('starter', '048b8414-9dd1-47a3-a677-06a16463cfea', false), -- Construtor de Páginas
('starter', '3839c0cd-9ac6-4810-9364-4749f417b4a5', false), -- Domínios
('starter', '2d766bca-8851-429a-b651-47533dce2a17', false), -- Galeria de Ícones
('starter', '1d2b8405-457e-41d1-a74d-fe4d117a498b', false), -- Ícones do App
('starter', '36a24b85-a854-412c-9dec-db6f87daa033', false), -- Layout de Ofertas
('starter', 'f7673d6a-6930-4369-a93c-57d9cb2ba720', false), -- Auditoria
('starter', 'cba22931-5f06-4053-99bc-8f1d0d1e0c30', false), -- Gestão de Acessos
('starter', '5854389a-7349-467c-921e-29158893ce50', false), -- Permissão de Parceiros
('starter', 'e1696ac4-f664-4e0d-834f-bc8f8d9073b8', false), -- Configurações
('starter', '7e4c5eef-ae88-4f68-aead-82f04e62935b', false), -- Importação de Dados
('starter', '07a9f6f7-daf3-48b7-b694-4be0131e73b1', false), -- Cores do Tema
('starter', 'ee7f7741-1b12-4349-9713-38d74fa75833', false), -- Tipografia
('starter', 'b943f68c-9356-4e51-ad4c-6be693979abe', false), -- Layout & Dimensões
('starter', 'a2e4d1b2-1196-4d8d-a32d-b84fab6bb657', false), -- Etiquetas de Ofertas
('starter', '2c8ba1f5-5b90-43dc-92f3-6641f0de7d05', false), -- Páginas Custom

-- ===================== PROFISSIONAL =====================
('profissional', 'cc3d14ca-1865-48dc-82b0-0109e4f9b938', true),
('profissional', '010a1b74-0398-411a-9dbf-953f3ef05f72', true),
('profissional', 'ff20a87c-0a33-4646-b324-50b79300717a', true),
('profissional', 'e480e0da-de98-4994-9699-9cd8ba68e88a', true),
('profissional', '42f9a0f6-62a9-4cec-82d4-a66b6d955676', true),
('profissional', '91bc1b90-7bac-449b-aede-ae24719baeda', true),
('profissional', '54ccc9fa-3ac4-45f0-8f66-a03b3fcdcc32', true),
('profissional', '84cf5029-ea51-4b3a-9b7f-8193c2254242', true),
('profissional', '9b876f88-04ed-4602-941d-15beab0a486c', true),
('profissional', '4d0f7305-6eb7-4263-83d9-7413444f64b2', true),
('profissional', 'e2d6e293-ab9f-4260-802f-f486e0aadb9c', true),
('profissional', '94109040-a46f-41a4-85d0-9c9b2ca93e19', true),
('profissional', 'b2821a04-661e-4b7f-ab87-a426d6ce1425', true),
('profissional', 'e3fb89a7-37e4-4726-8b9f-13e28b322005', true),
('profissional', '507c3083-887f-4a82-8be5-554e0dcea27b', true),
('profissional', '937059aa-d18a-4d80-ba12-092978888c95', true),
('profissional', '4ad55a24-4a49-487c-84a2-977bab7d2ebf', true),
('profissional', 'af21a377-ffa9-4ca8-ba84-06ee52b21489', true),
('profissional', '0939af5f-5b90-44ca-83ff-125ed163b256', true),
('profissional', 'f41d1726-1c1d-4ec4-b7ae-597128752336', true),
-- Profissional NEW enabled
('profissional', 'c9c404db-f3bb-471d-8aeb-3a99ac4a52e4', true),  -- Catálogo
('profissional', '84af3fb9-c1ae-411c-b3fb-709ce29a1b6b', true),  -- Vouchers
('profissional', 'c85c7ec2-6080-45db-a0c2-ed01c943ba46', true),  -- Cidades
('profissional', 'a0a17517-163f-41cf-b335-bd768a7f1382', true),  -- Pontos
('profissional', '4f78013d-8a2b-4543-ac42-015c5f6cf448', true),  -- Pontuar Cliente
('profissional', '0cdd7a72-a2f1-4f91-9100-fb6953ad8926', true),  -- Regras de Pontos
('profissional', '12f065d4-a63d-4678-9a76-0a1629d84c6d', true),  -- CRM
('profissional', 'b52a71f3-40a9-4d16-867b-f116e7b1e12c', true),  -- Guia do Emissor
('profissional', '0ef715aa-7d72-4f2d-9201-a51e766cd50f', true),  -- Guia do Empreendedor
('profissional', 'c0344210-f0fe-4908-a27d-fba47215f319', true),  -- Notificações
('profissional', 'ed04286e-4643-4f7b-8246-8faffbce58fb', true),  -- Tour de Boas-Vindas
('profissional', '048b8414-9dd1-47a3-a677-06a16463cfea', true),  -- Construtor de Páginas
('profissional', '2d766bca-8851-429a-b651-47533dce2a17', true),  -- Galeria de Ícones
('profissional', '1d2b8405-457e-41d1-a74d-fe4d117a498b', true),  -- Ícones do App
('profissional', '36a24b85-a854-412c-9dec-db6f87daa033', true),  -- Layout de Ofertas
('profissional', 'f7673d6a-6930-4369-a93c-57d9cb2ba720', true),  -- Auditoria
('profissional', 'cba22931-5f06-4053-99bc-8f1d0d1e0c30', true),  -- Gestão de Acessos
('profissional', '5854389a-7349-467c-921e-29158893ce50', true),  -- Permissão de Parceiros
('profissional', 'e1696ac4-f664-4e0d-834f-bc8f8d9073b8', true),  -- Configurações
('profissional', '7e4c5eef-ae88-4f68-aead-82f04e62935b', true),  -- Importação de Dados
('profissional', 'd27cf4d7-9ac7-494b-b48c-033666e6b222', true),  -- Meu Plano
('profissional', '07a9f6f7-daf3-48b7-b694-4be0131e73b1', true),  -- Cores do Tema
('profissional', 'ee7f7741-1b12-4349-9713-38d74fa75833', true),  -- Tipografia
('profissional', 'b943f68c-9356-4e51-ad4c-6be693979abe', true),  -- Layout & Dimensões
('profissional', 'a2e4d1b2-1196-4d8d-a32d-b84fab6bb657', true),  -- Etiquetas de Ofertas
('profissional', '2c8ba1f5-5b90-43dc-92f3-6641f0de7d05', true),  -- Páginas Custom
-- Profissional disabled (enterprise only)
('profissional', 'ea20135f-3fc9-4d29-8ddf-a90149cf917f', false), -- Patrocinados
('profissional', 'bf34723d-d4a2-428c-88cc-6bdf6704da4a', false), -- Ganha-Ganha
('profissional', '09d31bc9-e4b9-4e57-99f8-38ab5cdb5a17', false), -- Missões
('profissional', '3839c0cd-9ac6-4810-9364-4749f417b4a5', false), -- Domínios
('profissional', 'f686cd9a-ae72-4d1d-87f9-3f14fe7ad7a5', false), -- TaxiMachine

-- ===================== ENTERPRISE =====================
('enterprise', 'cc3d14ca-1865-48dc-82b0-0109e4f9b938', true),
('enterprise', '010a1b74-0398-411a-9dbf-953f3ef05f72', true),
('enterprise', 'ff20a87c-0a33-4646-b324-50b79300717a', true),
('enterprise', 'e480e0da-de98-4994-9699-9cd8ba68e88a', true),
('enterprise', '42f9a0f6-62a9-4cec-82d4-a66b6d955676', true),
('enterprise', '91bc1b90-7bac-449b-aede-ae24719baeda', true),
('enterprise', '54ccc9fa-3ac4-45f0-8f66-a03b3fcdcc32', true),
('enterprise', '84cf5029-ea51-4b3a-9b7f-8193c2254242', true),
('enterprise', '9b876f88-04ed-4602-941d-15beab0a486c', true),
('enterprise', '4d0f7305-6eb7-4263-83d9-7413444f64b2', true),
('enterprise', 'e2d6e293-ab9f-4260-802f-f486e0aadb9c', true),
('enterprise', '94109040-a46f-41a4-85d0-9c9b2ca93e19', true),
('enterprise', 'b2821a04-661e-4b7f-ab87-a426d6ce1425', true),
('enterprise', 'e3fb89a7-37e4-4726-8b9f-13e28b322005', true),
('enterprise', '507c3083-887f-4a82-8be5-554e0dcea27b', true),
('enterprise', '937059aa-d18a-4d80-ba12-092978888c95', true),
('enterprise', '4ad55a24-4a49-487c-84a2-977bab7d2ebf', true),
('enterprise', 'af21a377-ffa9-4ca8-ba84-06ee52b21489', true),
('enterprise', '0939af5f-5b90-44ca-83ff-125ed163b256', true),
('enterprise', 'f41d1726-1c1d-4ec4-b7ae-597128752336', true),
('enterprise', 'c9c404db-f3bb-471d-8aeb-3a99ac4a52e4', true),
('enterprise', '84af3fb9-c1ae-411c-b3fb-709ce29a1b6b', true),
('enterprise', 'c85c7ec2-6080-45db-a0c2-ed01c943ba46', true),
('enterprise', 'a0a17517-163f-41cf-b335-bd768a7f1382', true),
('enterprise', '4f78013d-8a2b-4543-ac42-015c5f6cf448', true),
('enterprise', '0cdd7a72-a2f1-4f91-9100-fb6953ad8926', true),
('enterprise', '12f065d4-a63d-4678-9a76-0a1629d84c6d', true),
('enterprise', 'b52a71f3-40a9-4d16-867b-f116e7b1e12c', true),
('enterprise', '0ef715aa-7d72-4f2d-9201-a51e766cd50f', true),
('enterprise', 'c0344210-f0fe-4908-a27d-fba47215f319', true),
('enterprise', 'ed04286e-4643-4f7b-8246-8faffbce58fb', true),
('enterprise', '048b8414-9dd1-47a3-a677-06a16463cfea', true),
('enterprise', '2d766bca-8851-429a-b651-47533dce2a17', true),
('enterprise', '1d2b8405-457e-41d1-a74d-fe4d117a498b', true),
('enterprise', '36a24b85-a854-412c-9dec-db6f87daa033', true),
('enterprise', 'f7673d6a-6930-4369-a93c-57d9cb2ba720', true),
('enterprise', 'cba22931-5f06-4053-99bc-8f1d0d1e0c30', true),
('enterprise', '5854389a-7349-467c-921e-29158893ce50', true),
('enterprise', 'e1696ac4-f664-4e0d-834f-bc8f8d9073b8', true),
('enterprise', '7e4c5eef-ae88-4f68-aead-82f04e62935b', true),
('enterprise', 'd27cf4d7-9ac7-494b-b48c-033666e6b222', true),
('enterprise', '07a9f6f7-daf3-48b7-b694-4be0131e73b1', true),
('enterprise', 'ee7f7741-1b12-4349-9713-38d74fa75833', true),
('enterprise', 'b943f68c-9356-4e51-ad4c-6be693979abe', true),
('enterprise', 'a2e4d1b2-1196-4d8d-a32d-b84fab6bb657', true),
('enterprise', '2c8ba1f5-5b90-43dc-92f3-6641f0de7d05', true),
('enterprise', 'ea20135f-3fc9-4d29-8ddf-a90149cf917f', true),  -- Patrocinados
('enterprise', 'bf34723d-d4a2-428c-88cc-6bdf6704da4a', true),  -- Ganha-Ganha
('enterprise', '09d31bc9-e4b9-4e57-99f8-38ab5cdb5a17', true),  -- Missões
('enterprise', '3839c0cd-9ac6-4810-9364-4749f417b4a5', true),  -- Domínios
('enterprise', 'f686cd9a-ae72-4d1d-87f9-3f14fe7ad7a5', true);  -- TaxiMachine
