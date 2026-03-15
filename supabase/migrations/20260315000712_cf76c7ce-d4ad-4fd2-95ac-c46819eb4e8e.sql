
-- Create enum for offer purpose
CREATE TYPE public.offer_purpose AS ENUM ('EARN', 'REDEEM', 'BOTH');

-- Add column to offers table
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS offer_purpose public.offer_purpose NOT NULL DEFAULT 'REDEEM';
