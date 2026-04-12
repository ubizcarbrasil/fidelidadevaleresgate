

## Diagnóstico de Segurança: Sistema de Pontos

### Problemas encontrados

**1. Divergência entre saldo e ledger (CRÍTICO)**

Encontrei **20+ clientes** com diferença entre `points_balance` e o que o `points_ledger` registra. Exemplos:
- "Maçaneta": 2.772 pts no saldo, ZERO registros no ledger (drift de 2.772)
- "Elias [MOTORISTA]": saldo 3.411, mas ledger mostra apenas 2.068 líquidos (drift de 1.343)
- Vários motoristas com centenas de pontos não rastreados no ledger

Isso indica que pontos foram creditados diretamente no `points_balance` sem registrar no `points_ledger` em algum momento passado.

**2. Creditação de corridas NÃO é atômica (CRÍTICO)**

No `machine-webhook`, a creditação faz duas chamadas separadas:
```
1. INSERT no points_ledger  ← pode funcionar
2. UPDATE no points_balance ← pode falhar (ou vice-versa)
```
Se uma falhar e a outra não, cria divergência. O mesmo problema que corrigimos no resgate ainda existe na **creditação**.

**3. Vários pontos de estorno/cancelamento são não-atômicos**

Encontrei estornos manuais em:
- `ProductRedemptionOrdersPage.tsx` (rejeição de pedido)
- `CustomerRedemptionDetailPage.tsx` (cancelamento de resgate)
- `StoreOrdersTab.tsx` (aprovação de pedido)
- `EarnPointsPage.tsx` (pontuação manual)

Todos fazem operações separadas de UPDATE no saldo + INSERT no ledger, sem transação.

**4. Função atômica `process_product_redemption` está OK ✅**

A função criada anteriormente está correta:
- Usa `FOR UPDATE` para lock de linha
- Valida saldo antes de debitar
- Executa tudo numa transação SQL
- É `SECURITY DEFINER`

**5. Função `redeem_city_offer_driver` está OK ✅**

Também é atômica e segura.

---

### Plano de Correção

#### Etapa 1 — Criar função atômica para creditação de pontos

Criar `credit_customer_points(p_customer_id, p_brand_id, p_branch_id, p_points, p_money, p_reason, p_reference_type)` que:
1. Faz `SELECT ... FOR UPDATE` no customer
2. Insere no `points_ledger`
3. Atualiza `points_balance`
4. Tudo numa transação

#### Etapa 2 — Criar função atômica para estorno de pontos

Criar `refund_customer_points(p_customer_id, p_brand_id, p_branch_id, p_points, p_reason, p_reference_type, p_reference_id)` que:
1. Faz lock no customer
2. Insere CREDIT no ledger
3. Incrementa points_balance
4. Tudo atômico

#### Etapa 3 — Atualizar machine-webhook

Substituir as duas chamadas separadas (insert ledger + update balance) por uma única chamada à RPC `credit_customer_points`, tanto para passageiro quanto motorista.

#### Etapa 4 — Atualizar páginas de estorno

Atualizar os seguintes arquivos para usar `refund_customer_points`:
- `ProductRedemptionOrdersPage.tsx` (rejeição)
- `CustomerRedemptionDetailPage.tsx` (cancelamento)
- `StoreOrdersTab.tsx`

#### Etapa 5 — Corrigir divergência histórica

Criar migração SQL que sincroniza os saldos divergentes. Duas opções:
- **Opção A**: Inserir registros de ajuste no ledger para cobrir a diferença (mantém saldo atual, corrige o ledger)
- **Opção B**: Recalcular `points_balance` a partir do ledger (pode alterar saldos de clientes)

Recomendo **Opção A** — inserir entradas de ajuste no ledger com reason "Ajuste de reconciliação" para cada cliente com drift, preservando o saldo atual.

### Resumo de arquivos

| Arquivo | Ação |
|---------|------|
| Migração SQL | Criar funções `credit_customer_points` e `refund_customer_points` + reconciliação de dados |
| `supabase/functions/machine-webhook/index.ts` | Usar RPC atômica para creditação |
| `src/pages/ProductRedemptionOrdersPage.tsx` | Usar RPC atômica para estorno |
| `src/pages/customer/CustomerRedemptionDetailPage.tsx` | Usar RPC atômica para estorno |
| `src/components/store-owner/StoreOrdersTab.tsx` | Usar RPC atômica para creditação |
| `src/pages/EarnPointsPage.tsx` | Usar RPC atômica para creditação |
| `src/pages/CsvImportPage.tsx` | Usar RPC atômica para creditação em lote |

### Detalhes técnicos
- As funções serão `SECURITY DEFINER` com `search_path = public`
- Usam `FOR UPDATE` para prevenir condições de corrida
- Edge functions chamam via `sb.rpc(...)` em vez de insert + update separados
- A reconciliação insere entradas do tipo `CREDIT` com `reference_type = 'ADJUSTMENT'` para fechar o drift

