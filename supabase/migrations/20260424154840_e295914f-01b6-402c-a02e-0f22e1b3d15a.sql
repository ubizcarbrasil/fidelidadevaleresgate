-- ============================================================
-- Sub-fase 7.1 — Reorganização de módulos core
-- ============================================================
-- Reduz a flag is_core apenas ao mínimo estrutural (3 módulos)
-- e limpa brand_modules desalinhados das marcas existentes.
-- ============================================================

-- 1) Reduzir is_core: manter apenas brand_settings, subscription, users_management
UPDATE public.module_definitions
   SET is_core = false,
       updated_at = now()
 WHERE key IN (
   'csv_import', 'customers', 'home_sections',
   'offers', 'redemption_qr', 'stores', 'wallet'
 )
   AND is_core = true;

-- Garante que os 3 cores remanescentes estão marcados corretamente
UPDATE public.module_definitions
   SET is_core = true,
       updated_at = now()
 WHERE key IN ('brand_settings', 'subscription', 'users_management')
   AND is_core = false;

-- 2) Data-fix: limpar brand_modules desalinhados
-- Para cada marca, manter apenas:
--   (a) módulos presentes no plan_module_templates do plano atual
--   (b) módulos cores remanescentes (brand_settings, subscription, users_management)
--   (c) módulos vindos de business_model_modules required
DO $$
DECLARE
  v_brand record;
  v_kept_ids uuid[];
  v_deleted_count int;
  v_total_deleted int := 0;
  v_brands_affected int := 0;
BEGIN
  FOR v_brand IN
    SELECT b.id, b.name, b.subscription_plan
      FROM public.brands b
     WHERE b.subscription_plan IS NOT NULL
  LOOP
    -- Conjunto de IDs permitidos para esta marca
    SELECT array_agg(DISTINCT module_id) INTO v_kept_ids
      FROM (
        -- (a) módulos do template do plano atual
        SELECT pmt.module_definition_id AS module_id
          FROM public.plan_module_templates pmt
         WHERE pmt.plan_key = v_brand.subscription_plan

        UNION

        -- (b) módulos core remanescentes
        SELECT md.id
          FROM public.module_definitions md
         WHERE md.is_core = true
           AND md.is_active = true

        UNION

        -- (c) módulos required dos business_models ativos da marca
        SELECT bmm.module_definition_id
          FROM public.brand_business_models bbm
          JOIN public.business_model_modules bmm
            ON bmm.business_model_id = bbm.business_model_id
         WHERE bbm.brand_id = v_brand.id
           AND bbm.is_enabled = true
           AND bmm.is_required = true
      ) allowed;

    IF v_kept_ids IS NULL THEN
      v_kept_ids := ARRAY[]::uuid[];
    END IF;

    -- Deleta brand_modules fora do conjunto permitido
    WITH deleted AS (
      DELETE FROM public.brand_modules
       WHERE brand_id = v_brand.id
         AND module_definition_id <> ALL(v_kept_ids)
      RETURNING module_definition_id
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;

    IF v_deleted_count > 0 THEN
      v_brands_affected := v_brands_affected + 1;
      v_total_deleted := v_total_deleted + v_deleted_count;

      INSERT INTO public.audit_logs (
        actor_user_id, entity_type, entity_id, action,
        scope_type, scope_id, details_json
      ) VALUES (
        NULL, 'brand_modules_cleanup', v_brand.id,
        'cleanup_after_is_core_reduction', 'BRAND', v_brand.id,
        jsonb_build_object(
          'brand_name', v_brand.name,
          'subscription_plan', v_brand.subscription_plan,
          'modules_deleted', v_deleted_count,
          'reason', 'is_core_scope_reduction_phase_7_1'
        )
      );
    END IF;
  END LOOP;

  RAISE NOTICE 'Cleanup complete: % marcas afetadas, % brand_modules removidos',
               v_brands_affected, v_total_deleted;
END $$;