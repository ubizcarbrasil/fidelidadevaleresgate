
-- ============================================================
-- Sub-fase 7.0 — Configurações Avançadas do Duelo
-- Tabelas: duel_prize_campaigns, duel_cycle_reset_history
-- Trigger validação limites + RPC redeem_prize_campaign
-- ============================================================

-- 1) Extensão de enums do ledger
ALTER TYPE public.ledger_entry_type ADD VALUE IF NOT EXISTS 'PRIZE_REDEEM';
ALTER TYPE public.ledger_entry_type ADD VALUE IF NOT EXISTS 'CYCLE_BONUS';
ALTER TYPE public.ledger_reference_type ADD VALUE IF NOT EXISTS 'PRIZE_CAMPAIGN';
ALTER TYPE public.ledger_reference_type ADD VALUE IF NOT EXISTS 'CYCLE_RESET';

COMMIT;

-- ============================================================
-- 2) Tabela duel_prize_campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.duel_prize_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  season_id uuid REFERENCES public.gamification_seasons(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  image_url text,
  points_cost integer NOT NULL CHECK (points_cost > 0),
  quantity_total integer NOT NULL CHECK (quantity_total > 0),
  quantity_redeemed integer NOT NULL DEFAULT 0 CHECK (quantity_redeemed >= 0),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CHECK (quantity_redeemed <= quantity_total)
);

CREATE INDEX IF NOT EXISTS idx_dpc_branch ON public.duel_prize_campaigns(branch_id);
CREATE INDEX IF NOT EXISTS idx_dpc_brand ON public.duel_prize_campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_dpc_status ON public.duel_prize_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_dpc_active_window ON public.duel_prize_campaigns(branch_id, status, starts_at, ends_at);

ALTER TABLE public.duel_prize_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root manages prize campaigns" ON public.duel_prize_campaigns
  FOR ALL USING (public.has_role(auth.uid(), 'root_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'::public.app_role));

CREATE POLICY "Brand admins manage own prize campaigns" ON public.duel_prize_campaigns
  FOR ALL USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())))
  WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE POLICY "Branch admins manage own branch prize campaigns" ON public.duel_prize_campaigns
  FOR ALL USING (branch_id IN (SELECT public.get_user_branch_ids(auth.uid())))
  WITH CHECK (branch_id IN (SELECT public.get_user_branch_ids(auth.uid())));

CREATE POLICY "Anyone can view active prize campaigns" ON public.duel_prize_campaigns
  FOR SELECT USING (status = 'active' AND now() BETWEEN starts_at AND ends_at);

CREATE TRIGGER update_dpc_updated_at
  BEFORE UPDATE ON public.duel_prize_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3) Tabela duel_cycle_reset_history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.duel_cycle_reset_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  executed_at timestamptz NOT NULL DEFAULT now(),
  drivers_affected integer NOT NULL DEFAULT 0,
  total_points_distributed bigint NOT NULL DEFAULT 0,
  action_executed text NOT NULL,
  config_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  details_json jsonb DEFAULT '{}'::jsonb,
  triggered_by text NOT NULL DEFAULT 'cron' CHECK (triggered_by IN ('cron','manual')),
  triggered_by_user uuid
);

CREATE INDEX IF NOT EXISTS idx_dcrh_branch_executed ON public.duel_cycle_reset_history(branch_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_dcrh_brand_executed ON public.duel_cycle_reset_history(brand_id, executed_at DESC);

ALTER TABLE public.duel_cycle_reset_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root reads reset history" ON public.duel_cycle_reset_history
  FOR SELECT USING (public.has_role(auth.uid(), 'root_admin'::public.app_role));

CREATE POLICY "Brand admins read own reset history" ON public.duel_cycle_reset_history
  FOR SELECT USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE POLICY "Branch admins read own branch reset history" ON public.duel_cycle_reset_history
  FOR SELECT USING (branch_id IN (SELECT public.get_user_branch_ids(auth.uid())));

-- ============================================================
-- 4) Trigger validação limites de aposta em driver_duels
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_duel_bet_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings jsonb;
  v_max_individual integer;
  v_max_total integer;
  v_min_individual integer;
  v_total integer;
BEGIN
  SELECT branch_settings_json INTO v_settings
  FROM public.branches WHERE id = NEW.branch_id;

  IF v_settings IS NULL THEN
    RETURN NEW;
  END IF;

  v_max_individual := NULLIF(v_settings->>'duel_bet_max_individual','')::integer;
  v_max_total := NULLIF(v_settings->>'duel_bet_max_total','')::integer;
  v_min_individual := NULLIF(v_settings->>'duel_bet_min_individual','')::integer;

  IF v_max_individual IS NOT NULL THEN
    IF NEW.challenger_points_bet > v_max_individual THEN
      RAISE EXCEPTION 'Aposta individual do desafiante excede o limite (%).', v_max_individual
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.challenged_points_bet > v_max_individual THEN
      RAISE EXCEPTION 'Aposta individual do desafiado excede o limite (%).', v_max_individual
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF v_min_individual IS NOT NULL THEN
    IF NEW.challenger_points_bet > 0 AND NEW.challenger_points_bet < v_min_individual THEN
      RAISE EXCEPTION 'Aposta do desafiante abaixo do mínimo (%).', v_min_individual
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.challenged_points_bet > 0 AND NEW.challenged_points_bet < v_min_individual THEN
      RAISE EXCEPTION 'Aposta do desafiado abaixo do mínimo (%).', v_min_individual
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  v_total := COALESCE(NEW.challenger_points_bet,0) + COALESCE(NEW.challenged_points_bet,0);
  IF v_max_total IS NOT NULL AND v_total > v_max_total THEN
    RAISE EXCEPTION 'Total apostado no duelo (%) excede o limite (%).', v_total, v_max_total
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_duel_bet_limits ON public.driver_duels;
CREATE TRIGGER trg_validate_duel_bet_limits
  BEFORE INSERT OR UPDATE OF challenger_points_bet, challenged_points_bet
  ON public.driver_duels
  FOR EACH ROW EXECUTE FUNCTION public.validate_duel_bet_limits();

