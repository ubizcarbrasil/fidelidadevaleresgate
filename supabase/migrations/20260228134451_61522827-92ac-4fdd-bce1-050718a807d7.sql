
-- Enums
CREATE TYPE public.offer_status AS ENUM ('DRAFT','PENDING','APPROVED','ACTIVE','EXPIRED');
CREATE TYPE public.redemption_status AS ENUM ('PENDING','USED','EXPIRED','CANCELED');

-- 1) stores
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  name text NOT NULL,
  slug text NOT NULL,
  logo_url text,
  category text,
  address text,
  whatsapp text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(branch_id, slug)
);
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read active stores
CREATE POLICY "Anon read active stores" ON public.stores FOR SELECT USING (is_active = true);
-- Authenticated read
CREATE POLICY "Select stores" ON public.stores FOR SELECT USING (
  user_has_permission(auth.uid(), 'stores.read')
  OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
  OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
);
CREATE POLICY "Insert stores" ON public.stores FOR INSERT WITH CHECK (
  user_has_permission(auth.uid(), 'stores.create')
  AND (has_role(auth.uid(), 'root_admin') OR brand_id IN (SELECT get_user_brand_ids(auth.uid())) OR branch_id IN (SELECT get_user_branch_ids(auth.uid())))
);
CREATE POLICY "Update stores" ON public.stores FOR UPDATE USING (
  user_has_permission(auth.uid(), 'stores.update')
  AND (has_role(auth.uid(), 'root_admin') OR brand_id IN (SELECT get_user_brand_ids(auth.uid())) OR branch_id IN (SELECT get_user_branch_ids(auth.uid())))
);
CREATE POLICY "Delete stores" ON public.stores FOR DELETE USING (
  user_has_permission(auth.uid(), 'stores.delete')
  AND (has_role(auth.uid(), 'root_admin') OR brand_id IN (SELECT get_user_brand_ids(auth.uid())) OR branch_id IN (SELECT get_user_branch_ids(auth.uid())))
);

-- 2) offers
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  store_id uuid NOT NULL REFERENCES public.stores(id),
  title text NOT NULL,
  image_url text,
  description text,
  value_rescue numeric NOT NULL DEFAULT 0,
  min_purchase numeric NOT NULL DEFAULT 0,
  start_at timestamptz,
  end_at timestamptz,
  allowed_weekdays integer[] DEFAULT '{0,1,2,3,4,5,6}',
  allowed_hours text,
  max_daily_redemptions integer,
  status offer_status NOT NULL DEFAULT 'DRAFT',
  is_active boolean NOT NULL DEFAULT true,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validation: offer branch must match store branch
CREATE OR REPLACE FUNCTION public.validate_offer_branch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM stores WHERE id = NEW.store_id AND branch_id = NEW.branch_id AND brand_id = NEW.brand_id) THEN
    RAISE EXCEPTION 'Offer brand_id/branch_id must match the store';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_offer_branch BEFORE INSERT OR UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.validate_offer_branch();

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon read active offers" ON public.offers FOR SELECT USING (is_active = true AND status = 'ACTIVE');
CREATE POLICY "Select offers" ON public.offers FOR SELECT USING (
  user_has_permission(auth.uid(), 'offers.read')
  OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
  OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
);
CREATE POLICY "Insert offers" ON public.offers FOR INSERT WITH CHECK (
  user_has_permission(auth.uid(), 'offers.create')
  AND (has_role(auth.uid(), 'root_admin') OR brand_id IN (SELECT get_user_brand_ids(auth.uid())) OR branch_id IN (SELECT get_user_branch_ids(auth.uid())))
);
CREATE POLICY "Update offers" ON public.offers FOR UPDATE USING (
  user_has_permission(auth.uid(), 'offers.update')
  AND (has_role(auth.uid(), 'root_admin') OR brand_id IN (SELECT get_user_brand_ids(auth.uid())) OR branch_id IN (SELECT get_user_branch_ids(auth.uid())))
);
CREATE POLICY "Delete offers" ON public.offers FOR DELETE USING (
  user_has_permission(auth.uid(), 'offers.delete')
  AND (has_role(auth.uid(), 'root_admin') OR brand_id IN (SELECT get_user_brand_ids(auth.uid())) OR branch_id IN (SELECT get_user_branch_ids(auth.uid())))
);

