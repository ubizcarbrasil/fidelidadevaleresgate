
-- Tabela de campeões do cinturão da cidade
CREATE TABLE public.city_belt_champions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  champion_customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  record_value bigint NOT NULL DEFAULT 0,
  record_type text NOT NULL DEFAULT 'monthly',
  achieved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (branch_id, record_type)
);

ALTER TABLE public.city_belt_champions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view belt champions"
  ON public.city_belt_champions FOR SELECT
  TO anon, authenticated
  USING (true);

-- Trigger de validação do record_type
CREATE OR REPLACE FUNCTION public.validate_belt_record_type()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NEW.record_type NOT IN ('monthly', 'all_time') THEN
    RAISE EXCEPTION 'record_type must be monthly or all_time';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_belt_record_type
  BEFORE INSERT OR UPDATE ON public.city_belt_champions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_belt_record_type();

-- RPC: retorna dados do campeão atual
CREATE OR REPLACE FUNCTION public.get_city_belt_champion(p_branch_id uuid)
  RETURNS TABLE(
    id uuid,
    branch_id uuid,
    champion_customer_id uuid,
    champion_name text,
    champion_nickname text,
    champion_avatar_url text,
    record_value bigint,
    record_type text,
    achieved_at timestamptz
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT
    cbc.id,
    cbc.branch_id,
    cbc.champion_customer_id,
    c.name AS champion_name,
    ddp.public_nickname AS champion_nickname,
    ddp.avatar_url AS champion_avatar_url,
    cbc.record_value,
    cbc.record_type,
    cbc.achieved_at
  FROM city_belt_champions cbc
  JOIN customers c ON c.id = cbc.champion_customer_id
  LEFT JOIN driver_duel_participants ddp ON ddp.customer_id = cbc.champion_customer_id
  WHERE cbc.branch_id = p_branch_id
  ORDER BY cbc.record_type
  LIMIT 2;
$$;

-- RPC: apura e atualiza o cinturão mensal
CREATE OR REPLACE FUNCTION public.update_city_belt(p_branch_id uuid, p_brand_id uuid)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_top_customer_id uuid;
  v_top_rides bigint;
  v_current_champion uuid;
  v_current_record bigint;
BEGIN
  -- Encontrar motorista com mais corridas no mês
  SELECT mr.driver_customer_id, COUNT(*)::bigint
  INTO v_top_customer_id, v_top_rides
  FROM machine_rides mr
  WHERE mr.branch_id = p_branch_id
    AND mr.ride_status = 'FINALIZED'
    AND mr.finalized_at >= date_trunc('month', now())
    AND mr.driver_customer_id IS NOT NULL
  GROUP BY mr.driver_customer_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  IF v_top_customer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhuma corrida encontrada no período');
  END IF;

  -- Verificar campeão atual
  SELECT champion_customer_id, record_value
  INTO v_current_champion, v_current_record
  FROM city_belt_champions
  WHERE branch_id = p_branch_id AND record_type = 'monthly';

  -- Se já é o mesmo campeão com o mesmo recorde, não fazer nada
  IF v_current_champion = v_top_customer_id AND v_current_record = v_top_rides THEN
    RETURN jsonb_build_object('success', true, 'changed', false);
  END IF;

  -- Upsert
  INSERT INTO city_belt_champions (branch_id, brand_id, champion_customer_id, record_value, record_type, achieved_at)
  VALUES (p_branch_id, p_brand_id, v_top_customer_id, v_top_rides, 'monthly', now())
  ON CONFLICT (branch_id, record_type)
  DO UPDATE SET
    champion_customer_id = EXCLUDED.champion_customer_id,
    record_value = EXCLUDED.record_value,
    achieved_at = EXCLUDED.achieved_at;

  -- Atualizar all_time se necessário
  INSERT INTO city_belt_champions (branch_id, brand_id, champion_customer_id, record_value, record_type, achieved_at)
  VALUES (p_branch_id, p_brand_id, v_top_customer_id, v_top_rides, 'all_time', now())
  ON CONFLICT (branch_id, record_type)
  DO UPDATE SET
    champion_customer_id = EXCLUDED.champion_customer_id,
    record_value = EXCLUDED.record_value,
    achieved_at = EXCLUDED.achieved_at
  WHERE EXCLUDED.record_value > city_belt_champions.record_value;

  RETURN jsonb_build_object('success', true, 'changed', true, 'champion_customer_id', v_top_customer_id, 'record_value', v_top_rides);
END;
$$;
