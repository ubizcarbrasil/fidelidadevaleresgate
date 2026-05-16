-- 1) Force PostgREST schema cache reload (resolves "function not found in cache" issue)
COMMENT ON FUNCTION public.duelo_materialize_and_seed_season(uuid) IS 'Materializes tiers and seeds drivers for a duelo season. Auto-reload trigger.';

-- 2) New RPC: batch move drivers to a target tier in a single transaction
CREATE OR REPLACE FUNCTION public.duelo_mover_motoristas_em_lote(
  p_season_id uuid,
  p_driver_ids uuid[],
  p_target_tier_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_branch_id uuid;
  v_target_tier RECORD;
  v_user_id uuid := auth.uid();
  v_driver_id uuid;
  v_moved int := 0;
  v_failed jsonb := '[]'::jsonb;
  v_existing_participant RECORD;
BEGIN
  -- Validate season exists and grab scope
  SELECT s.brand_id, s.branch_id INTO v_brand_id, v_branch_id
  FROM duelo_seasons s
  WHERE s.id = p_season_id;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Temporada não encontrada' USING ERRCODE = 'P0002';
  END IF;

  -- Authorization: must be admin of the brand
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = v_user_id
      AND ur.brand_id = v_brand_id
      AND ur.role IN ('BRAND_ADMIN','TENANT_ADMIN','ROOT_ADMIN','BRANCH_ADMIN')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para gerenciar essa temporada' USING ERRCODE = '42501';
  END IF;

  -- Validate target tier belongs to the season
  SELECT t.id, t.tier_name, t.target_size
  INTO v_target_tier
  FROM duelo_tiers t
  WHERE t.id = p_target_tier_id AND t.season_id = p_season_id;

  IF v_target_tier.id IS NULL THEN
    RAISE EXCEPTION 'Série de destino não pertence à temporada' USING ERRCODE = 'P0002';
  END IF;

  -- Iterate drivers
  FOREACH v_driver_id IN ARRAY p_driver_ids LOOP
    BEGIN
      -- Check if driver already participates in the season (any tier)
      SELECT p.id, p.tier_id
      INTO v_existing_participant
      FROM duelo_participants p
      WHERE p.season_id = p_season_id AND p.customer_id = v_driver_id
      LIMIT 1;

      IF v_existing_participant.id IS NOT NULL THEN
        -- Move: update tier
        UPDATE duelo_participants
        SET tier_id = p_target_tier_id,
            assignment_source = 'manual',
            updated_at = now()
        WHERE id = v_existing_participant.id;
      ELSE
        -- Insert new participant
        INSERT INTO duelo_participants (
          season_id, tier_id, customer_id, brand_id, branch_id,
          assignment_source, joined_at
        ) VALUES (
          p_season_id, p_target_tier_id, v_driver_id, v_brand_id, v_branch_id,
          'manual', now()
        );
      END IF;

      v_moved := v_moved + 1;
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed || jsonb_build_object(
        'driver_id', v_driver_id,
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'moved', v_moved,
    'failed', v_failed,
    'target_tier_id', p_target_tier_id,
    'target_tier_name', v_target_tier.tier_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.duelo_mover_motoristas_em_lote(uuid, uuid[], uuid) TO authenticated;

-- 3) Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';