-- 3) customers
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  brand_id uuid NOT NULL REFERENCES public.brands(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  name text NOT NULL,
  phone text,
  points_balance numeric NOT NULL DEFAULT 0,
  money_balance numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select own customer" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Select customers (admin)" ON public.customers FOR SELECT USING (
  user_has_permission(auth.uid(), 'customers.read')
  AND (has_role(auth.uid(), 'root_admin') OR brand_id IN (SELECT get_user_brand_ids(auth.uid())) OR branch_id IN (SELECT get_user_branch_ids(auth.uid())))
);
CREATE POLICY "Insert customers" ON public.customers FOR INSERT WITH CHECK (
  user_has_permission(auth.uid(), 'customers.create')
  OR auth.uid() = user_id
);
CREATE POLICY "Update customers" ON public.customers FOR UPDATE USING (
  user_has_permission(auth.uid(), 'customers.update')
  AND (has_role(auth.uid(), 'root_admin') OR brand_id IN (SELECT get_user_brand_ids(auth.uid())) OR branch_id IN (SELECT get_user_branch_ids(auth.uid())))
  OR auth.uid() = user_id
);

-- 4) redemptions
CREATE TABLE public.redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  offer_id uuid NOT NULL REFERENCES public.offers(id),
  token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  qr_data text,
  status redemption_status NOT NULL DEFAULT 'PENDING',
  purchase_value numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  used_at timestamptz
);

-- Validation: redemption branch must match offer branch and customer branch
CREATE OR REPLACE FUNCTION public.validate_redemption_branch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM offers WHERE id = NEW.offer_id AND branch_id = NEW.branch_id AND brand_id = NEW.brand_id) THEN
    RAISE EXCEPTION 'Redemption branch/brand must match the offer';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM customers WHERE id = NEW.customer_id AND branch_id = NEW.branch_id AND brand_id = NEW.brand_id) THEN
    RAISE EXCEPTION 'Redemption branch/brand must match the customer';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_redemption_branch BEFORE INSERT OR UPDATE ON public.redemptions FOR EACH ROW EXECUTE FUNCTION public.validate_redemption_branch();

ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select own redemptions" ON public.redemptions FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Select redemptions (admin)" ON public.redemptions FOR SELECT USING (
  user_has_permission(auth.uid(), 'redemptions.read')
  AND (has_role(auth.uid(), 'root_admin') OR brand_id IN (SELECT get_user_brand_ids(auth.uid())) OR branch_id IN (SELECT get_user_branch_ids(auth.uid())))
);
CREATE POLICY "Insert redemptions" ON public.redemptions FOR INSERT WITH CHECK (
  user_has_permission(auth.uid(), 'redemptions.create')
  OR customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "Update redemptions" ON public.redemptions FOR UPDATE USING (
  user_has_permission(auth.uid(), 'redemptions.update')
  AND (has_role(auth.uid(), 'root_admin') OR brand_id IN (SELECT get_user_brand_ids(auth.uid())) OR branch_id IN (SELECT get_user_branch_ids(auth.uid())))
);

-- Add new permissions for the new modules
INSERT INTO public.permissions (key, module, description) VALUES
  ('stores.create','stores','Criar lojas'),
  ('stores.read','stores','Visualizar lojas'),
  ('stores.update','stores','Editar lojas'),
  ('stores.delete','stores','Excluir lojas'),
  ('offers.create','offers','Criar ofertas'),
  ('offers.read','offers','Visualizar ofertas'),
  ('offers.update','offers','Editar ofertas'),
  ('offers.delete','offers','Excluir ofertas'),
  ('offers.approve','offers','Aprovar ofertas'),
  ('customers.create','customers','Cadastrar clientes'),
  ('customers.read','customers','Visualizar clientes'),
  ('customers.update','customers','Editar clientes'),
  ('redemptions.create','redemptions','Criar resgates'),
  ('redemptions.read','redemptions','Visualizar resgates'),
  ('redemptions.update','redemptions','Atualizar resgates (usar/cancelar)')
ON CONFLICT DO NOTHING;

-- Map permissions to existing roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'root_admin' AND p.module IN ('stores','offers','customers','redemptions')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'tenant_admin' AND p.module IN ('stores','offers','customers','redemptions')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'brand_admin' AND p.module IN ('stores','offers','customers','redemptions')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'branch_admin' AND p.module IN ('stores','offers','customers','redemptions')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'store_admin' AND p.key IN ('stores.read','stores.update','offers.create','offers.read','offers.update','offers.delete','redemptions.read')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'operator_pdv' AND p.key IN ('offers.read','customers.read','customers.create','redemptions.create','redemptions.read','redemptions.update')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'customer' AND p.key IN ('offers.read','stores.read','redemptions.create','redemptions.read')
ON CONFLICT DO NOTHING;
