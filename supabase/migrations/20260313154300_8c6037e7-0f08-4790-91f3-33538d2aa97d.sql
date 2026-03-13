
CREATE TABLE public.sponsored_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  priority int NOT NULL DEFAULT 0,
  placement_type text NOT NULL DEFAULT 'HOME_BOOST',
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sponsored_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sponsored placements"
  ON public.sponsored_placements FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Brand admins manage sponsored placements"
  ON public.sponsored_placements FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'root_admin')
    OR brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'root_admin')
    OR brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
  );

CREATE INDEX idx_sponsored_active ON public.sponsored_placements (brand_id, is_active, ends_at);
