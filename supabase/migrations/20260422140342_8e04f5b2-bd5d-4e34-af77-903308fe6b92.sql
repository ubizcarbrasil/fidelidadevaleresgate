-- Limpeza idempotente das flags de duelo/ranking/cinturão para a marca Meu Mototáxi
-- (modo "Apenas Campeonato"). Mantém o estado consistente mesmo que a UI já filtre.
UPDATE public.branches
   SET branch_settings_json = COALESCE(branch_settings_json, '{}'::jsonb)
       || jsonb_build_object(
            'enable_city_ranking', false,
            'enable_city_belt', false,
            'enable_driver_duels', false,
            'enable_duel_driver_vs_driver', false,
            'enable_duel_sponsored_by_brand', false,
            'enable_duel_side_bets', false,
            'enable_duel_guesses', false,
            'allow_public_duel_viewing', false
          )
 WHERE brand_id = 'f6ca82ea-621c-4e97-8c20-326fc63a8fd0'::uuid;