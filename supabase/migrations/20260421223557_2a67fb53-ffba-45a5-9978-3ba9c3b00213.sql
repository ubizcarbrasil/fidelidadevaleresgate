-- Remover políticas públicas indevidas (mantém RLS por escopo brand/branch)
DROP POLICY IF EXISTS "duelo_season_tiers_public_read" ON public.duelo_season_tiers;
DROP POLICY IF EXISTS "duelo_tier_memberships_public_read" ON public.duelo_tier_memberships;
DROP POLICY IF EXISTS "duelo_driver_tier_history_public_read" ON public.duelo_driver_tier_history;
DROP POLICY IF EXISTS "brand_duelo_prizes_v2_public_read" ON public.brand_duelo_prizes_v2;

-- Permitir que motoristas autenticados vejam seu próprio vínculo / histórico (via customer_id direto)
-- (motorista não autentica via auth.users — acesso é via cliente anônimo + RPC. Para C.1 manter restrito.)