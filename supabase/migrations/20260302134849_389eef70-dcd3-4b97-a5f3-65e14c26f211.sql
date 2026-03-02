
-- Table to track store type upgrade requests (RECEPTORA → EMISSORA/MISTA)
CREATE TABLE public.store_type_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id),
  requested_type text NOT NULL, -- 'EMISSORA' or 'MISTA'
  current_type text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  reason text, -- partner's justification
  rejection_reason text,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid
);

ALTER TABLE public.store_type_requests ENABLE ROW LEVEL SECURITY;

-- Store owners can see and create their own requests
CREATE POLICY "Store owners manage own requests" ON public.store_type_requests
  FOR ALL USING (
    store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid())
  )
  WITH CHECK (
    store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid())
  );

-- Brand admins can see and manage requests for their brand
CREATE POLICY "Brand admins manage brand requests" ON public.store_type_requests
  FOR ALL USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  );
