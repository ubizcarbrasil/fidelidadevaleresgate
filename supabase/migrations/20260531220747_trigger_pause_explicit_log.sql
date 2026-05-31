-- ============================================================================
-- Trigger update_standings_from_ride — log explícito de skip por pausa
-- ============================================================================
--
-- Bug detectado em auditoria de dados (agente 3):
-- A trigger `campeonato_update_standings_from_ride` rejeitava silenciosamente
-- rides durante pausa, mudança de fase, etc. Resultado: motorista finalizava
-- ride durante pausa, ride sumia do tracking, admin não tinha como auditar.
--
-- DECISÃO DE PRODUTO (resposta do usuário: B):
--   "Ride durante pausa é IGNORADA (pause real, ride não conta)."
--
-- Comportamento mantido (não conta pontos). Mas agora LOGA cada skip em
-- `duelo_attempts_log` com `code` específico, permitindo:
-- - Admin auditar quantas rides foram perdidas em cada pausa
-- - Motorista consultar histórico (futuro: aba "rides não contadas")
-- - Decisão de produto pode reverter (mudar pra A ou C) sem perda de dados
--
-- Códigos de skip:
--   `skip_format_not_campeonato` — brand não usa formato campeonato
--   `skip_no_active_season`      — não há season classification ativa
--   `skip_season_paused`         — season existe mas está pausada (B)
--   `skip_no_membership`         — driver não está em tier dessa season
-- ============================================================================

CREATE OR REPLACE FUNCTION public.campeonato_update_standings_from_ride()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id uuid;
  v_tier_id uuid;
  v_finalized_at timestamptz;
  v_is_weekend boolean;
  v_brand_id uuid;
  v_season_paused boolean;
  v_paused_season_id uuid;
