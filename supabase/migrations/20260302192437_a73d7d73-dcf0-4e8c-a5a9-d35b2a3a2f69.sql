-- Add badge customization JSON column to offers table
ALTER TABLE public.offers ADD COLUMN badge_config_json jsonb DEFAULT NULL;

COMMENT ON COLUMN public.offers.badge_config_json IS 'Custom badge config: {bg_color, text_color, text_template, icon}. Overrides brand default when set.';