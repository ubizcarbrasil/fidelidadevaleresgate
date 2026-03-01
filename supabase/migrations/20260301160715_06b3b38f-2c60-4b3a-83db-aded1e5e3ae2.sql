
-- Move pg_trgm to extensions schema to fix the warning
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Recreate the trgm index using the extensions schema
DROP INDEX IF EXISTS idx_taxonomy_segments_name_trgm;
CREATE INDEX idx_taxonomy_segments_name_trgm ON public.taxonomy_segments USING GIN(name extensions.gin_trgm_ops);
