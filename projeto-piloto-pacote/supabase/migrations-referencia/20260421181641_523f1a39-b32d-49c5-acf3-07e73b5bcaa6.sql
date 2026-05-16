-- 1) Coluna de patrocínio nos duelos
ALTER TABLE public.driver_duels
  ADD COLUMN IF NOT EXISTS sponsored_by_brand boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_duels_sponsored ON public.driver_duels(sponsored_by_brand) WHERE sponsored_by_brand = true;

-- 2) RPC de sugestões de matching por cidade
CREATE OR REPLACE FUNCTION public.get_duel_match_suggestions(
  p_branch_id uuid,
  p_volume_tolerance numeric DEFAULT 0.25,
  p_limit int DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pairs jsonb := '[]'::jsonb;
  v_no_data jsonb := '[]'::jsonb;
BEGIN
  -- Calcula perfil de cada participante elegível dos últimos 30 dias
  WITH eligible AS (
    SELECT
      ddp.id            AS participant_id,
      ddp.customer_id,
      COALESCE(ddp.public_nickname, ddp.display_name, c.name, 'Motorista') AS nome,
      c.customer_tier   AS tier
    FROM driver_duel_participants ddp
    JOIN customers c ON c.id = ddp.customer_id
    WHERE ddp.branch_id = p_branch_id
      AND ddp.duels_enabled = true
      -- exclui quem está em duelo aberto (live ou accepted)
      AND NOT EXISTS (
        SELECT 1 FROM driver_duels d
        WHERE d.status IN ('live', 'accepted', 'pending')
          AND (d.challenger_id = ddp.id OR d.challenged_id = ddp.id)
      )
  ),
  rides AS (
    SELECT
      mr.driver_customer_id AS customer_id,
      COUNT(*)::int AS rides_30d,
      -- bucket dominante por contagem
      (
        SELECT bucket FROM (
          SELECT
            CASE
              WHEN EXTRACT(HOUR FROM mr2.finalized_at) BETWEEN 5 AND 11 THEN 'manha'
              WHEN EXTRACT(HOUR FROM mr2.finalized_at) BETWEEN 12 AND 17 THEN 'tarde'
              WHEN EXTRACT(HOUR FROM mr2.finalized_at) BETWEEN 18 AND 23 THEN 'noite'
              ELSE 'madrugada'
            END AS bucket,
            COUNT(*) AS qt
          FROM machine_rides mr2
          WHERE mr2.driver_customer_id = mr.driver_customer_id
            AND mr2.branch_id = p_branch_id
            AND mr2.ride_status = 'FINALIZED'
            AND mr2.finalized_at >= NOW() - INTERVAL '30 days'
          GROUP BY 1
          ORDER BY qt DESC
          LIMIT 1
        ) t
      ) AS hour_bucket
    FROM machine_rides mr
    WHERE mr.branch_id = p_branch_id
      AND mr.ride_status = 'FINALIZED'
      AND mr.finalized_at >= NOW() - INTERVAL '30 days'
    GROUP BY mr.driver_customer_id
  ),
  profile AS (
    SELECT
      e.participant_id,
      e.customer_id,
      e.nome,
      e.tier,
      COALESCE(r.rides_30d, 0) AS rides_30d,
      COALESCE(r.hour_bucket, 'sem_dados') AS hour_bucket
    FROM eligible e
    LEFT JOIN rides r ON r.customer_id = e.customer_id
  ),
  with_data AS (
    SELECT * FROM profile WHERE rides_30d > 0
  ),
  pairs AS (
    SELECT
      a.participant_id   AS a_participant_id,
      a.customer_id      AS a_customer_id,
      a.nome             AS a_nome,
      a.tier             AS a_tier,
      a.rides_30d        AS a_rides,
      a.hour_bucket      AS a_bucket,
      b.participant_id   AS b_participant_id,
      b.customer_id      AS b_customer_id,
      b.nome             AS b_nome,
      b.tier             AS b_tier,
      b.rides_30d        AS b_rides,
      b.hour_bucket      AS b_bucket,
      -- score 0..100
      (
        -- volume: 60 pts se diferença <= tolerância, decai linear até 0
        GREATEST(0, 60 * (1 - (ABS(a.rides_30d - b.rides_30d)::numeric / GREATEST(a.rides_30d, b.rides_30d, 1)) / GREATEST(p_volume_tolerance, 0.01)))
        -- horário: 30 se mesmo bucket
        + CASE WHEN a.hour_bucket = b.hour_bucket THEN 30 ELSE 0 END
        -- tier: 10 se mesmo tier
        + CASE WHEN COALESCE(a.tier,'') = COALESCE(b.tier,'') AND a.tier IS NOT NULL THEN 10 ELSE 0 END
      )::numeric AS score
    FROM with_data a
    JOIN with_data b
      ON a.customer_id < b.customer_id
     AND a.hour_bucket = b.hour_bucket
     AND ABS(a.rides_30d - b.rides_30d)::numeric <= (GREATEST(a.rides_30d, b.rides_30d) * p_volume_tolerance)
  ),
  ranked AS (
    SELECT * FROM pairs WHERE score > 0 ORDER BY score DESC
  ),
  -- Algoritmo guloso: cada motorista entra em no máximo 1 par
  greedy AS (
    SELECT *
    FROM ranked r
    WHERE NOT EXISTS (
      SELECT 1 FROM ranked r2
      WHERE r2.score > r.score
        AND (r2.a_customer_id IN (r.a_customer_id, r.b_customer_id)
          OR r2.b_customer_id IN (r.a_customer_id, r.b_customer_id))
    )
    LIMIT p_limit
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'a_participant_id', a_participant_id,
    'a_customer_id', a_customer_id,
    'a_nome', a_nome,
    'a_tier', a_tier,
    'a_rides_30d', a_rides,
    'a_hour_bucket', a_bucket,
    'b_participant_id', b_participant_id,
    'b_customer_id', b_customer_id,
    'b_nome', b_nome,
    'b_tier', b_tier,
    'b_rides_30d', b_rides,
    'b_hour_bucket', b_bucket,
    'score', ROUND(score, 1)
  ) ORDER BY score DESC), '[]'::jsonb)
  INTO v_pairs
  FROM greedy;

  -- Lista paralela: motoristas elegíveis sem corridas no período
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'participant_id', participant_id,
    'customer_id', customer_id,
    'nome', nome,
    'tier', tier
  )), '[]'::jsonb)
  INTO v_no_data
  FROM (
    SELECT p.participant_id, p.customer_id, p.nome, p.tier
    FROM (
      SELECT
        e.participant_id, e.customer_id, e.nome, e.tier,
        COALESCE(r.rides_30d, 0) AS rides_30d
      FROM (
        SELECT
          ddp.id AS participant_id,
          ddp.customer_id,
          COALESCE(ddp.public_nickname, ddp.display_name, c.name, 'Motorista') AS nome,
          c.customer_tier AS tier
        FROM driver_duel_participants ddp
        JOIN customers c ON c.id = ddp.customer_id
        WHERE ddp.branch_id = p_branch_id AND ddp.duels_enabled = true
      ) e
      LEFT JOIN (
        SELECT mr.driver_customer_id AS customer_id, COUNT(*)::int AS rides_30d
        FROM machine_rides mr
        WHERE mr.branch_id = p_branch_id
          AND mr.ride_status = 'FINALIZED'
          AND mr.finalized_at >= NOW() - INTERVAL '30 days'
        GROUP BY 1
      ) r ON r.customer_id = e.customer_id
    ) p
    WHERE p.rides_30d = 0
  ) q;

  RETURN jsonb_build_object(
    'success', true,
    'pairs', v_pairs,
    'pairs_count', jsonb_array_length(v_pairs),
    'no_data_drivers', v_no_data
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_duel_match_suggestions(uuid, numeric, int) TO authenticated;

-- 3) RPC de criação em massa
CREATE OR REPLACE FUNCTION public.admin_create_bulk_duels(
  p_branch_id uuid,
  p_brand_id uuid,
  p_pairs jsonb,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_prize_points_per_pair int DEFAULT 0,
  p_sponsored boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pair jsonb;
  v_challenger_cust uuid;
  v_challenged_cust uuid;
  v_challenger driver_duel_participants%ROWTYPE;
  v_challenged driver_duel_participants%ROWTYPE;
  v_total_pairs int := 0;
  v_total_cost numeric := 0;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
  v_created_ids uuid[] := ARRAY[]::uuid[];
  v_duel_id uuid;
BEGIN
  IF p_pairs IS NULL OR jsonb_typeof(p_pairs) <> 'array' OR jsonb_array_length(p_pairs) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhum par informado');
  END IF;

  IF p_start_at >= p_end_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Data de início deve ser anterior à de fim');
  END IF;

  v_total_pairs := jsonb_array_length(p_pairs);
  v_total_cost := v_total_pairs * GREATEST(p_prize_points_per_pair, 0);

  -- Bloqueia carteira e valida saldo (uma única transação)
  IF v_total_cost > 0 THEN
    SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = p_branch_id FOR UPDATE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Carteira da cidade não encontrada');
    END IF;
    IF v_wallet.balance < v_total_cost THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Saldo insuficiente',
        'balance', v_wallet.balance,
        'required', v_total_cost
      );
    END IF;
  END IF;

  -- Cria os duelos
  FOR v_pair IN SELECT * FROM jsonb_array_elements(p_pairs)
  LOOP
    v_challenger_cust := (v_pair->>'challenger_customer_id')::uuid;
    v_challenged_cust := (v_pair->>'challenged_customer_id')::uuid;

    IF v_challenger_cust IS NULL OR v_challenged_cust IS NULL OR v_challenger_cust = v_challenged_cust THEN
      CONTINUE;
    END IF;

    SELECT * INTO v_challenger FROM driver_duel_participants
    WHERE customer_id = v_challenger_cust AND branch_id = p_branch_id AND duels_enabled = true;
    IF NOT FOUND THEN CONTINUE; END IF;

    SELECT * INTO v_challenged FROM driver_duel_participants
    WHERE customer_id = v_challenged_cust AND branch_id = p_branch_id AND duels_enabled = true;
    IF NOT FOUND THEN CONTINUE; END IF;

    INSERT INTO driver_duels (
      branch_id, brand_id, challenger_id, challenged_id,
      start_at, end_at, status, accepted_at,
      prize_points, sponsored_by_brand
    ) VALUES (
      p_branch_id, p_brand_id, v_challenger.id, v_challenged.id,
      p_start_at, p_end_at, 'accepted', NOW(),
      GREATEST(p_prize_points_per_pair, 0), p_sponsored
    )
    RETURNING id INTO v_duel_id;

    v_created_ids := array_append(v_created_ids, v_duel_id);
  END LOOP;

  -- Recalcula custo real (alguns pares podem ter sido descartados)
  v_total_cost := array_length(v_created_ids, 1) * GREATEST(p_prize_points_per_pair, 0);

  -- Debita carteira de uma vez
  IF v_total_cost > 0 AND v_wallet.id IS NOT NULL THEN
    v_new_balance := v_wallet.balance - v_total_cost;

    UPDATE branch_points_wallet
    SET balance = v_new_balance,
        total_distributed = total_distributed + v_total_cost,
        updated_at = now()
    WHERE id = v_wallet.id;

    INSERT INTO branch_wallet_transactions (
      branch_id, brand_id, transaction_type, amount, balance_after, description
    ) VALUES (
      p_branch_id, p_brand_id, 'DEBIT', v_total_cost, v_new_balance,
      'Lote de duelos' ||
      CASE WHEN p_sponsored THEN ' (patrocinado pelo empreendedor)' ELSE '' END ||
      ' — ' || COALESCE(array_length(v_created_ids, 1), 0)::text || ' duelos × ' || p_prize_points_per_pair::text || ' pts'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'created_count', COALESCE(array_length(v_created_ids, 1), 0),
    'requested_count', v_total_pairs,
    'total_cost', v_total_cost,
    'duel_ids', to_jsonb(v_created_ids)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_bulk_duels(uuid, uuid, jsonb, timestamptz, timestamptz, int, boolean) TO authenticated;