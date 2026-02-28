
-- Feature flags table for global platform configuration
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  scope_type text NOT NULL DEFAULT 'PLATFORM', -- PLATFORM, TENANT, BRAND, BRANCH
  scope_id uuid, -- null = global
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select feature flags" ON public.feature_flags
  FOR SELECT USING (
    user_has_permission(auth.uid(), 'settings.read')
    OR has_role(auth.uid(), 'root_admin'::app_role)
  );

CREATE POLICY "Manage feature flags" ON public.feature_flags
  FOR ALL USING (
    has_role(auth.uid(), 'root_admin'::app_role)
  );

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root can read all audit logs" ON public.audit_logs
  FOR SELECT USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add settings.read permission if missing
INSERT INTO public.permissions (key, module, description)
VALUES ('settings.read', 'settings', 'Read platform settings and feature flags')
ON CONFLICT DO NOTHING;
