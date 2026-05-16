-- Limpeza cirúrgica da cidade São João - SP da marca Ubiz Shop
DO $$
DECLARE
  v_branch_id uuid := 'c88979ba-2156-489d-a173-c117df0d7772';
  v_brand_id  uuid := 'ff650889-e7f2-46ce-8000-4c76a729ef4e';
  v_real_branch_id uuid;
BEGIN
  SELECT id INTO v_real_branch_id FROM branches WHERE id = v_branch_id AND brand_id = v_brand_id;
  IF v_real_branch_id IS NULL THEN
    RAISE NOTICE 'Branch % não pertence à brand % - abortando', v_branch_id, v_brand_id;
    RETURN;
  END IF;

  -- Tabelas com coluna branch_id (validadas via information_schema)
  DELETE FROM redemptions                  WHERE branch_id = v_branch_id;
  DELETE FROM coupons                      WHERE branch_id = v_branch_id;
  DELETE FROM catalog_cart_orders          WHERE branch_id = v_branch_id;
  DELETE FROM crm_contacts                 WHERE branch_id = v_branch_id;
  DELETE FROM machine_ride_notifications   WHERE branch_id = v_branch_id;
  DELETE FROM product_redemption_orders    WHERE branch_id = v_branch_id;
  DELETE FROM store_catalog_items          WHERE branch_id = v_branch_id;
  DELETE FROM store_catalog_categories     WHERE branch_id = v_branch_id;
  DELETE FROM store_points_rules           WHERE branch_id = v_branch_id;
  DELETE FROM tier_points_rules            WHERE branch_id = v_branch_id;
  DELETE FROM customer_click_events        WHERE branch_id = v_branch_id;
  DELETE FROM points_ledger                WHERE branch_id = v_branch_id;
  DELETE FROM earning_events               WHERE branch_id = v_branch_id;
  DELETE FROM offers                       WHERE branch_id = v_branch_id;
  DELETE FROM customers                    WHERE branch_id = v_branch_id;
  DELETE FROM stores                       WHERE branch_id = v_branch_id;
  DELETE FROM vouchers                     WHERE branch_id = v_branch_id;
  DELETE FROM brand_permission_config      WHERE branch_id = v_branch_id;
  DELETE FROM brand_sub_permission_config  WHERE branch_id = v_branch_id;
  DELETE FROM machine_rides                WHERE branch_id = v_branch_id;
  DELETE FROM machine_integrations         WHERE branch_id = v_branch_id;
  DELETE FROM points_rules                 WHERE branch_id = v_branch_id;
  DELETE FROM branch_wallet_transactions   WHERE branch_id = v_branch_id;
  DELETE FROM branch_points_wallet         WHERE branch_id = v_branch_id;

  UPDATE offers SET redemption_branch_id = NULL WHERE redemption_branch_id = v_branch_id;
  UPDATE profiles SET selected_branch_id = NULL WHERE selected_branch_id = v_branch_id;
  DELETE FROM user_roles WHERE branch_id = v_branch_id;

  DELETE FROM branches WHERE id = v_branch_id;

  RAISE NOTICE 'Branch % e dados removidos', v_branch_id;
END $$;