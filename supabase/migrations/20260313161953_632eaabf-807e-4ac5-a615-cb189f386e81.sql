
-- Assign taxonomy segments to demo stores based on their names
-- Alimentação stores
UPDATE stores SET taxonomy_segment_id = '9744c6d2-cd59-4dbe-8780-0bfc932812db' WHERE id = 'efa762b5-a50f-4383-aefa-6919f3e6d169'; -- Lanchonete Sabor -> Lanchonete
UPDATE stores SET taxonomy_segment_id = 'ed7d3a06-c25d-4260-a2dd-b90737ebdbba' WHERE id = 'a3a0b915-0e1d-43e1-938f-d0db28ac41e7'; -- Pizzaria Bella Napoli -> Pizzaria
UPDATE stores SET taxonomy_segment_id = '11273791-ee3b-485c-9f34-9a7a7ed72f13' WHERE id = '62a544fc-f914-4fa2-903f-dcf1eb63d067'; -- Burger House -> Hamburgueria
UPDATE stores SET taxonomy_segment_id = '632afae5-0b59-4a17-bedf-c8a9d8ac3784' WHERE id = '8d79c7e6-9eb4-42b4-82b7-abd2277b23c0'; -- Padaria Pão Quente -> Padaria
UPDATE stores SET taxonomy_segment_id = 'fc7fe625-1011-42ef-813c-ab900c9d69ca' WHERE id = '5c07d32d-8a28-42b7-b969-3e976621677a'; -- Café Aroma -> Cafeteria
UPDATE stores SET taxonomy_segment_id = 'aaca5143-ff70-4d52-81c4-950328327c8d' WHERE id = 'e217353a-38ca-4867-a094-5ffbf3a5d6a2'; -- Açaí da Terra -> Açaiteria
UPDATE stores SET taxonomy_segment_id = 'a551ab59-0e29-4a1b-b636-fb8d976a1bb5' WHERE id = '3023a920-572e-4dbc-9721-5b4667b52661'; -- Gelato Art -> Sorveteria
UPDATE stores SET taxonomy_segment_id = '7d4409b3-eb9d-4415-9571-39e673f865a9' WHERE id = 'c23e59d5-ffb4-4b09-aa5c-b832cde3e10f'; -- Sushi Kaze -> Comida Japonesa
UPDATE stores SET taxonomy_segment_id = 'ad7939b2-8c6e-4d01-a87b-589c512bec32' WHERE id = '9503c2c3-d0b4-4c48-90ff-35f37e4a21f3'; -- Churrascaria Fogo Nobre -> Churrascaria
UPDATE stores SET taxonomy_segment_id = '27028332-aff9-4bde-888f-ba204f040aa9' WHERE id = '8f8b4e07-3347-4b64-b1dc-5945f94d2aec'; -- Verde Vegan -> Restaurante
UPDATE stores SET taxonomy_segment_id = '27028332-aff9-4bde-888f-ba204f040aa9' WHERE id = 'a7e85d63-b330-48bf-bc88-6e23408296fa'; -- Trattoria Italiana -> Restaurante
UPDATE stores SET taxonomy_segment_id = '9744c6d2-cd59-4dbe-8780-0bfc932812db' WHERE id = '3fc30b39-ee18-4fb8-af3f-59798f5f7c14'; -- Pastelão do Zé -> Lanchonete

-- Insert demo banner schedules for this brand
INSERT INTO banner_schedules (brand_id, image_url, title, start_at, end_at, order_index, is_active, link_type)
VALUES
  ('8f76ce52-d6c0-4c90-af67-79957e97e477', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop', 'Ganhe pontos em cada compra!', now() - interval '1 day', now() + interval '90 days', 0, true, 'NONE'),
  ('8f76ce52-d6c0-4c90-af67-79957e97e477', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop', 'Ofertas imperdíveis esta semana', now() - interval '1 day', now() + interval '90 days', 1, true, 'NONE'),
  ('8f76ce52-d6c0-4c90-af67-79957e97e477', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop', 'Novos parceiros na sua cidade', now() - interval '1 day', now() + interval '90 days', 2, true, 'NONE');
