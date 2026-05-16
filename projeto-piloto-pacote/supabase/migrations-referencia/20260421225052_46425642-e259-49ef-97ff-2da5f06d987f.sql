-- 1) Remove leitura anônima das faixas comerciais
DROP POLICY IF EXISTS "plan_duelo_prize_ranges_public_read"
  ON public.plan_duelo_prize_ranges;

-- 2) Remove leitura ampla para authenticated (vaza min/max por plano)
DROP POLICY IF EXISTS "plan_duelo_prize_ranges_select_all"
  ON public.plan_duelo_prize_ranges;

-- 3) Remove política duplicada de root (consolida em _root_all)
DROP POLICY IF EXISTS "plan_duelo_prize_ranges_root_only"
  ON public.plan_duelo_prize_ranges;

-- 4) DROPs idempotentes das demais tabelas listadas no alerta
DROP POLICY IF EXISTS "duelo_season_tiers_public_read"        ON public.duelo_season_tiers;
DROP POLICY IF EXISTS "duelo_tier_memberships_public_read"    ON public.duelo_tier_memberships;
DROP POLICY IF EXISTS "duelo_driver_tier_history_public_read" ON public.duelo_driver_tier_history;
DROP POLICY IF EXISTS "brand_duelo_prizes_v2_public_read"     ON public.brand_duelo_prizes_v2;