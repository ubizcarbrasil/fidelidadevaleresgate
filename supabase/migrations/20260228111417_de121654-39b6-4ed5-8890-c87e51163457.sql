
-- Create the update_updated_at function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Main vouchers table (type and tables already created by previous partial migration)
-- Check if they exist first
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vouchers') THEN
    CREATE TYPE public.voucher_status AS ENUM ('active', 'expired', 'depleted', 'cancelled');

    CREATE TABLE public.vouchers (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      discount_percent NUMERIC(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
      status public.voucher_status NOT NULL DEFAULT 'active',
      max_uses INTEGER NOT NULL DEFAULT 1,
      current_uses INTEGER NOT NULL DEFAULT 0,
      expires_at TIMESTAMP WITH TIME ZONE,
      campaign TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      UNIQUE(code, branch_id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'voucher_redemptions') THEN
    CREATE TABLE public.voucher_redemptions (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
      redeemed_by UUID NOT NULL REFERENCES auth.users(id),
      redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      notes TEXT
    );
  END IF;
END $$;

-- Enable RLS (idempotent)
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist and recreate
DROP POLICY IF EXISTS "Root admins can manage all vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Tenant admins can manage vouchers in their tenant" ON public.vouchers;
DROP POLICY IF EXISTS "Brand admins can manage vouchers in their brands" ON public.vouchers;
DROP POLICY IF EXISTS "Branch admins and operators can manage vouchers in their branch" ON public.vouchers;
DROP POLICY IF EXISTS "Root admins can manage all redemptions" ON public.voucher_redemptions;
DROP POLICY IF EXISTS "Users can view redemptions for accessible vouchers" ON public.voucher_redemptions;
DROP POLICY IF EXISTS "Branch operators can create redemptions" ON public.voucher_redemptions;

CREATE POLICY "Root admins can manage all vouchers"
  ON public.vouchers FOR ALL
  USING (public.has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Tenant admins can manage vouchers in their tenant"
  ON public.vouchers FOR ALL
  USING (branch_id IN (
    SELECT b.id FROM branches b
    JOIN brands br ON b.brand_id = br.id
    WHERE br.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
  ));

CREATE POLICY "Brand admins can manage vouchers in their brands"
  ON public.vouchers FOR ALL
  USING (branch_id IN (
    SELECT b.id FROM branches b
    WHERE b.brand_id IN (SELECT get_user_brand_ids(auth.uid()))
  ));

CREATE POLICY "Branch admins and operators can manage vouchers in their branch"
  ON public.vouchers FOR ALL
  USING (branch_id IN (SELECT get_user_branch_ids(auth.uid())));

CREATE POLICY "Root admins can manage all redemptions"
  ON public.voucher_redemptions FOR ALL
  USING (public.has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Users can view redemptions for accessible vouchers"
  ON public.voucher_redemptions FOR SELECT
  USING (voucher_id IN (SELECT id FROM public.vouchers));

CREATE POLICY "Branch operators can create redemptions"
  ON public.voucher_redemptions FOR INSERT
  WITH CHECK (voucher_id IN (SELECT id FROM public.vouchers));

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_vouchers_updated_at ON public.vouchers;
CREATE TRIGGER update_vouchers_updated_at
  BEFORE UPDATE ON public.vouchers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
