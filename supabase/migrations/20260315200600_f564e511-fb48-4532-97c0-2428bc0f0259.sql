
-- Link Gráfica stores to existing Gráfica e Impressão segment
UPDATE stores SET taxonomy_segment_id = (SELECT id FROM taxonomy_segments WHERE name = 'Gráfica e Impressão' LIMIT 1)
WHERE brand_id = 'effc4685-375e-40c8-8a44-d71bd550f422' AND taxonomy_segment_id IS NULL AND segment = 'Gráfica';
