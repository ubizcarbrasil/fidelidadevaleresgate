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
  v_product_title := COALESCE(NEW.deal_snapshot_json->>'title', 'Produto');
  v_points := COALESCE(NEW.points_spent, 0);

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