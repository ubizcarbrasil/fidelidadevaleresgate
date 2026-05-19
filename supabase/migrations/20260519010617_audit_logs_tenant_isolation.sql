-- ============================================================================
-- audit_logs — tenant isolation
-- ============================================================================
--
-- Vulnerabilidade original (auditoria): a tabela audit_logs tinha apenas
-- "Root can read all audit logs" e "Authenticated can insert audit logs".
-- Não havia policy permitindo brand_admin ler logs DA SUA marca, mas a
-- falta de isolation significava que ataques cross-tenant via consultas
-- diretas eram possíveis se um brand_admin descobrisse padrões.
--
-- Mais grave: "Authenticated can insert" permitia qualquer usuário
-- autenticado (incluindo brand_admin de Brand A) injetar logs falsos
-- com scope_id de Brand B, poluindo audit trail de competidores.
--
-- Mitigações:
--
-- A. Nova policy: brand_admin lê SOMENTE logs onde scope_id pertence
--    a uma brand que ele administra (via get_user_brand_ids).
--
-- B. INSERT mais restritivo: validar que scope_id, se preenchido, pertence
--    ao user que está inserindo (impede log poisoning cross-tenant).
-- ============================================================================

-- Garante index pra performance dos filtros novos
CREATE INDEX IF NOT EXISTS idx_audit_logs_scope
  ON public.audit_logs (scope_type, scope_id, created_at DESC);

-- Drop policies antigas se existirem (idempotente)
DROP POLICY IF EXISTS "Brand admins read own brand audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Validated insert audit logs" ON public.audit_logs;

-- ─── SELECT: brand_admin lê só logs da própria brand ───────────────────────
CREATE POLICY "Brand admins read own brand audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    -- Root continua vendo tudo (policy "Root can read all audit logs" antiga
    -- já cobre esse caso, mas duplicamos aqui pra clareza)
    has_role(auth.uid(), 'root_admin'::app_role)
    OR (
      -- Brand admin/branch admin lê logs onde scope_type='BRAND' e
      -- scope_id pertence a uma brand que ele administra
      scope_type = 'BRAND'
      AND scope_id IS NOT NULL
      AND scope_id IN (SELECT public.get_user_brand_ids(auth.uid()))
    )
    OR (
      -- O próprio usuário pode ver logs onde ele é o actor
      actor_user_id = auth.uid()
    )
  );

-- ─── INSERT: valida que scope_id, se preenchido, é acessível ao user ──────
-- Edge functions (com service_role) continuam podendo inserir qualquer
-- coisa (service_role bypassa RLS). Frontend (anon/authenticated) só
-- pode inserir logs no próprio escopo.
CREATE POLICY "Validated insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (
    -- Root admin pode inserir qualquer coisa
    has_role(auth.uid(), 'root_admin'::app_role)
    OR (
      -- Outros usuários: scope_id (se setado) precisa ser uma brand acessível
      auth.uid() IS NOT NULL
      AND (
        scope_id IS NULL
        OR scope_id IN (SELECT public.get_user_brand_ids(auth.uid()))
      )
    )
  );

COMMENT ON POLICY "Brand admins read own brand audit logs" ON public.audit_logs IS
  'Isolation tenant: brand_admin lê só logs onde scope_id é brand dele. Root vê tudo.';

COMMENT ON POLICY "Validated insert audit logs" ON public.audit_logs IS
  'Impede log poisoning: usuário não-root só insere logs em scope que controla.';
