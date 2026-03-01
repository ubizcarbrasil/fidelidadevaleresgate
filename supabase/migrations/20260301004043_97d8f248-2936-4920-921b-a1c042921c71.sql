
-- Sprint B: Unique conditional index on receipt_code for anti-fraud
CREATE UNIQUE INDEX IF NOT EXISTS idx_earning_events_receipt_code_unique
  ON public.earning_events (store_id, receipt_code)
  WHERE receipt_code IS NOT NULL;
