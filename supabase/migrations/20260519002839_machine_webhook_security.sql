-- ============================================================================
-- Machine Webhook Security Hardening
-- ============================================================================
--
-- Vulnerabilidade original: machine-webhook aceitava chamadas via fallback
-- "brand_id only" sem validar API key. Atacante que descobrisse um brand_id
-- (ex: HTML público da landing) conseguia disparar webhook com payload fake
-- e creditar pontos arbitrários a motoristas.
--
-- Hardening incremental (opt-in pra não quebrar integrações ativas):
--
-- 1. Coluna `require_api_key` (default false) — quando true, fallback
--    inseguro de "brand_id only" é desabilitado pra essa integração.
--
-- 2. Coluna `webhook_secret` — se preenchida, edge function valida HMAC
--    SHA-256 do body usando este segredo. Provedor precisa assinar o
--    request com header `x-signature-sha256`.
--
-- 3. Coluna `signature_verified_count` — contador pra monitorar adoção.
-- ============================================================================

ALTER TABLE public.machine_integrations
  ADD COLUMN IF NOT EXISTS require_api_key BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS webhook_secret TEXT,
  ADD COLUMN IF NOT EXISTS signature_verified_count BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.machine_integrations.require_api_key IS
  'Quando true, machine-webhook recusa chamadas sem x-api-key match. Desabilita fallback inseguro de brand_id-only.';

COMMENT ON COLUMN public.machine_integrations.webhook_secret IS
  'Segredo HMAC. Se setado, edge function valida x-signature-sha256 do body. Provedor deve assinar com este valor.';

-- ============================================================================
-- View pra admin saber quais integrações estão hardened (status de segurança)
-- ============================================================================
CREATE OR REPLACE VIEW public.machine_integrations_security_status AS
SELECT
  id,
  brand_id,
  branch_id,
  is_active,
  require_api_key,
  webhook_secret IS NOT NULL AS has_webhook_secret,
  signature_verified_count,
  total_rides,
  last_ride_at,
  CASE
    WHEN require_api_key AND webhook_secret IS NOT NULL THEN 'FULL_HARDENED'
    WHEN require_api_key THEN 'API_KEY_REQUIRED'
    WHEN webhook_secret IS NOT NULL THEN 'HMAC_OPTIONAL'
    ELSE 'INSECURE_LEGACY'
  END AS security_level
FROM public.machine_integrations;

COMMENT ON VIEW public.machine_integrations_security_status IS
  'Status de segurança das integrações. Admin deve migrar todas pra FULL_HARDENED antes de escalar.';
