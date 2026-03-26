ALTER TABLE public.mirror_sync_config ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'divulgador_inteligente';

-- Drop unique constraint on brand_id if exists, to allow multiple configs per brand
ALTER TABLE public.mirror_sync_config DROP CONSTRAINT IF EXISTS mirror_sync_config_brand_id_key;

-- Add unique constraint on brand_id + source_type
ALTER TABLE public.mirror_sync_config ADD CONSTRAINT mirror_sync_config_brand_source_unique UNIQUE (brand_id, source_type);