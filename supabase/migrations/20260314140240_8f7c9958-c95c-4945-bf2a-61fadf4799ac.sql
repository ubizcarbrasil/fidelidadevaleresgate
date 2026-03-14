
-- Add branch_id to machine_integrations
ALTER TABLE public.machine_integrations
  ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Drop old unique constraint on brand_id only
ALTER TABLE public.machine_integrations
  DROP CONSTRAINT machine_integrations_brand_id_unique;

-- Add new unique constraint on (brand_id, branch_id)
ALTER TABLE public.machine_integrations
  ADD CONSTRAINT machine_integrations_brand_branch_unique UNIQUE (brand_id, branch_id);

-- Also add branch_id to machine_rides for tracking which branch a ride belongs to
ALTER TABLE public.machine_rides
  ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
