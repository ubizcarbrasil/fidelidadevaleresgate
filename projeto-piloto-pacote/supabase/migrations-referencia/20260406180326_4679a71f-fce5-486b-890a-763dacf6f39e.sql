
-- ============================================
-- 1. Tabela de participantes
-- ============================================
CREATE TABLE public.driver_duel_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  duels_enabled boolean NOT NULL DEFAULT false,
  public_nickname text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id)
);

CREATE INDEX idx_duel_participants_branch ON public.driver_duel_participants(branch_id);
CREATE INDEX idx_duel_participants_brand ON public.driver_duel_participants(brand_id);

ALTER TABLE public.driver_duel_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read duel participants"
  ON public.driver_duel_participants FOR SELECT
  USING (true);

CREATE TRIGGER update_duel_participants_updated_at
  BEFORE UPDATE ON public.driver_duel_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. Tabela de duelos
-- ============================================
CREATE TABLE public.driver_duels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  challenger_id uuid NOT NULL REFERENCES public.driver_duel_participants(id) ON DELETE CASCADE,
  challenged_id uuid NOT NULL REFERENCES public.driver_duel_participants(id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  challenger_rides_count integer NOT NULL DEFAULT 0,
  challenged_rides_count integer NOT NULL DEFAULT 0,
  winner_id uuid REFERENCES public.driver_duel_participants(id),
  accepted_at timestamptz,
  declined_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_duels_branch ON public.driver_duels(branch_id);
CREATE INDEX idx_duels_status ON public.driver_duels(status);
CREATE INDEX idx_duels_challenger ON public.driver_duels(challenger_id);
CREATE INDEX idx_duels_challenged ON public.driver_duels(challenged_id);

ALTER TABLE public.driver_duels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read duels"
  ON public.driver_duels FOR SELECT
  USING (true);

CREATE TRIGGER update_duels_updated_at
  BEFORE UPDATE ON public.driver_duels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: validar status
CREATE OR REPLACE FUNCTION public.validate_duel_status()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('pending','accepted','declined','live','finished','canceled') THEN
    RAISE EXCEPTION 'status must be pending, accepted, declined, live, finished, or canceled';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_duel_status
  BEFORE INSERT OR UPDATE ON public.driver_duels
  FOR EACH ROW EXECUTE FUNCTION public.validate_duel_status();

-- ============================================
-- 3. RPC: count_duel_rides
-- ============================================
CREATE OR REPLACE FUNCTION public.count_duel_rides(
  p_customer_id uuid,
  p_branch_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz
)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::bigint
  FROM machine_rides
  WHERE driver_customer_id = p_customer_id
    AND branch_id = p_branch_id
    AND ride_status = 'FINALIZED'
    AND finalized_at >= p_start_at
    AND finalized_at <= p_end_at;
$$;

-- ============================================
-- 4. RPC: toggle_duel_participation
-- ============================================
CREATE OR REPLACE FUNCTION public.toggle_duel_participation(
  p_customer_id uuid,
  p_branch_id uuid,
  p_brand_id uuid,
  p_enabled boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_participant_id uuid;
BEGIN
  INSERT INTO driver_duel_participants (customer_id, branch_id, brand_id, duels_enabled)
  VALUES (p_customer_id, p_branch_id, p_brand_id, p_enabled)
  ON CONFLICT (customer_id) DO UPDATE SET duels_enabled = p_enabled
  RETURNING id INTO v_participant_id;

  RETURN jsonb_build_object('success', true, 'participant_id', v_participant_id, 'duels_enabled', p_enabled);
END;
$$;

-- ============================================
-- 5. RPC: create_duel_challenge
-- ============================================
CREATE OR REPLACE FUNCTION public.create_duel_challenge(
  p_challenger_customer_id uuid,
  p_challenged_customer_id uuid,
  p_branch_id uuid,
  p_brand_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_challenger driver_duel_participants%ROWTYPE;
  v_challenged driver_duel_participants%ROWTYPE;
  v_duel_id uuid;
BEGIN
  -- Validate challenger
  SELECT * INTO v_challenger FROM driver_duel_participants
  WHERE customer_id = p_challenger_customer_id AND branch_id = p_branch_id AND duels_enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Desafiante não está habilitado para duelos');
  END IF;

  -- Validate challenged
  SELECT * INTO v_challenged FROM driver_duel_participants
  WHERE customer_id = p_challenged_customer_id AND branch_id = p_branch_id AND duels_enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Adversário não está habilitado para duelos');
  END IF;

  -- Same person check
  IF p_challenger_customer_id = p_challenged_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode desafiar a si mesmo');
  END IF;

  -- Date validation
  IF p_start_at >= p_end_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Data de início deve ser anterior à data de fim');
  END IF;

  INSERT INTO driver_duels (branch_id, brand_id, challenger_id, challenged_id, start_at, end_at, status)
  VALUES (p_branch_id, p_brand_id, v_challenger.id, v_challenged.id, p_start_at, p_end_at, 'pending')
  RETURNING id INTO v_duel_id;

  RETURN jsonb_build_object('success', true, 'duel_id', v_duel_id);
END;
$$;

-- ============================================
-- 6. RPC: respond_to_duel
-- ============================================
CREATE OR REPLACE FUNCTION public.respond_to_duel(
  p_duel_id uuid,
  p_customer_id uuid,
  p_accept boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_participant driver_duel_participants%ROWTYPE;
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado ou já respondido');
  END IF;

  SELECT * INTO v_participant FROM driver_duel_participants WHERE customer_id = p_customer_id;
  IF NOT FOUND OR v_participant.id != v_duel.challenged_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas o desafiado pode responder');
  END IF;

  IF p_accept THEN
    UPDATE driver_duels SET status = 'accepted', accepted_at = now() WHERE id = p_duel_id;
  ELSE
    UPDATE driver_duels SET status = 'declined', declined_at = now() WHERE id = p_duel_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'new_status', CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END);
END;
$$;

-- ============================================
-- 7. RPC: finalize_duel
-- ============================================
CREATE OR REPLACE FUNCTION public.finalize_duel(p_duel_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_challenger_customer_id uuid;
  v_challenged_customer_id uuid;
  v_challenger_count bigint;
  v_challenged_count bigint;
  v_winner uuid;
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status IN ('accepted','live');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado ou não pode ser finalizado');
  END IF;

  SELECT customer_id INTO v_challenger_customer_id FROM driver_duel_participants WHERE id = v_duel.challenger_id;
  SELECT customer_id INTO v_challenged_customer_id FROM driver_duel_participants WHERE id = v_duel.challenged_id;

  v_challenger_count := count_duel_rides(v_challenger_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);
  v_challenged_count := count_duel_rides(v_challenged_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);

  IF v_challenger_count > v_challenged_count THEN
    v_winner := v_duel.challenger_id;
  ELSIF v_challenged_count > v_challenger_count THEN
    v_winner := v_duel.challenged_id;
  ELSE
    v_winner := NULL; -- empate
  END IF;

  UPDATE driver_duels
  SET status = 'finished',
      challenger_rides_count = v_challenger_count,
      challenged_rides_count = v_challenged_count,
      winner_id = v_winner,
      finished_at = now()
  WHERE id = p_duel_id;

  RETURN jsonb_build_object(
    'success', true,
    'challenger_rides', v_challenger_count,
    'challenged_rides', v_challenged_count,
    'winner_id', v_winner
  );
END;
$$;
