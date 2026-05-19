-- Cancela a temporada zumbi "Maio 2026" (sem motoristas, sem séries) que está
-- bloqueando a criação de nova temporada para a mesma cidade/mês/ano.
UPDATE public.campeonato_seasons
   SET phase = 'cancelled',
       cancelled_at = now(),
       cancellation_reason = COALESCE(cancellation_reason, 'Cancelamento operacional: temporada órfã sem motoristas/séries bloqueando criação'),
       updated_at = now()
 WHERE id = 'a9f2b1a5-de38-45b3-a478-aafc10173218'
   AND cancelled_at IS NULL;