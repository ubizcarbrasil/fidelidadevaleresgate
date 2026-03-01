
-- Add new enum values for section types
ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'MANUAL_LINKS_CAROUSEL';
ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'MANUAL_LINKS_GRID';
ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'LIST_INFO';
ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'GRID_INFO';
ALTER TYPE public.section_type ADD VALUE IF NOT EXISTS 'GRID_LOGOS';
