
-- 1. Create admin_notifications table
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'general',
  reference_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_admin_notifications_brand_id ON public.admin_notifications(brand_id);
CREATE INDEX idx_admin_notifications_is_read ON public.admin_notifications(brand_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS: users linked to the brand can SELECT
CREATE POLICY "Brand users can view admin notifications"
  ON public.admin_notifications FOR SELECT TO authenticated
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

-- RLS: users linked to the brand can UPDATE (mark as read)
CREATE POLICY "Brand users can update admin notifications"
  ON public.admin_notifications FOR UPDATE TO authenticated
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())))
  WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

-- 2. Trigger function for product redemption orders
CREATE OR REPLACE FUNCTION public.notify_admin_product_redemption()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  v_customer_name text;
  v_product_title text;
  v_points integer;
BEGIN
  v_customer_name := COALESCE(NEW.customer_name, 'Cliente');
  v_product_title := COALESCE(NEW.product_title, 'Produto');
  v_points := COALESCE(NEW.points_cost, 0);

  INSERT INTO public.admin_notifications (brand_id, title, body, type, reference_id)
  VALUES (
    NEW.brand_id,
    'Novo resgate de produto',
    v_customer_name || ' resgatou "' || v_product_title || '" por ' || v_points || ' pts',
    'redemption_product',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_product_redemption_admin_notif
  AFTER INSERT ON public.product_redemption_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_product_redemption();

-- 3. Trigger function for city offer redemptions
CREATE OR REPLACE FUNCTION public.notify_admin_city_redemption()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  v_customer_name text;
  v_offer_title text;
BEGIN
  SELECT name INTO v_customer_name FROM customers WHERE id = NEW.customer_id;
  SELECT title INTO v_offer_title FROM offers WHERE id = NEW.offer_id;

  v_customer_name := COALESCE(v_customer_name, 'Cliente');
  v_offer_title := COALESCE(v_offer_title, 'Oferta');

  INSERT INTO public.admin_notifications (brand_id, title, body, type, reference_id)
  VALUES (
    NEW.brand_id,
    'Novo resgate de oferta',
    v_customer_name || ' resgatou "' || v_offer_title || '"',
    'redemption_city',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_city_redemption_admin_notif
  AFTER INSERT ON public.redemptions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_city_redemption();

-- 4. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
