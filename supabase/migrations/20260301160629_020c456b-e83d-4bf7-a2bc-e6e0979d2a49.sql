
-- 1) Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2) Taxonomy Categories
CREATE TABLE IF NOT EXISTS public.taxonomy_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon_name text,
  is_active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.taxonomy_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active taxonomy_categories"
ON public.taxonomy_categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Root admins manage taxonomy_categories"
ON public.taxonomy_categories FOR ALL
USING (has_role(auth.uid(), 'root_admin'::app_role));

-- 3) Taxonomy Segments
CREATE TABLE IF NOT EXISTS public.taxonomy_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.taxonomy_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  aliases text[] NOT NULL DEFAULT '{}',
  keywords text[] NOT NULL DEFAULT '{}',
  related_segment_ids uuid[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, slug)
);

ALTER TABLE public.taxonomy_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active taxonomy_segments"
ON public.taxonomy_segments FOR SELECT
USING (is_active = true);

CREATE POLICY "Root admins manage taxonomy_segments"
ON public.taxonomy_segments FOR ALL
USING (has_role(auth.uid(), 'root_admin'::app_role));

-- 4) Segment synonym learning logs
CREATE TABLE IF NOT EXISTS public.segment_synonym_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  free_text text NOT NULL,
  normalized_text text NOT NULL,
  matched_segment_id uuid REFERENCES public.taxonomy_segments(id) ON DELETE SET NULL,
  match_score numeric NOT NULL DEFAULT 0,
  match_method text,
  was_accepted boolean NOT NULL DEFAULT false,
  store_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.segment_synonym_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root admins manage synonym logs"
ON public.segment_synonym_logs FOR ALL
USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Authenticated can insert synonym logs"
ON public.segment_synonym_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 5) Indexes
CREATE INDEX idx_taxonomy_segments_category ON public.taxonomy_segments(category_id);
CREATE INDEX idx_taxonomy_segments_aliases ON public.taxonomy_segments USING GIN(aliases);
CREATE INDEX idx_taxonomy_segments_keywords ON public.taxonomy_segments USING GIN(keywords);
CREATE INDEX idx_taxonomy_segments_name_trgm ON public.taxonomy_segments USING GIN(name gin_trgm_ops);
CREATE INDEX idx_taxonomy_categories_slug ON public.taxonomy_categories(slug);
CREATE INDEX idx_segment_synonym_logs_text ON public.segment_synonym_logs(normalized_text);
CREATE INDEX idx_segment_synonym_logs_segment ON public.segment_synonym_logs(matched_segment_id);

-- 6) Updated_at triggers
CREATE TRIGGER update_taxonomy_categories_updated_at
BEFORE UPDATE ON public.taxonomy_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_taxonomy_segments_updated_at
BEFORE UPDATE ON public.taxonomy_segments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
