-- ============================================================================
-- Rate limit por IP no login CPF do motorista
-- ============================================================================
--
-- Complemento da migration 20260519002728 (rate limit por brand+cpf_hash).
-- Aqui adicionamos rate limit por IP — proteção extra contra atacante que
-- tenta CPFs diferentes pra encontrar válidos (não bloqueado pelo limit
-- de cpf_hash já que cada tentativa é um CPF diferente).
--
-- A edge function `driver-cpf-login` (criada no mesmo PR) é quem registra
-- o IP via header x-forwarded-for. RPC não tem acesso ao IP diretamente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.driver_login_ip_attempts (
  id BIGSERIAL PRIMARY KEY,
  ip_address TEXT NOT NULL,
  brand_id UUID,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_login_ip_attempts_lookup
  ON public.driver_login_ip_attempts (ip_address, attempted_at DESC);

COMMENT ON TABLE public.driver_login_ip_attempts IS
  'Log de tentativas de login CPF do motorista por IP. Usado pelo edge function driver-cpf-login pra rate limit. Limpeza recomendada: DELETE WHERE attempted_at < now() - interval ''24 hours''';

-- RLS: ninguém precisa ler isso pelo client. Apenas service_role insere/lê.
ALTER TABLE public.driver_login_ip_attempts ENABLE ROW LEVEL SECURITY;

-- Sem policies pra anon/authenticated — só service_role bypassa RLS.
