
CREATE TABLE public.brand_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'default',
  api_key_hash text NOT NULL,
  api_key_prefix text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  created_by uuid
);

ALTER TABLE public.brand_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand admins manage api keys" ON public.brand_api_keys
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'root_admin'::app_role) 
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  )
  WITH CHECK (
    has_role(auth.uid(), 'root_admin'::app_role) 
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  );
