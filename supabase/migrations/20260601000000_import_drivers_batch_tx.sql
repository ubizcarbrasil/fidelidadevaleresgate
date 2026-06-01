-- F5.4: CSV import em transação — batched updates + stuck job cleanup
--
-- Problema: import-drivers-bulk fazia 1 UPDATE HTTP por motorista existente
-- (até 500 round-trips por chunk de 500), cada um sua própria implicit
-- transaction. Se a edge function travasse no meio do loop, ficavam N
-- customers atualizados e M intactos, sem rollback.
--
-- Fix: 1 RPC que faz todas as updates do chunk numa única statement
-- SQL = 1 transação ACID. Falha total → rollback total. Sucesso → todos
-- aplicados. Bonus: ~500x menos round-trips na rede.
--
-- p_updates é um array JSONB de objetos:
--   [{ "id": uuid, "cpf": text?, "phone": text?, "email": text?,
--      "name": text?, "external_driver_id": text? }, ...]
-- Campos null/undefined NÃO sobrescrevem (COALESCE preserva valor existente).

CREATE OR REPLACE FUNCTION public.import_drivers_update_batch(
  p_updates jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count integer;
BEGIN
  IF p_updates IS NULL OR jsonb_array_length(p_updates) = 0 THEN
    RETURN 0;
  END IF;

  WITH src AS (
    SELECT *
    FROM jsonb_to_recordset(p_updates) AS u(
      id uuid,
      cpf text,
      phone text,
      email text,
      name text,
      external_driver_id text
    )
  )
  UPDATE public.customers c
  SET
    cpf = COALESCE(src.cpf, c.cpf),
    phone = COALESCE(src.phone, c.phone),
    email = COALESCE(src.email, c.email),
    name = COALESCE(src.name, c.name),
    external_driver_id = COALESCE(src.external_driver_id, c.external_driver_id),
    updated_at = now()
  FROM src
  WHERE c.id = src.id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

REVOKE ALL ON FUNCTION public.import_drivers_update_batch(jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.import_drivers_update_batch(jsonb) TO service_role;

COMMENT ON FUNCTION public.import_drivers_update_batch(jsonb) IS
  'F5.4: batched UPDATE de customers durante CSV import. 1 statement = 1 transação. Substitui loop de N UPDATEs HTTP no edge function.';

-- ============================================================================
-- Cleanup de jobs travados — defensive, para edge function que crasha
-- antes de marcar status final.
-- ============================================================================
--
-- Edge function pode morrer (timeout, OOM, crash) sem chamar o UPDATE final
-- que marca status='done'/'error'. Resultado: jobs ficam em status='running'
-- pra sempre, poluindo UI e impedindo retry. Esta RPC sweepa jobs antigos.
--
-- Recomenda-se chamar via pg_cron a cada 5min, ou manualmente via UI quando
-- precisar destravar.

CREATE OR REPLACE FUNCTION public.cleanup_stuck_driver_import_jobs(
  p_max_age_minutes integer DEFAULT 30
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_marked integer;
BEGIN
  IF p_max_age_minutes IS NULL OR p_max_age_minutes < 5 THEN
    RAISE EXCEPTION 'p_max_age_minutes must be >= 5';
  END IF;

  UPDATE public.driver_import_jobs
  SET
    status = 'error',
    finished_at = now(),
    errors_json = errors_json || jsonb_build_array(
      jsonb_build_object(
        'linha', 0,
        'motivo', format(
          'Job marcado como erro automaticamente: rodando há mais de %s min sem progresso (provável crash do edge function).',
          p_max_age_minutes
        )
      )
    )
  WHERE status = 'running'
    AND started_at < now() - (p_max_age_minutes || ' minutes')::interval;

  GET DIAGNOSTICS v_marked = ROW_COUNT;
  RETURN v_marked;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_stuck_driver_import_jobs(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.cleanup_stuck_driver_import_jobs(integer) TO service_role, authenticated;

COMMENT ON FUNCTION public.cleanup_stuck_driver_import_jobs(integer) IS
  'F5.4: marca como error jobs em status=running há mais que p_max_age_minutes (default 30). Defensive — sweep de jobs órfãos pós-crash do edge function.';