-- Trigger análoga em duel_side_bets
CREATE OR REPLACE FUNCTION public.validate_side_bet_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings jsonb;
  v_max_individual integer;
  v_min_individual integer;
BEGIN
  SELECT branch_settings_json INTO v_settings
  FROM public.branches WHERE id = NEW.branch_id;

  IF v_settings IS NULL THEN
    RETURN NEW;
  END IF;

  v_max_individual := NULLIF(v_settings->>'duel_bet_max_individual','')::integer;
  v_min_individual := NULLIF(v_settings->>'duel_bet_min_individual','')::integer;

  IF v_max_individual IS NOT NULL THEN
    IF NEW.bettor_a_points > v_max_individual THEN
      RAISE EXCEPTION 'Aposta paralela A excede o limite individual (%).', v_max_individual
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.bettor_b_points IS NOT NULL AND NEW.bettor_b_points > v_max_individual THEN
      RAISE EXCEPTION 'Aposta paralela B excede o limite individual (%).', v_max_individual
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF v_min_individual IS NOT NULL THEN
    IF NEW.bettor_a_points > 0 AND NEW.bettor_a_points < v_min_individual THEN
      RAISE EXCEPTION 'Aposta paralela A abaixo do mínimo (%).', v_min_individual
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_side_bet_limits ON public.duel_side_bets;
CREATE TRIGGER trg_validate_side_bet_limits
  BEFORE INSERT OR UPDATE OF bettor_a_points, bettor_b_points
  ON public.duel_side_bets
  FOR EACH ROW EXECUTE FUNCTION public.validate_side_bet_limits();

-- ============================================================
-- 5) RPC redeem_prize_campaign — atômica com FOR UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION public.redeem_prize_campaign(
  p_campaign_id uuid,
  p_customer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign public.duel_prize_campaigns%ROWTYPE;
  v_balance bigint;
  v_remaining bigint;
  v_customer record;
BEGIN
  SELECT * INTO v_campaign
  FROM public.duel_prize_campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campanha não encontrada' USING ERRCODE = 'no_data_found';
  END IF;

  IF v_campaign.status <> 'active' THEN
    RAISE EXCEPTION 'Campanha não está ativa' USING ERRCODE = 'check_violation';
  END IF;

  IF now() < v_campaign.starts_at OR now() > v_campaign.ends_at THEN
    RAISE EXCEPTION 'Campanha fora da janela de validade' USING ERRCODE = 'check_violation';
  END IF;

  IF v_campaign.quantity_redeemed >= v_campaign.quantity_total THEN
    RAISE EXCEPTION 'Prêmio esgotado' USING ERRCODE = 'check_violation';
  END IF;

  SELECT id, brand_id, branch_id, name, phone, cpf
    INTO v_customer
  FROM public.customers
  WHERE id = p_customer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Motorista não encontrado' USING ERRCODE = 'no_data_found';
  END IF;

  -- Calcula saldo atual via ledger
  SELECT COALESCE(SUM(
    CASE WHEN reference_type = 'DEBIT'::ledger_reference_type THEN -points_amount
         WHEN entry_type = 'DEBIT'::ledger_entry_type THEN -points_amount
         ELSE points_amount END
  ),0) INTO v_balance
  FROM public.points_ledger
  WHERE customer_id = p_customer_id;

  IF v_balance < v_campaign.points_cost THEN
    RAISE EXCEPTION 'Saldo insuficiente (saldo: %, custo: %)', v_balance, v_campaign.points_cost
      USING ERRCODE = 'check_violation';
  END IF;

  -- Débito no ledger
  INSERT INTO public.points_ledger(
    brand_id, branch_id, customer_id,
    entry_type, points_amount, reason,
    reference_type, reference_id, created_by_user_id
  ) VALUES (
    v_campaign.brand_id, v_campaign.branch_id, p_customer_id,
    'PRIZE_REDEEM'::ledger_entry_type, v_campaign.points_cost,
    'Resgate de prêmio: ' || v_campaign.name,
    'PRIZE_CAMPAIGN'::ledger_reference_type, p_campaign_id, auth.uid()
  );

  -- Decrementa quantidade
  UPDATE public.duel_prize_campaigns
  SET quantity_redeemed = quantity_redeemed + 1,
      status = CASE WHEN quantity_redeemed + 1 >= quantity_total THEN 'ended' ELSE status END,
      updated_at = now()
  WHERE id = p_campaign_id;

  v_remaining := v_balance - v_campaign.points_cost;

  RETURN jsonb_build_object(
    'success', true,
    'campaign_id', p_campaign_id,
    'campaign_name', v_campaign.name,
    'points_spent', v_campaign.points_cost,
    'remaining_balance', v_remaining,
    'redeemed_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_prize_campaign(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_prize_campaign(uuid, uuid) TO authenticated;
