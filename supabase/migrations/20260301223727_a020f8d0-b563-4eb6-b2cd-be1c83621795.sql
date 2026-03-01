
-- Add per-banner height and link_label to banner_schedules
ALTER TABLE public.banner_schedules
  ADD COLUMN IF NOT EXISTS height text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS link_label text NULL;

COMMENT ON COLUMN public.banner_schedules.height IS 'Banner display height: small, medium, large, full';
COMMENT ON COLUMN public.banner_schedules.link_label IS 'Optional label for the link button on the banner';
