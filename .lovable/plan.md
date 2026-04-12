

## Plano: Corrigir resgate duplicado e tornar operação atômica

### Problema
- O checkout debita pontos e cria o pedido em operações separadas (não-atômicas)
- Sem proteção contra duplo clique — o usuário pode submeter múltiplas vezes
- Resultado: pontos debitados sem pedido correspondente

### Correção imediata dos dados
Migração SQL para reverter o débito órfão (3.700 pts perdidos):
- Deletar o registro de débito órfão do `points_ledger` (id: `bb0eefb0-...`, criado às 23:50)
- Atualizar `points_balance` do customer para +3.700

### Correção estrutural: função SQL atômica
Criar uma **database function** `process_product_redemption` que executa tudo numa única transação:
1. Verifica saldo suficiente
2. Insere débito no `points_ledger`
3. Decrementa `points_balance`
4. Cria o pedido em `product_redemption_orders`
5. Se qualquer passo falha, faz rollback de tudo

```sql
CREATE OR REPLACE FUNCTION public.process_product_redemption(
  p_customer_id uuid, p_brand_id uuid, p_branch_id uuid,
  p_deal_id uuid, p_deal_snapshot jsonb, p_affiliate_url text,
  p_points_cost int, p_name text, p_phone text, p_cpf text,
  p_cep text, p_address text, p_number text, p_complement text,
  p_neighborhood text, p_city text, p_state text, p_order_source text
) RETURNS uuid AS $$
DECLARE
  v_balance int;
  v_order_id uuid;
BEGIN
  SELECT points_balance INTO v_balance FROM customers WHERE id = p_customer_id FOR UPDATE;
  IF v_balance < p_points_cost THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;
  
  -- Debit + update balance + create order atomically
  INSERT INTO points_ledger (...) VALUES (...);
  UPDATE customers SET points_balance = v_balance - p_points_cost WHERE id = p_customer_id;
  INSERT INTO product_redemption_orders (...) VALUES (...) RETURNING id INTO v_order_id;
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Proteção contra duplo clique no frontend
- Em `CustomerRedeemCheckout.tsx` e `DriverRedeemCheckout.tsx`:
  - Substituir as 3 chamadas separadas por uma única chamada `supabase.rpc('process_product_redemption', {...})`
  - Adicionar `disabled={loading}` no botão (já existe) + guard `if (loading) return` no handler

### Resumo de arquivos

| Arquivo | Ação |
|---------|------|
| Migração SQL | Corrigir dados + criar função `process_product_redemption` |
| `CustomerRedeemCheckout.tsx` | Usar RPC atômica, guard contra duplo clique |
| `DriverRedeemCheckout.tsx` | Mesmo tratamento |

