-- 1. Trocar PK de plan_key para id (UUID), preservando dados existentes
ALTER TABLE public.plan_ganha_ganha_pricing
  DROP CONSTRAINT IF EXISTS plan_ganha_ganha_pricing_pkey;

ALTER TABLE public.plan_ganha_ganha_pricing
  ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.plan_ganha_ganha_pricing
  ADD CONSTRAINT plan_ganha_ganha_pricing_pkey PRIMARY KEY (id);

-- 2. Garantir 1 linha ativa por plano
CREATE UNIQUE INDEX IF NOT EXISTS plan_ganha_ganha_pricing_active_uniq
  ON public.plan_ganha_ganha_pricing (plan_key)
  WHERE valid_to IS NULL;

-- 3. Índice de leitura histórica
CREATE INDEX IF NOT EXISTS plan_ganha_ganha_pricing_history_idx
  ON public.plan_ganha_ganha_pricing (plan_key, valid_from DESC);

-- 4. RPC atômica para atualizar preço com versionamento
CREATE OR REPLACE FUNCTION public.update_ganha_ganha_pricing(
  p_plan_key text,
  p_price_cents integer,
  p_min_margin_pct numeric DEFAULT NULL,
  p_max_margin_pct numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  -- Apenas root_admin pode atualizar pricing
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id AND role = 'root_admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores root podem atualizar pricing do Ganha-Ganha';
  END IF;

  -- Validações
  IF p_price_cents IS NULL OR p_price_cents < 1 OR p_price_cents > 1000 THEN
    RAISE EXCEPTION 'price_cents deve estar entre 1 e 1000 (R$ 0,01 a R$ 10,00)';
  END IF;

  IF p_min_margin_pct IS NOT NULL AND (p_min_margin_pct < 0 OR p_min_margin_pct > 500) THEN
    RAISE EXCEPTION 'min_margin_pct deve estar entre 0 e 500';
  END IF;

  IF p_max_margin_pct IS NOT NULL AND (p_max_margin_pct < 0 OR p_max_margin_pct > 500) THEN
    RAISE EXCEPTION 'max_margin_pct deve estar entre 0 e 500';
  END IF;

  IF p_min_margin_pct IS NOT NULL AND p_max_margin_pct IS NOT NULL
     AND p_max_margin_pct <= p_min_margin_pct THEN
    RAISE EXCEPTION 'max_margin_pct deve ser maior que min_margin_pct';
  END IF;

  -- 1) Fecha a versão atual
  UPDATE public.plan_ganha_ganha_pricing
     SET valid_to = now()
   WHERE plan_key = p_plan_key
     AND valid_to IS NULL;

  -- 2) Insere nova versão ativa
  INSERT INTO public.plan_ganha_ganha_pricing (
    plan_key, price_per_point_cents, min_margin_pct, max_margin_pct, valid_from, valid_to
  ) VALUES (
    p_plan_key, p_price_cents, p_min_margin_pct, p_max_margin_pct, now(), NULL
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_ganha_ganha_pricing(text, integer, numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_ganha_ganha_pricing(text, integer, numeric, numeric) TO authenticated;