
-- RPC to list ALL drivers in a branch for duel selection
CREATE OR REPLACE FUNCTION public.list_branch_drivers_for_duels(
  p_branch_id uuid,
  p_exclude_customer_id uuid
)
RETURNS TABLE (
  customer_id uuid,
  display_name text,
  public_nickname text,
  avatar_url text,
  is_enrolled boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id AS customer_id,
    TRIM(REGEXP_REPLACE(c.name, '\[MOTORISTA\]\s*', '', 'gi')) AS display_name,
    ddp.public_nickname,
    ddp.avatar_url,
    (ddp.id IS NOT NULL AND ddp.duels_enabled = true) AS is_enrolled
  FROM customers c
  LEFT JOIN driver_duel_participants ddp ON ddp.customer_id = c.id
  WHERE c.branch_id = p_branch_id
    AND c.is_active = true
    AND c.name ILIKE '%[MOTORISTA]%'
    AND c.id != p_exclude_customer_id
  ORDER BY ddp.duels_enabled DESC NULLS LAST, TRIM(REGEXP_REPLACE(c.name, '\[MOTORISTA\]\s*', '', 'gi'))
$$;

-- Update create_duel_challenge to auto-enroll challenged driver
CREATE OR REPLACE FUNCTION public.create_duel_challenge(
  p_challenger_customer_id uuid,
  p_challenged_customer_id uuid,
  p_branch_id uuid,
  p_brand_id uuid,
  p_start_at timestamp with time zone,
  p_end_at timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenger driver_duel_participants%ROWTYPE;
  v_challenged driver_duel_participants%ROWTYPE;
  v_duel_id uuid;
  v_display_name text;
BEGIN
  -- Validate challenger
  SELECT * INTO v_challenger FROM driver_duel_participants
  WHERE customer_id = p_challenger_customer_id AND branch_id = p_branch_id AND duels_enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Desafiante não está habilitado para duelos');
  END IF;

  -- Auto-enroll challenged if not exists
  SELECT * INTO v_challenged FROM driver_duel_participants
  WHERE customer_id = p_challenged_customer_id AND branch_id = p_branch_id;
  
  IF NOT FOUND THEN
    SELECT TRIM(REGEXP_REPLACE(name, '\[MOTORISTA\]\s*', '', 'gi'))
    INTO v_display_name FROM customers WHERE id = p_challenged_customer_id;

    INSERT INTO driver_duel_participants (customer_id, branch_id, brand_id, duels_enabled, display_name)
    VALUES (p_challenged_customer_id, p_branch_id, p_brand_id, true, v_display_name)
    RETURNING * INTO v_challenged;
  ELSIF NOT v_challenged.duels_enabled THEN
    UPDATE driver_duel_participants SET duels_enabled = true WHERE id = v_challenged.id;
    v_challenged.duels_enabled := true;
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
