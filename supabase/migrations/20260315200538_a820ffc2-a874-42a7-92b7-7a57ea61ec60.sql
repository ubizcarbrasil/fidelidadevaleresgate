
-- Add missing taxonomy segments with slug
INSERT INTO taxonomy_segments (name, slug, category_id, aliases, keywords) VALUES
  ('Salão de Beleza', 'salao-de-beleza', '5aabed72-2a4d-46fb-b7b2-4c48ff92b3d8', ARRAY['cabeleireiro','hair salon'], ARRAY['cabelo','corte','tintura','escova']),
  ('Nail Designer', 'nail-designer', '5aabed72-2a4d-46fb-b7b2-4c48ff92b3d8', ARRAY['manicure','pedicure','unhas'], ARRAY['unha','nail','esmalte','gel']),
  ('Clínica Estética', 'clinica-estetica', '5aabed72-2a4d-46fb-b7b2-4c48ff92b3d8', ARRAY['estética','clinica de estetica'], ARRAY['botox','peeling','limpeza de pele','harmonização']),
  ('Pilates', 'pilates', 'b5350029-e6bb-45ba-8732-fd1501cc9db3', ARRAY['studio pilates'], ARRAY['pilates','alongamento','postura']),
  ('Cervejaria', 'cervejaria', '7a60c177-43bf-41aa-a18e-a34a7ad8c5e3', ARRAY['brewery','cervejaria artesanal'], ARRAY['cerveja','chopp','craft beer']),
  ('Loja de Cosméticos', 'loja-de-cosmeticos', '5aabed72-2a4d-46fb-b7b2-4c48ff92b3d8', ARRAY['cosmeticos','perfumaria'], ARRAY['cosmético','maquiagem','perfume','skincare']),
  ('Loja de Eletrônicos', 'loja-de-eletronicos', '514cdef1-949c-4053-82b4-dfe2ef4f2638', ARRAY['eletronicos','tech store'], ARRAY['celular','notebook','fone','gadget']),
  ('Loja de Vinhos', 'loja-de-vinhos', '7a60c177-43bf-41aa-a18e-a34a7ad8c5e3', ARRAY['adega','wine shop'], ARRAY['vinho','espumante','champagne']),
  ('Material Elétrico', 'material-eletrico', '93fadc4c-ae15-4dfe-9c59-c707d9f7a31c', ARRAY['elétrica','boa luz'], ARRAY['fio','disjuntor','tomada','lâmpada']),
  ('Ferragens', 'ferragens', '93fadc4c-ae15-4dfe-9c59-c707d9f7a31c', ARRAY['casa dos parafusos','ferragem'], ARRAY['parafuso','prego','ferramenta','chave']),
  ('Mercadinho', 'mercadinho', '7a60c177-43bf-41aa-a18e-a34a7ad8c5e3', ARRAY['minimercado','mercearia'], ARRAY['mercado','compras','mercearia']),
  ('Escola de Idiomas', 'escola-de-idiomas', '11877c2b-48e3-450b-9726-5f477a80534f', ARRAY['curso de idiomas','language school'], ARRAY['inglês','espanhol','idioma','curso']),
  ('Estacionamento', 'estacionamento', '4861892f-1d38-4b39-9ae6-17bafe96d0d8', ARRAY['parking','garagem'], ARRAY['estacionar','vaga','carro']),
  ('Estúdio de Tatuagem', 'estudio-de-tatuagem', '5aabed72-2a4d-46fb-b7b2-4c48ff92b3d8', ARRAY['tattoo','tatuagem'], ARRAY['tattoo','piercing','body art'])
ON CONFLICT DO NOTHING;

-- Update stores linking taxonomy_segment_id by matching segment name
UPDATE stores SET taxonomy_segment_id = ts.id
FROM taxonomy_segments ts
WHERE stores.brand_id = 'effc4685-375e-40c8-8a44-d71bd550f422'
  AND stores.taxonomy_segment_id IS NULL
  AND lower(stores.segment) = lower(ts.name);

-- Ateliê de Costura → Costura e Ajustes
UPDATE stores SET taxonomy_segment_id = (SELECT id FROM taxonomy_segments WHERE name = 'Costura e Ajustes' LIMIT 1)
WHERE brand_id = 'effc4685-375e-40c8-8a44-d71bd550f422' AND taxonomy_segment_id IS NULL AND segment = 'Ateliê de Costura';

-- Estúdio de Tatuagem fallback → Tatuagem
UPDATE stores SET taxonomy_segment_id = (SELECT id FROM taxonomy_segments WHERE name = 'Tatuagem' LIMIT 1)
WHERE brand_id = 'effc4685-375e-40c8-8a44-d71bd550f422' AND taxonomy_segment_id IS NULL AND segment = 'Estúdio de Tatuagem';
