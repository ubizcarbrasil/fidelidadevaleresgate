-- 1. Create plan_module_templates table
CREATE TABLE public.plan_module_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text NOT NULL,
  module_definition_id uuid NOT NULL REFERENCES public.module_definitions(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_key, module_definition_id)
);

-- 2. Add subscription_plan column to brands
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS subscription_plan text NOT NULL DEFAULT 'free';

-- 3. RLS for plan_module_templates
ALTER TABLE public.plan_module_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read plan_module_templates"
  ON public.plan_module_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Root admin can insert plan_module_templates"
  ON public.plan_module_templates FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "Root admin can update plan_module_templates"
  ON public.plan_module_templates FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "Root admin can delete plan_module_templates"
  ON public.plan_module_templates FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'));

CREATE TRIGGER set_updated_at_plan_module_templates
  BEFORE UPDATE ON public.plan_module_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();