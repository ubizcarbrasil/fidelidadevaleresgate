
-- Platform-wide configuration (single row, managed by root_admin)
CREATE TABLE public.platform_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages platform_config" ON public.platform_config FOR ALL USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Authenticated read platform_config" ON public.platform_config FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seed the starter kit config
INSERT INTO public.platform_config (key, value_json) VALUES (
  'starter_kit',
  '{"demo_sections_count": 3, "demo_stores_count": 2, "initial_customer_points": 1000, "default_home_template_id": null}'::jsonb
);
