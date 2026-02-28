
-- Table for store employees/operators
CREATE TABLE public.store_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'operator', -- operator, manager
  is_active boolean NOT NULL DEFAULT true,
  invited_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_employees ENABLE ROW LEVEL SECURITY;

-- Store owners can manage their own employees
CREATE POLICY "Store owners manage employees"
ON public.store_employees
FOR ALL
USING (store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid()))
WITH CHECK (store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid()));

-- Admins can read all
CREATE POLICY "Admin read employees"
ON public.store_employees
FOR SELECT
USING (has_role(auth.uid(), 'root_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_store_employees_updated_at
BEFORE UPDATE ON public.store_employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index
CREATE INDEX idx_store_employees_store_id ON public.store_employees(store_id);
