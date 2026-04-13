

## Plano: Criar RPC `credit_customer_points` que está faltando

### Problema
O webhook `machine-webhook` chama `credit_customer_points` para creditar pontos aos motoristas e passageiros. Essa RPC **não existe** no banco de dados. Resultado: todas as corridas finalizadas após o reset não atualizam `points_balance`, e o ranking mostra vazio.

### Solução

**Migração SQL** — Criar a RPC `credit_customer_points` que:
1. Atualiza `customers.points_balance` atomicamente com lock de linha (`FOR UPDATE`)
2. Insere registro no `points_ledger` para auditoria

```sql
CREATE OR REPLACE FUNCTION public.credit_customer_points(
  p_customer_id uuid,
  p_brand_id uuid,
  p_branch_id uuid,
  p_points integer,
  p_money numeric DEFAULT 0,
  p_reason text DEFAULT '',
  p_reference_type text DEFAULT 'MACHINE_RIDE'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_balance numeric;
BEGIN
  -- Lock row and update balance
  SELECT points_balance INTO v_current_balance
  FROM customers WHERE id = p_customer_id FOR UPDATE;

  UPDATE customers
  SET points_balance = points_balance + p_points
  WHERE id = p_customer_id;

  -- Audit entry
  INSERT INTO points_ledger (
    customer_id, brand_id, branch_id,
    entry_type, points_amount, reason,
    reference_type, created_by_user_id
  ) VALUES (
    p_customer_id, p_brand_id, p_branch_id,
    'CREDIT', p_points, p_reason,
    p_reference_type, NULL
  );
END;
$$;
```

### Impacto
- Nenhuma alteração no frontend ou no webhook — a assinatura da RPC corresponde exatamente ao que o webhook já chama
- Corridas novas passarão a creditar pontos corretamente
- O ranking voltará a funcionar automaticamente (já lê `points_balance`)

