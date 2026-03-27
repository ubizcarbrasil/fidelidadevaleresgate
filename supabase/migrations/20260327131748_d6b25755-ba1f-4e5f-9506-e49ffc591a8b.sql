
-- Migration 3: offer_sync_groups table
CREATE TABLE public.offer_sync_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  source_system TEXT NOT NULL,
  source_group_id TEXT NOT NULL,
  source_group_name TEXT,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT NOT NULL DEFAULT 'pending',
  total_imported INT NOT NULL DEFAULT 0,
  total_active INT NOT NULL DEFAULT 0,
  total_removed INT NOT NULL DEFAULT 0,
  total_reported INT NOT NULL DEFAULT 0,
  sync_version INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brand_id, source_system, source_group_id)
);

ALTER TABLE public.offer_sync_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sync groups"
  ON public.offer_sync_groups FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'root_admin') OR
    public.has_role(auth.uid(), 'brand_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'root_admin') OR
    public.has_role(auth.uid(), 'brand_admin')
  );

CREATE INDEX idx_offer_sync_groups_brand ON public.offer_sync_groups(brand_id, source_system);
