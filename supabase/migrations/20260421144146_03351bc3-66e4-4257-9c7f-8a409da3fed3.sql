CREATE TABLE IF NOT EXISTS public.commercial_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID,
  product_slug TEXT,
  product_name TEXT,
  full_name TEXT NOT NULL,
  work_email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_role TEXT,
  company_size TEXT,
  city TEXT,
  current_solution TEXT,
  interest_message TEXT,
  preferred_contact TEXT DEFAULT 'whatsapp',
  preferred_window TEXT,
  source TEXT DEFAULT 'landing_produto',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'novo',
  assigned_to UUID,
  notes TEXT,
  contacted_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commercial_leads_status ON public.commercial_leads(status);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_product_slug ON public.commercial_leads(product_slug);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_created_at ON public.commercial_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_assigned_to ON public.commercial_leads(assigned_to);

ALTER TABLE public.commercial_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit commercial leads"
  ON public.commercial_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Root admins can view commercial leads"
  ON public.commercial_leads
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Root admins can update commercial leads"
  ON public.commercial_leads
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Root admins can delete commercial leads"
  ON public.commercial_leads
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'::app_role));

CREATE TRIGGER trg_commercial_leads_updated_at
  BEFORE UPDATE ON public.commercial_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_commercial_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.work_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Email inválido: %', NEW.work_email;
  END IF;

  IF length(regexp_replace(NEW.phone, '\D', '', 'g')) < 10 THEN
    RAISE EXCEPTION 'Telefone deve ter pelo menos 10 dígitos';
  END IF;

  IF length(trim(NEW.full_name)) < 3 THEN
    RAISE EXCEPTION 'Nome muito curto';
  END IF;

  IF length(trim(NEW.company_name)) < 2 THEN
    RAISE EXCEPTION 'Nome da empresa muito curto';
  END IF;

  NEW.work_email := lower(trim(NEW.work_email));
  NEW.full_name := trim(NEW.full_name);
  NEW.company_name := trim(NEW.company_name);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_commercial_lead
  BEFORE INSERT OR UPDATE OF work_email, phone, full_name, company_name
  ON public.commercial_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_commercial_lead();