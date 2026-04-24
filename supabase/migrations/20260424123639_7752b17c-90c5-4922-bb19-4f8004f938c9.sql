
-- Tabela principal de templates
CREATE TABLE public.module_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Itens (módulos) de cada template
CREATE TABLE public.module_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.module_templates(id) ON DELETE CASCADE,
  module_definition_id uuid NOT NULL REFERENCES public.module_definitions(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, module_definition_id)
);

CREATE INDEX idx_module_template_items_template ON public.module_template_items(template_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.tg_module_templates_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_module_templates_touch
  BEFORE UPDATE ON public.module_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_module_templates_touch_updated_at();

-- RLS: somente root_admin
ALTER TABLE public.module_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "root_admin_all_templates"
  ON public.module_templates
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "root_admin_all_template_items"
  ON public.module_template_items
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'::app_role));
