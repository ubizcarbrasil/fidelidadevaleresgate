-- ============================================================================
-- B3.1 — RLS audit: ENABLE RLS em driver_login_attempts
-- ============================================================================
--
-- Origem: migration 20260519002728_driver_cpf_lookup_hardening criou a tabela
-- mas esqueceu de `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Suas duas
-- irmãs (driver_login_ip_attempts, otp_codes) habilitam RLS corretamente
-- como deny-all (só edge functions com service_role acessam).
--
-- Risco: sem RLS, qualquer usuário authenticated com chave anon poderia
-- fazer SELECT *na tabela inteira* e inferir CPFs cadastrados (via cpf_hash)
-- + correlacionar tentativas por brand_id.
--
-- Fix: habilitar RLS sem policies (deny-all). service_role bypassa
-- automaticamente; client jamais lê.
-- ============================================================================

ALTER TABLE public.driver_login_attempts ENABLE ROW LEVEL SECURITY;
