-- Add taxonomy_segment_id to stores table
ALTER TABLE public.stores 
ADD COLUMN taxonomy_segment_id uuid REFERENCES public.taxonomy_segments(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_stores_taxonomy_segment_id ON public.stores(taxonomy_segment_id);