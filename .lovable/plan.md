

# Sincronizar Carteira de Pontos com Pontos Realmente Distribuídos

## Problema
O webhook de corridas (`machine-webhook`) credita pontos aos motoristas (`driver_points_credited`) mas **nunca debita a carteira da cidade** (`branch_points_wallet`). Resultado: a carteira mostra saldo 0, total carregado 0, total distribuído 0 — quando na realidade 13.701 pontos já foram distribuídos.

O usuário quer que a carteira reflita a realidade: se nada foi carregado e 13.701 pts foram distribuídos, o saldo deve mostrar **-13.701 pts**.

## Solução em 3 partes

### 1. Migração: sincronizar o wallet existente com os dados reais
Atualizar o registro da `branch_points_wallet` para refletir o total já distribuído via `machine_rides`:
```sql
UPDATE branch_points_wallet bpw
SET total_distributed = sub.total,
    balance = bpw.total_loaded - sub.total
FROM (
  SELECT branch_id, COALESCE(SUM(driver_points_credited), 0) AS total
  FROM machine_rides WHERE ride_status = 'FINALIZED'
  GROUP BY branch_id
) sub
WHERE bpw.branch_id = sub.branch_id;
```
Isso vai colocar `balance = 0 - 13701 = -13701` e `total_distributed = 13701`.

### 2. Webhook: debitar a carteira a cada corrida
Adicionar chamada à RPC `debit_branch_wallet` no `machine-webhook/index.ts` após persistir a corrida, **mas sem bloquear** a distribuição quando o saldo for insuficiente. Para permitir saldo negativo, a RPC precisa ser ajustada.

**Ajustar a RPC `debit_branch_wallet`**: remover a validação que impede débito quando `balance < amount`, permitindo saldo negativo.

### 3. Frontend: exibir saldo negativo corretamente
A `BranchWalletPage.tsx` e `formatPoints` já suportam números negativos. O alerta de saldo baixo já funciona (mostra quando `balance <= threshold`). Apenas garantir que o alerta mostre valores negativos corretamente.

## Arquivos a modificar
- **Nova migration SQL** — sincronizar wallets + alterar `debit_branch_wallet` para permitir negativo
- `supabase/functions/machine-webhook/index.ts` — chamar `debit_branch_wallet` após creditar pontos ao motorista
- `src/lib/formatPoints.ts` — garantir formatação correta para negativos (já funciona, validar)

## Detalhes técnicos

### RPC `debit_branch_wallet` ajustada
Remove o `IF v_wallet.balance < p_amount` para permitir que o saldo fique negativo. A carteira funciona como um "extrato" que pode ficar devendo.

### Webhook
Após a linha que persiste a corrida em `machine_rides`, adicionar:
```typescript
if (driverPointsCredited > 0 && branchId) {
  await sb.rpc("debit_branch_wallet", {
    p_branch_id: branchId,
    p_amount: driverPointsCredited,
    p_description: `Corrida ${machineRideId} - ${driverName || 'Motorista'}`
  });
}
```

