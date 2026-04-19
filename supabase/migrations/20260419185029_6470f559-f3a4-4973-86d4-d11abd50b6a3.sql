-- ============================================================
-- Sub-fase 5.7 — Trigger sync_brand_modules_from_business_models
-- ============================================================
-- Mantém public.brand_modules sincronizado quando linhas de
-- public.brand_business_models são inseridas, atualizadas ou
-- removidas. Apenas módulos REQUIRED são afetados; módulos CORE
-- e OPTIONAL nunca são tocados pelo trigger.
--
-- Ao DESLIGAR um modelo, só desabilita módulos REQUIRED que
-- nenhum outro modelo ativo da mesma brand ainda exija.
--
-- Audit: 1 linha por evento em public.audit_logs com snapshot
-- completo dos módulos afetados em details_json.
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_brand_modules_from_business_models()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id           uuid;
  v_business_model_id  uuid;
  v_model_key          text;
  v_op                 text;
  v_old_enabled        boolean;
  v_new_enabled        boolean;
  v_should_enable      boolean := false;
  v_should_disable     boolean := false;

  v_required_modules   uuid[];
  v_required_keys      text[] := ARRAY[]::text[];
  v_enabled_keys       text[] := ARRAY[]::text[];
  v_disabled_keys      text[] := ARRAY[]::text[];
  v_skipped_shared     text[] := ARRAY[]::text[];
  v_skipped_core       text[] := ARRAY[]::text[];

  r record;
  v_other_uses_it      boolean;
BEGIN
  -- 1. Resolver contexto e operação
  IF TG_OP = 'DELETE' THEN
    v_brand_id          := OLD.brand_id;
    v_business_model_id := OLD.business_model_id;
    v_old_enabled       := OLD.is_enabled;
    v_new_enabled       := false;
    v_op                := 'DELETE';
  ELSE
    v_brand_id          := NEW.brand_id;
    v_business_model_id := NEW.business_model_id;
    v_new_enabled       := NEW.is_enabled;
    v_old_enabled       := COALESCE(OLD.is_enabled, false);
    v_op                := TG_OP;
  END IF;

  -- 2. Decidir se há trabalho a fazer
  IF v_old_enabled = false AND v_new_enabled = true THEN
    v_should_enable := true;
  ELSIF v_old_enabled = true AND v_new_enabled = false THEN
    v_should_disable := true;
  ELSE
    -- INSERT com is_enabled=false ou UPDATE sem mudar is_enabled
    -- (ex: ajuste de margem GG). Nada a sincronizar.
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- 3. Buscar key do modelo (para audit)
  SELECT bm.key INTO v_model_key
  FROM public.business_models bm
  WHERE bm.id = v_business_model_id;

  -- 4. Buscar IDs e KEYs dos módulos REQUIRED do modelo
  SELECT array_agg(bmm.module_definition_id),
         array_agg(md.key)
    INTO v_required_modules, v_required_keys
  FROM public.business_model_modules bmm
  JOIN public.module_definitions md ON md.id = bmm.module_definition_id
  WHERE bmm.business_model_id = v_business_model_id
    AND bmm.is_required = true;

  IF v_required_modules IS NULL OR array_length(v_required_modules, 1) IS NULL THEN
    -- Modelo sem módulos REQUIRED — registra audit "noop"
    INSERT INTO public.audit_logs (
      actor_user_id, entity_type, entity_id, action, scope_type, scope_id, details_json
    ) VALUES (
      NULL, 'sync_trigger', v_brand_id, 'brand_modules_synced', 'BRAND', v_brand_id,
      jsonb_build_object(
        'trigger_op', v_op,
        'business_model_id', v_business_model_id,
        'business_model_key', v_model_key,
        'is_enabled_old', v_old_enabled,
        'is_enabled_new', v_new_enabled,
        'modules_required', '[]'::jsonb,
        'noop_reason', 'no_required_modules'
      )
    );
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- 5. CASE ENABLE: UPSERT cada módulo REQUIRED como is_enabled=true
  IF v_should_enable THEN
    FOR r IN
      SELECT md.id, md.key, md.is_core
      FROM public.module_definitions md
      WHERE md.id = ANY(v_required_modules)
    LOOP
      IF r.is_core THEN
        v_skipped_core := array_append(v_skipped_core, r.key);
        CONTINUE;
      END IF;

      INSERT INTO public.brand_modules (brand_id, module_definition_id, is_enabled)
      VALUES (v_brand_id, r.id, true)
      ON CONFLICT (brand_id, module_definition_id)
      DO UPDATE SET is_enabled = true, updated_at = now();

      v_enabled_keys := array_append(v_enabled_keys, r.key);
    END LOOP;

  -- 6. CASE DISABLE: só desliga módulos não compartilhados com
  --    outro modelo ativo da mesma brand.
  ELSIF v_should_disable THEN
    FOR r IN
      SELECT md.id, md.key, md.is_core
      FROM public.module_definitions md
      WHERE md.id = ANY(v_required_modules)
    LOOP
      IF r.is_core THEN
        v_skipped_core := array_append(v_skipped_core, r.key);
        CONTINUE;
      END IF;

      SELECT EXISTS (
        SELECT 1
        FROM public.brand_business_models bbm
        JOIN public.business_model_modules bmm
          ON bmm.business_model_id = bbm.business_model_id
        WHERE bbm.brand_id = v_brand_id
          AND bbm.is_enabled = true
          AND bbm.business_model_id <> v_business_model_id
          AND bmm.module_definition_id = r.id
          AND bmm.is_required = true
      ) INTO v_other_uses_it;

      IF v_other_uses_it THEN
        v_skipped_shared := array_append(v_skipped_shared, r.key);
        CONTINUE;
      END IF;

      UPDATE public.brand_modules
         SET is_enabled = false, updated_at = now()
       WHERE brand_id = v_brand_id
         AND module_definition_id = r.id;

      v_disabled_keys := array_append(v_disabled_keys, r.key);
    END LOOP;
  END IF;

  -- 7. Audit log consolidado (1 linha por evento)
  INSERT INTO public.audit_logs (
    actor_user_id, entity_type, entity_id, action, scope_type, scope_id, details_json
  ) VALUES (
    NULL, 'sync_trigger', v_brand_id, 'brand_modules_synced', 'BRAND', v_brand_id,
    jsonb_build_object(
      'trigger_op', v_op,
      'business_model_id', v_business_model_id,
      'business_model_key', v_model_key,
      'is_enabled_old', v_old_enabled,
      'is_enabled_new', v_new_enabled,
      'modules_required',       to_jsonb(v_required_keys),
      'modules_enabled',        to_jsonb(v_enabled_keys),
      'modules_disabled',       to_jsonb(v_disabled_keys),
      'modules_skipped_shared', to_jsonb(v_skipped_shared),
      'modules_skipped_core',   to_jsonb(v_skipped_core)
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_brand_modules_from_bbm ON public.brand_business_models;

CREATE TRIGGER trg_sync_brand_modules_from_bbm
AFTER INSERT OR UPDATE OR DELETE ON public.brand_business_models
FOR EACH ROW
EXECUTE FUNCTION public.sync_brand_modules_from_business_models();

-- ============================================================
-- ROLLBACK (não destrói dados):
--   DROP TRIGGER IF EXISTS trg_sync_brand_modules_from_bbm
--     ON public.brand_business_models;
--   DROP FUNCTION IF EXISTS
--     public.sync_brand_modules_from_business_models();
-- ============================================================