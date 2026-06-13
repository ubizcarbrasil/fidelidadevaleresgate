-- ============================================================================
-- P8.3 — Trial expiration flow: tracking de emails de aviso enviados
-- ============================================================================
--
-- Objetivo: dedupe de envios. O cron `trial-reminders-cron` roda diariamente
-- e checa thresholds 7d / 3d / 1d / 0d (expirado) por brand. Sem este log,
-- cada execução re-enviaria. Marcar timestamp do envio garante idempotência.
--
-- Formato JSONB:
--   {
--     "sent_7d_at":  "2026-06-10T12:00:00Z",
--     "sent_3d_at":  "2026-06-14T12:00:00Z",
--     "sent_1d_at":  "2026-06-16T12:00:00Z",
--     "sent_0d_at":  "2026-06-17T12:00:00Z"
--   }
--
-- Não usamos coluna-por-threshold pra ficar extensível (futuro: 14d teaser,
-- 30d post-expiração, etc.) sem migration nova.
-- ============================================================================

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS trial_email_log JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.brands.trial_email_log IS
  'Tracking de envios de email de aviso de expiração de trial. Chaves: sent_7d_at, sent_3d_at, sent_1d_at, sent_0d_at. Mantém o cron idempotente.';

-- Index parcial pra varredura rápida do cron — só TRIAL ativos com data
CREATE INDEX IF NOT EXISTS idx_brands_trial_active_cron
  ON public.brands (trial_expires_at)
  WHERE subscription_status = 'TRIAL' AND trial_expires_at IS NOT NULL;

-- ============================================================================
-- INSTALAÇÃO DO pg_cron (manual no Dashboard Supabase)
-- ============================================================================
-- Esta migration NÃO ativa pg_cron automaticamente pois requer permissão
-- de superuser. Rodar UMA VEZ no SQL Editor do Dashboard:
--
--   -- 1. Ativar extensões necessárias (se ainda não estiverem)
--   CREATE EXTENSION IF NOT EXISTS pg_cron;
--   CREATE EXTENSION IF NOT EXISTS pg_net;
--
--   -- 2. Agendar o cron pra rodar 12:00 UTC todos os dias
--   --    (substitua <project_ref> e <service_role_key> nos valores reais)
--   SELECT cron.schedule(
--     'trial-reminders-daily',
--     '0 12 * * *',
--     $$
--     SELECT net.http_post(
--       url := 'https://<project_ref>.supabase.co/functions/v1/trial-reminders-cron',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer <service_role_key>'
--       ),
--       body := jsonb_build_object()
--     ) AS request_id;
--     $$
--   );
--
--   -- 3. Verificar se o job foi criado:
--   SELECT * FROM cron.job WHERE jobname = 'trial-reminders-daily';
--
-- ============================================================================
