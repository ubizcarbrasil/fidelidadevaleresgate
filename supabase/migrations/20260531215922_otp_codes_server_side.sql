-- ============================================================================
-- OTP server-side — substitui geração client-side (vulnerabilidade CRÍTICA)
-- ============================================================================
--
-- ANTES (bug auditoria):
--   CustomerRedeemCheckout: generateOtpCode() = Math.random() no client.
--     Código exibido em React state. DevTools → ver expectedCode → burlar.
--   DriverVerifyCodeStep: idem + INSERT em driver_verification_codes
--     mas validação 100% client-side.
--
-- Resultado: atacante com DevTools resgata produtos sem verificar identidade.
--
-- FIX: tabela centralizada `otp_codes` consumida via 2 edge functions
-- (send-otp-code + verify-otp-code). Client envia apenas o identifier
-- (email/phone/cpf) e o código digitado pelo user. Validação atômica
-- server-side.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.otp_codes (
  id BIGSERIAL PRIMARY KEY,
  -- Identifier do destinatário: email, phone ou cpf (depende do purpose).
  -- Normalizado em lowercase / só dígitos pra evitar duplicidades.
  identifier TEXT NOT NULL,
  -- Hash SHA-256 do código (nunca armazena o código em plaintext).
  -- Mesmo se DB vazar, atacante não consegue usar.
  code_hash TEXT NOT NULL,
  -- Contexto de uso (driver_verify, customer_checkout, etc.)
  purpose TEXT NOT NULL,
  -- Brand pra rate limit por contexto multi-tenant
  brand_id UUID,
  -- Marca usado atomicamente via UPDATE WHERE used=false
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  -- TTL: códigos expiram em 10min por default
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  -- Conta tentativas pra travar bruteforce no verify
  verify_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pra lookup rápido por identifier+purpose (mais recente não usado)
CREATE INDEX IF NOT EXISTS idx_otp_codes_lookup
  ON public.otp_codes (identifier, purpose, used, expires_at DESC);

-- Index pra rate limit por brand+identifier nos últimos N min
CREATE INDEX IF NOT EXISTS idx_otp_codes_rate_limit
  ON public.otp_codes (identifier, created_at DESC);

COMMENT ON TABLE public.otp_codes IS
  'OTP server-side. Substituiu generateOtpCode() client-side (vulnerável). '
  'Limpeza recomendada: DELETE WHERE created_at < now() - interval ''24 hours''';

-- RLS: ninguém lê pelo client. Só edge functions com service_role.
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
-- Sem policies pra anon/authenticated — service_role bypassa.
