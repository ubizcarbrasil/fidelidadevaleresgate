
ALTER TABLE public.custom_pages
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS search_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibility_type text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS visibility_config_json jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS banner_config_json jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS page_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;
