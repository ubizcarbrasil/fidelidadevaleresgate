
WITH ledger_totals AS (
  SELECT
    customer_id,
    brand_id,
    branch_id,
    SUM(CASE WHEN entry_type = 'CREDIT' THEN points_amount ELSE 0 END)
    - SUM(CASE WHEN entry_type = 'DEBIT' THEN points_amount ELSE 0 END) AS ledger_net
  FROM points_ledger
  GROUP BY customer_id, brand_id, branch_id
),
drifted AS (
  SELECT
    c.id AS customer_id,
    c.brand_id,
    c.branch_id,
    COALESCE(c.points_balance, 0) AS current_balance,
    COALESCE(lt.ledger_net, 0) AS ledger_net,
    COALESCE(c.points_balance, 0) - COALESCE(lt.ledger_net, 0) AS drift
  FROM customers c
  LEFT JOIN ledger_totals lt ON lt.customer_id = c.id
  WHERE COALESCE(c.points_balance, 0) - COALESCE(lt.ledger_net, 0) <> 0
)
INSERT INTO points_ledger (
  customer_id, brand_id, branch_id,
  entry_type, points_amount, money_amount,
  reason, reference_type
)
SELECT
  customer_id,
  brand_id,
  branch_id,
  (CASE WHEN drift > 0 THEN 'CREDIT' ELSE 'DEBIT' END)::ledger_entry_type,
  ABS(drift),
  0,
  'Ajuste de reconciliação — sincronização ledger/saldo',
  'MANUAL_ADJUSTMENT'::ledger_reference_type
FROM drifted;
