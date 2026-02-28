
-- Table for white-label domain → brand mapping
CREATE TABLE public.brand_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_domains ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can resolve a domain (needed before auth)
CREATE POLICY "Anyone can read brand domains"
  ON public.brand_domains FOR SELECT
  USING (true);

-- Root admins manage all
CREATE POLICY "Root admins can manage brand domains"
  ON public.brand_domains FOR ALL
  USING (has_role(auth.uid(), 'root_admin'::app_role));

-- Tenant admins manage domains of their brands
CREATE POLICY "Tenant admins can manage brand domains"
  ON public.brand_domains FOR ALL
  USING (brand_id IN (
    SELECT b.id FROM brands b
    WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
  ));

-- Brand admins manage own domains
CREATE POLICY "Brand admins can manage own brand domains"
  ON public.brand_domains FOR ALL
  USING (brand_id IN (SELECT get_user_brand_ids(auth.uid())));

-- Add selected_branch_id to profiles for branch persistence
ALTER TABLE public.profiles
  ADD COLUMN selected_branch_id UUID REFERENCES public.branches(id);
