ALTER TABLE public.plan_duelo_prize_ranges
  ADD COLUMN IF NOT EXISTS tier_name text NOT NULL DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Substituir UNIQUE (plan_key, position) por (plan_key, tier_name, position)
ALTER TABLE public.plan_duelo_prize_ranges
  DROP CONSTRAINT IF EXISTS plan_duelo_prize_ranges_plan_key_position_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'plan_duelo_prize_ranges_plan_tier_position_key'
  ) THEN
    ALTER TABLE public.plan_duelo_prize_ranges
      ADD CONSTRAINT plan_duelo_prize_ranges_plan_tier_position_key
      UNIQUE (plan_key, tier_name, position);
  END IF;
END $$;