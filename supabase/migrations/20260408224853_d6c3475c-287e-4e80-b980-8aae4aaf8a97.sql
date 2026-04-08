
-- 1. driver_message_templates
CREATE TABLE public.driver_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  body_template text NOT NULL DEFAULT '',
  available_vars text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand admins can manage templates"
  ON public.driver_message_templates FOR ALL
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())))
  WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE TRIGGER update_driver_message_templates_updated_at
  BEFORE UPDATE ON public.driver_message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. driver_message_flows
CREATE TABLE public.driver_message_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  template_id uuid NOT NULL REFERENCES public.driver_message_templates(id) ON DELETE CASCADE,
  audience text NOT NULL DEFAULT 'all_drivers',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_message_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand admins can manage flows"
  ON public.driver_message_flows FOR ALL
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())))
  WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE TRIGGER update_driver_message_flows_updated_at
  BEFORE UPDATE ON public.driver_message_flows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. driver_message_logs
CREATE TABLE public.driver_message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  flow_id uuid REFERENCES public.driver_message_flows(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.driver_message_templates(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  event_type text,
  rendered_message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'sent',
  error_detail text,
  metadata_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand admins can view logs"
  ON public.driver_message_logs FOR SELECT
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE POLICY "Service role can insert logs"
  ON public.driver_message_logs FOR INSERT
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_driver_message_templates_brand ON public.driver_message_templates(brand_id);
CREATE INDEX idx_driver_message_flows_brand ON public.driver_message_flows(brand_id);
CREATE INDEX idx_driver_message_flows_event ON public.driver_message_flows(brand_id, event_type);
CREATE INDEX idx_driver_message_logs_brand ON public.driver_message_logs(brand_id, created_at DESC);
CREATE INDEX idx_driver_message_logs_customer ON public.driver_message_logs(customer_id, created_at DESC);
