-- Allow customers to insert DEBIT entries in points_ledger for their own redemptions
CREATE POLICY "Customer insert debit on redemption"
  ON public.points_ledger
  FOR INSERT
  TO authenticated
  WITH CHECK (
    entry_type = 'DEBIT'
    AND reference_type = 'REDEMPTION'
    AND customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );