
-- Tabela de regras de pontuação para motoristas
CREATE TABLE public.driver_points_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  rule_mode TEXT NOT NULL DEFAULT 'PER_REAL',
  points_per_real NUMERIC DEFAULT 1,
  percent_of_passenger NUMERIC DEFAULT 50,
  fixed_points_per_ride INT DEFAULT 10,
  volume_tiers JSONB DEFAULT '[]'::jsonb,
  volume_cycle_days INT DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, branch_id)
);

ALTER TABLE public.driver_points_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read driver_points_rules"
  ON public.driver_points_rules FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert driver_points_rules"
  ON public.driver_points_rules FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update driver_points_rules"
  ON public.driver_points_rules FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- Campos para rastrear ciclo mensal de motorista
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS driver_monthly_ride_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS driver_cycle_start DATE DEFAULT CURRENT_DATE;