BEGIN
  -- Guards iniciais (mantidos)
  IF NEW.ride_status <> 'FINALIZED' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.ride_status = 'FINALIZED' THEN RETURN NEW; END IF;
  IF NEW.driver_customer_id IS NULL OR NEW.branch_id IS NULL THEN RETURN NEW; END IF;

  -- Resolve brand pra checar formato
  SELECT brand_id INTO v_brand_id FROM public.branches WHERE id = NEW.branch_id;

  -- Skip 1: brand não usa formato campeonato (legacy duelo ou mass_duel)
  IF public.duelo_get_engagement_format(v_brand_id) <> 'campeonato' THEN
    -- Não loga este caso — é o cenário normal pra brands em outros formatos
    -- (logar inflaria a tabela sem ganho de auditoria)
    RETURN NEW;
  END IF;

  v_finalized_at := COALESCE(NEW.finalized_at, now());
  v_is_weekend := public.duelo_is_weekend_at(v_finalized_at, NEW.branch_id);

  -- Tenta achar season classification NÃO pausada cobrindo o timestamp
  SELECT s.id INTO v_season_id
    FROM public.duelo_seasons s
   WHERE s.branch_id = NEW.branch_id
     AND s.phase = 'classification'
     AND s.paused_at IS NULL
     AND v_finalized_at >= s.classification_starts_at
     AND v_finalized_at <  s.classification_ends_at
   ORDER BY s.created_at DESC LIMIT 1;

  IF v_season_id IS NULL THEN
    -- Diagnóstico: existe season cobrindo o timestamp MAS está pausada?
    SELECT s.id, true INTO v_paused_season_id, v_season_paused
      FROM public.duelo_seasons s
     WHERE s.branch_id = NEW.branch_id
       AND s.phase = 'classification'
       AND s.paused_at IS NOT NULL
       AND v_finalized_at >= s.classification_starts_at
       AND v_finalized_at <  s.classification_ends_at
     ORDER BY s.created_at DESC LIMIT 1;

    IF v_paused_season_id IS NOT NULL THEN
      -- SKIP COM LOG: temporada pausada (decisão B)
      INSERT INTO public.duelo_attempts_log(
        code, season_id, driver_id, brand_id, branch_id, ride_id, details_json
      ) VALUES (
        'skip_season_paused',
        v_paused_season_id,
        NEW.driver_customer_id,
        v_brand_id,
        NEW.branch_id,
        NEW.id,
        jsonb_build_object(
          'finalized_at', v_finalized_at,
          'reason', 'Temporada pausada — ride não contabilizada (decisão de produto)'
        )
      );
    ELSE
      -- SKIP COM LOG: nenhuma season classification ativa cobre este timestamp
      INSERT INTO public.duelo_attempts_log(
        code, driver_id, brand_id, branch_id, ride_id, details_json
      ) VALUES (
        'skip_no_active_season',
        NEW.driver_customer_id,
        v_brand_id,
        NEW.branch_id,
        NEW.id,
        jsonb_build_object(
          'finalized_at', v_finalized_at,
          'reason', 'Nenhuma temporada classification ativa cobre este horário'
        )
      );
    END IF;
    RETURN NEW;
  END IF;

  -- Tier membership
  SELECT tm.tier_id INTO v_tier_id
    FROM public.duelo_tier_memberships tm
   WHERE tm.season_id = v_season_id AND tm.driver_id = NEW.driver_customer_id
   LIMIT 1;

  IF v_tier_id IS NULL THEN
    -- SKIP COM LOG (já existia, mas padronizando code)
    INSERT INTO public.duelo_attempts_log(
      code, season_id, driver_id, brand_id, branch_id, ride_id, details_json
    ) VALUES (
      'skip_no_membership',
      v_season_id,
      NEW.driver_customer_id,
      v_brand_id,
      NEW.branch_id,
      NEW.id,
      jsonb_build_object(
        'finalized_at', v_finalized_at,
        'reason', 'Motorista não está em nenhum tier desta temporada'
      )
    );
    RETURN NEW;
  END IF;

  -- Caminho feliz: insere/atualiza standings
  INSERT INTO public.duelo_season_standings(
    season_id, driver_id, tier_id, points, weekend_rides_count,
    last_ride_at, qualified, relegated_auto
  ) VALUES (
    v_season_id, NEW.driver_customer_id, v_tier_id, 1,
    CASE WHEN v_is_weekend THEN 1 ELSE 0 END,
    v_finalized_at, false, false
  )
  ON CONFLICT (season_id, driver_id) DO UPDATE
     SET points = public.duelo_season_standings.points + 1,
         weekend_rides_count = public.duelo_season_standings.weekend_rides_count
                             + CASE WHEN v_is_weekend THEN 1 ELSE 0 END,
         last_ride_at = GREATEST(
           COALESCE(public.duelo_season_standings.last_ride_at, EXCLUDED.last_ride_at),
           EXCLUDED.last_ride_at),
         tier_id = COALESCE(public.duelo_season_standings.tier_id, EXCLUDED.tier_id);

  RETURN NEW;
END;
$$;

-- View auxiliar pra admin auditar rides perdidas por pausa
-- (frontend pode consumir pra mostrar "X rides não contadas durante última pausa")
CREATE OR REPLACE VIEW public.campeonato_rides_skipped_by_pause AS
SELECT
  l.id AS log_id,
  l.season_id,
  s.name AS season_name,
  l.driver_id,
  c.name AS driver_name,
  l.branch_id,
  l.ride_id,
  (l.details_json->>'finalized_at')::timestamptz AS ride_finalized_at,
  l.created_at AS skipped_at,
  l.code,
  l.brand_id
FROM public.duelo_attempts_log l
LEFT JOIN public.duelo_seasons s ON s.id = l.season_id
LEFT JOIN public.customers c ON c.id = l.driver_id
WHERE l.code IN ('skip_season_paused', 'skip_no_active_season', 'skip_no_membership');

COMMENT ON VIEW public.campeonato_rides_skipped_by_pause IS
  'Auditoria de rides que NÃO contaram pontos. Útil pra admin justificar '
  'discrepância entre rides finalizadas e standings.';
