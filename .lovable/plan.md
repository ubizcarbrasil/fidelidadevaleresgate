

## Problema: Motoristas não recebem pontos — Causa raiz encontrada

### Diagnóstico
Os logs do banco mostram **dezenas de erros repetidos**:

```text
column "reference_type" is of type ledger_reference_type but expression is of type text
```

A função `credit_customer_points` recebe o parâmetro `p_reference_type` como `text`, mas a coluna `points_ledger.reference_type` é do tipo enum `ledger_reference_type`. O PostgreSQL não faz cast implícito de `text` para enum, então o INSERT falha silenciosamente — o webhook não verifica o erro retornado pelo RPC.

**Resultado**: a corrida é registrada em `machine_rides` com `driver_points_credited: 7`, mas o saldo do motorista fica em 0 e nenhuma entrada aparece no `points_ledger`.

### Solução (2 partes)

**1. Migração SQL — Corrigir a função `credit_customer_points`**

Adicionar cast explícito de `text` para `ledger_reference_type`:

```sql
CREATE OR REPLACE FUNCTION public.credit_customer_points(
  p_customer_id uuid, p_brand_id uuid, p_branch_id uuid,
  p_points integer, p_money numeric DEFAULT 0,
  p_reason text DEFAULT '', p_reference_type text DEFAULT 'MACHINE_RIDE'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current_balance numeric;
BEGIN
  SELECT points_balance INTO v_current_balance
  FROM customers WHERE id = p_customer_id FOR UPDATE;

  UPDATE customers
  SET points_balance = points_balance + p_points
  WHERE id = p_customer_id;

  INSERT INTO points_ledger (
    customer_id, brand_id, branch_id,
    entry_type, points_amount, reason,
    reference_type, created_by_user_id
  ) VALUES (
    p_customer_id, p_brand_id, p_branch_id,
    'CREDIT', p_points, p_reason,
    p_reference_type::ledger_reference_type, NULL  -- ← CAST ADICIONADO
  );
END; $$;
```

**2. Webhook — Adicionar verificação de erro no RPC**

No `machine-webhook/index.ts`, verificar o retorno do RPC para logar erros futuros:

```ts
const { error: rpcErr } = await sb.rpc("credit_customer_points", { ... });
if (rpcErr) {
  logger.error("credit_customer_points RPC failed", { machineRideId, driverCustomerId, error: rpcErr });
}
```

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| Nova migração SQL | Recriar `credit_customer_points` com `::ledger_reference_type` cast |
| `supabase/functions/machine-webhook/index.ts` | Checar erro do RPC e logar |

### Resultado esperado
- Motoristas passarão a acumular pontos normalmente nas próximas corridas finalizadas
- Erros de RPC serão logados para diagnóstico futuro
- Os pontos de corridas passadas que falharam precisarão de um ajuste manual ou reprocessamento

