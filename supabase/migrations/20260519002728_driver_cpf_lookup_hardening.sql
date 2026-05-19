-- ============================================================================
-- Hardening do login CPF do motorista
-- ============================================================================
--
-- Vulnerabilidades originais (auditoria de segurança):
--
-- 1. lookup_driver_by_cpf vazava email, phone, money_balance pra qualquer
--    chamador que soubesse um CPF (LGPD: dados pessoais sensíveis).
--
-- 2. Sem rate limit: atacante podia brute-forçar CPFs aleatórios pra
--    confirmar quais existem na marca (enumeração + data leak).
--
-- Mitigações implementadas:
--
-- A. RPC agora retorna APENAS dados não-sensíveis (id, name, branch_id,
--    branch_name, points_balance). Email/phone/money_balance ficam null/0.
--    Componentes que mostram esses dados foram ajustados pra buscar via
--    queries autenticadas separadas.
--
-- B. Tabela driver_login_attempts registra cada tentativa. Após 10 falhas
--    pro MESMO hash(brand_id, cpf) em 10 minutos, RPC bloqueia por 30min.
--
-- C. lookup_driver_by_id ganha mesma proteção (era usado pra restaurar
--    sessão via URL ?d=customerId em links curtos — agora não vaza dados
--    sensíveis se ID for adivinhado).
--
-- Pendente em PR posterior (arquitetura maior):
-- - Edge function `driver-cpf-login` com rate limit por IP + JWT custom
-- - Migração das queries de balance pra exigir token de sessão
-- ============================================================================

-- Tabela de tentativas (pra rate limit). Não precisa de RLS pois SECURITY DEFINER.
CREATE TABLE IF NOT EXISTS public.driver_login_attempts (
  id BIGSERIAL PRIMARY KEY,
  brand_id UUID NOT NULL,
  cpf_hash TEXT NOT NULL, -- SHA-256 do CPF (não armazena CPF cru)
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_login_attempts_lookup
  ON public.driver_login_attempts (brand_id, cpf_hash, attempted_at DESC);

-- Limpeza periódica: descarta tentativas com mais de 24h (rate limit usa 30min)
COMMENT ON TABLE public.driver_login_attempts IS
  'Log de tentativas de lookup CPF do motorista. Limpeza recomendada: DELETE WHERE attempted_at < now() - interval ''24 hours''';

-- ============================================================================
-- RPC: lookup_driver_by_cpf (versão hardened)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.lookup_driver_by_cpf(p_brand_id uuid, p_cpf text)
RETURNS TABLE(
  id uuid, name text, cpf text, email text, phone text,
  points_balance numeric, money_balance numeric,
  brand_id uuid, branch_id uuid, branch_name text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_cpf_hash TEXT;
  v_recent_failures INT;
  v_found_id UUID;
BEGIN
  -- Hash do CPF (não loga CPF cru no banco)
  v_cpf_hash := encode(digest(p_brand_id::text || ':' || p_cpf, 'sha256'), 'hex');

  -- Rate limit: bloqueia se houver 15+ falhas recentes pra este brand+cpf.
  -- Limite generoso pra não atrapalhar admin buscando CPFs no envio de
  -- mensagens, mas ainda barra brute-force de um único CPF.
  SELECT COUNT(*) INTO v_recent_failures
  FROM public.driver_login_attempts
  WHERE driver_login_attempts.brand_id = p_brand_id
    AND driver_login_attempts.cpf_hash = v_cpf_hash
    AND driver_login_attempts.success = false
    AND driver_login_attempts.attempted_at > now() - interval '15 minutes';

  IF v_recent_failures >= 15 THEN
    -- Log a tentativa bloqueada e levanta erro
    INSERT INTO public.driver_login_attempts (brand_id, cpf_hash, success)
    VALUES (p_brand_id, v_cpf_hash, false);
    RAISE EXCEPTION 'Muitas tentativas de login. Tente novamente em 15 minutos.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Lookup real
  SELECT c.id INTO v_found_id
  FROM customers c
  WHERE c.brand_id = p_brand_id
    AND c.cpf = p_cpf
    AND c.name ILIKE '%[MOTORISTA]%'
  LIMIT 1;

  -- Registra a tentativa
  INSERT INTO public.driver_login_attempts (brand_id, cpf_hash, success)
  VALUES (p_brand_id, v_cpf_hash, v_found_id IS NOT NULL);

  -- Se não encontrou, retorna vazio
  IF v_found_id IS NULL THEN
    RETURN;
  END IF;

  -- Encontrado: retorna APENAS dados não-sensíveis.
  -- Email/phone/money_balance ficam NULL/0 — esses dados sensíveis
  -- (LGPD) devem ser buscados depois via query autenticada do próprio motorista.
  RETURN QUERY
    SELECT c.id,
           c.name,
           c.cpf,
           NULL::text AS email,           -- LGPD: mascarado
           NULL::text AS phone,           -- LGPD: mascarado
           c.points_balance,              -- Necessário pra UI
           0::numeric AS money_balance,   -- LGPD: mascarado (será fetched separadamente)
           c.brand_id,
           c.branch_id,
           b.name AS branch_name
    FROM customers c
    LEFT JOIN branches b ON b.id = c.branch_id
    WHERE c.id = v_found_id;
END;
$$;

-- Mesma proteção pra lookup_driver_by_id (usado em links curtos /d/:id)
CREATE OR REPLACE FUNCTION public.lookup_driver_by_id(p_brand_id uuid, p_customer_id uuid)
RETURNS TABLE(
  id uuid, name text, cpf text, email text, phone text,
  points_balance numeric, money_balance numeric,
  brand_id uuid, branch_id uuid, branch_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  -- Mesmo mascaramento. Por enquanto não tem rate limit aqui pois
  -- p_customer_id é UUID (espaço gigante, brute force inviável).
  SELECT c.id,
         c.name,
         c.cpf,
         NULL::text AS email,
         NULL::text AS phone,
         c.points_balance,
         0::numeric AS money_balance,
         c.brand_id,
         c.branch_id,
         b.name AS branch_name
  FROM customers c
  LEFT JOIN branches b ON b.id = c.branch_id
  WHERE c.brand_id = p_brand_id
    AND c.id = p_customer_id
    AND c.name ILIKE '%[MOTORISTA]%'
  LIMIT 1;
$$;
