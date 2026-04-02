
-- 1. Tornar created_by_user_id nullable
ALTER TABLE public.points_ledger
  ALTER COLUMN created_by_user_id DROP NOT NULL;

-- 2. Recriar função com created_by_user_id = NULL explícito
CREATE OR REPLACE FUNCTION public.redeem_city_offer_driver(
  p_customer_id uuid,
  p_offer_id uuid,
  p_brand_id uuid,
  p_branch_id uuid,
  p_customer_cpf text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_offer RECORD;
  v_customer RECORD;
  v_points_cost numeric;
  v_redemption_id uuid;
  v_token text;
BEGIN
  SELECT id, title, value_rescue, min_purchase, offer_purpose, is_active, status
  INTO v_offer
  FROM offers
  WHERE id = p_offer_id
    AND brand_id = p_brand_id
    AND is_active = true
    AND status = 'ACTIVE';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Oferta não encontrada ou inativa');
  END IF;

  SELECT id, points_balance
  INTO v_customer
  FROM customers
  WHERE id = p_customer_id
    AND brand_id = p_brand_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cliente não encontrado');
  END IF;

  v_points_cost := CEIL(COALESCE(v_offer.value_rescue, 0));

  IF v_points_cost <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Oferta sem valor de crédito definido');
  END IF;

  IF v_customer.points_balance < v_points_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo de pontos insuficiente', 'balance', v_customer.points_balance, 'cost', v_points_cost);
  END IF;

  INSERT INTO redemptions (brand_id, branch_id, customer_id, offer_id, customer_cpf, offer_snapshot_json)
  VALUES (
    p_brand_id, p_branch_id, p_customer_id, p_offer_id, p_customer_cpf,
    jsonb_build_object('title', v_offer.title, 'value_rescue', v_offer.value_rescue, 'min_purchase', v_offer.min_purchase)
  )
  RETURNING id, token INTO v_redemption_id, v_token;

  INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
  VALUES (
    p_customer_id, p_brand_id, p_branch_id, 'DEBIT', v_points_cost,
    'Resgate na cidade: ' || v_offer.title, 'REDEMPTION', v_redemption_id, NULL
  );

  UPDATE customers
  SET points_balance = points_balance - v_points_cost
  WHERE id = p_customer_id;

  RETURN jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'token', v_token,
    'points_debited', v_points_cost
  );
END;
$function$;
