-- Add CRM sync fields and tier to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS crm_contact_id uuid REFERENCES public.crm_contacts(id);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS crm_sync_status text DEFAULT 'NONE';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS ride_count integer DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_tier text DEFAULT 'INICIANTE';

-- Add validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_customer_crm_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.crm_sync_status NOT IN ('SYNCED','PENDING','NONE') THEN
    RAISE EXCEPTION 'crm_sync_status must be SYNCED, PENDING, or NONE';
  END IF;
  IF NEW.customer_tier NOT IN ('INICIANTE','BRONZE','PRATA','OURO','DIAMANTE','LENDARIO','GALATICO') THEN
    RAISE EXCEPTION 'customer_tier must be a valid tier';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_customer_crm
  BEFORE INSERT OR UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.validate_customer_crm_fields();

-- Indexes for joins
CREATE INDEX IF NOT EXISTS idx_customers_crm_contact_id ON public.customers(crm_contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_customer_id ON public.crm_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_customer_tier ON public.customers(customer_tier);
CREATE INDEX IF NOT EXISTS idx_customers_crm_sync_status ON public.customers(crm_sync_status);

-- Tier points rules table
CREATE TABLE IF NOT EXISTS public.tier_points_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.brands(id) NOT NULL,
  branch_id uuid REFERENCES public.branches(id) NOT NULL,
  tier text NOT NULL,
  points_per_real numeric NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (brand_id, branch_id, tier)
);

-- Validation trigger for tier_points_rules
CREATE OR REPLACE FUNCTION public.validate_tier_points_rules_tier()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.tier NOT IN ('INICIANTE','BRONZE','PRATA','OURO','DIAMANTE','LENDARIO','GALATICO') THEN
    RAISE EXCEPTION 'tier must be a valid tier value';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_tier_points_rules
  BEFORE INSERT OR UPDATE ON public.tier_points_rules
  FOR EACH ROW EXECUTE FUNCTION public.validate_tier_points_rules_tier();

-- RLS for tier_points_rules
ALTER TABLE public.tier_points_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tier_points_rules for their brand"
  ON public.tier_points_rules FOR SELECT TO authenticated
  USING (brand_id IN (SELECT get_user_brand_ids(auth.uid())) OR has_role(auth.uid(), 'root_admin'));

CREATE POLICY "Brand admins can manage tier_points_rules"
  ON public.tier_points_rules FOR ALL TO authenticated
  USING (brand_id IN (SELECT get_user_brand_ids(auth.uid())) OR has_role(auth.uid(), 'root_admin'))
  WITH CHECK (brand_id IN (SELECT get_user_brand_ids(auth.uid())) OR has_role(auth.uid(), 'root_admin'));