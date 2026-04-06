
-- Tabela de palpites sociais nos duelos
CREATE TABLE public.driver_duel_guesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  duel_id UUID NOT NULL REFERENCES public.driver_duels(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  predicted_winner_participant_id UUID NOT NULL REFERENCES public.driver_duel_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (duel_id, customer_id)
);

-- Índices
CREATE INDEX idx_duel_guesses_duel ON public.driver_duel_guesses(duel_id);

-- RLS
ALTER TABLE public.driver_duel_guesses ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ver palpites
CREATE POLICY "Authenticated users can view guesses"
ON public.driver_duel_guesses FOR SELECT
TO authenticated USING (true);

-- Motorista autenticado pode inserir seu palpite
CREATE POLICY "Authenticated users can insert own guess"
ON public.driver_duel_guesses FOR INSERT
TO authenticated
WITH CHECK (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);

-- RPC para contar palpites por lado
CREATE OR REPLACE FUNCTION public.get_duel_guesses_summary(p_duel_id uuid)
RETURNS TABLE(participant_id uuid, guess_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT predicted_winner_participant_id AS participant_id, COUNT(*)::bigint AS guess_count
  FROM driver_duel_guesses
  WHERE duel_id = p_duel_id
  GROUP BY predicted_winner_participant_id;
$$;
