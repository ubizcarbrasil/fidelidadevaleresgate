
-- Credit 1000 points to all existing customers without DEMO_SEED_BONUS
INSERT INTO points_ledger (brand_id, branch_id, customer_id, entry_type, points_amount, money_amount, reason, reference_type, created_by_user_id)
SELECT 
  c.brand_id,
  c.branch_id,
  c.id,
  'CREDIT',
  1000,
  0,
  'DEMO_SEED_BONUS',
  'MANUAL_ADJUSTMENT',
  '00000000-0000-0000-0000-000000000000'
FROM customers c
LEFT JOIN points_ledger pl ON pl.customer_id = c.id AND pl.reason = 'DEMO_SEED_BONUS'
WHERE pl.id IS NULL;

-- Update cached balances
UPDATE customers SET points_balance = points_balance + 1000
WHERE id IN (
  SELECT customer_id FROM points_ledger WHERE reason = 'DEMO_SEED_BONUS'
);
