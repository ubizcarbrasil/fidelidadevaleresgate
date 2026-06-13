-- ============================================================================
-- increment_customer_balance: atomic increment de saldo do customer
-- ============================================================================
--
-- Resolve race condition no earn-webhook (e demais callers que precisam
-- INCREMENTAR balance sem read-then-write). Padrão atual:
--
--   const newPoints = customer.points_balance + points;  -- READ
--   await supabase.from("customers").update({ points_balance: newPoints })
--                                   .eq("id", id);       -- WRITE
--
-- Cenário de race em 2 webhooks paralelos pro mesmo customer:
--   Req A lê balance=100, Req B lê balance=100,
--   Req A escreve 110, Req B escreve 105 → 10 pontos sumiram.
--
-- Esta RPC encapsula o increment como single UPDATE statement, que é
-- atomic no Postgres. Não usa LOCK explícito porque single statement
-- UPDATE já é serializável em row level.
--
-- IMPORTANTE: esta RPC NÃO insere em points_ledger — diferente da
-- `credit_customer_points` legada. O caller é responsável por logar
-- o ledger (com reference_id correto). Isso permite separar ledger
-- (com contexto rico) de balance update (que precisa atomicidade).

CREATE OR REPLACE FUNCTION public.increment_customer_balance(
  p_customer_id uuid,
  p_points integer DEFAULT 0,
  p_money numeric DEFAULT 0
)
RETURNS TABLE (
  new_points_balance numeric,
  new_money_balance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE customers
  SET
    points_balance = COALESCE(points_balance, 0) + COALESCE(p_points, 0),
    money_balance = COALESCE(money_balance, 0) + COALESCE(p_money, 0),
    updated_at = now()
  WHERE id = p_customer_id
  RETURNING points_balance, money_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_customer_balance(uuid, integer, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_customer_balance(uuid, integer, numeric) TO service_role;

COMMENT ON FUNCTION public.increment_customer_balance(uuid, integer, numeric) IS
  'B (fix race): atomic increment de points_balance/money_balance. Substitui padrão read-then-write em earn-webhook e similares. Retorna novos saldos pós-update.';
