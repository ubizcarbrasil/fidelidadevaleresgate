

# Revisão geral: Extrato, contagem de corridas e dados de motoristas

## Problemas encontrados

### 1. Contagem de corridas mostra 0 (bug confirmado)
A listagem de motoristas faz uma query em `machine_rides` para agregar corridas e pontos, mas **não define `.limit()`**. O Supabase aplica um limite padrão de **1000 linhas**, e a marca tem **4650 corridas**. Resultado: só os primeiros motoristas recebem contagem correta — os demais ficam com `+0` e `🚗 0`.

**Solução**: Criar uma RPC `get_driver_ride_stats` que faz `GROUP BY driver_customer_id` no servidor e retorna já agregado, eliminando o problema do limite de 1000 linhas.

### 2. Extrato vazio no painel admin
A RPC `get_driver_ledger` funciona corretamente no banco (testei e retorna dados). O problema provável é que o erro do RPC no frontend está sendo engolido silenciosamente — o `useQuery` chama o RPC, se falha cai no fallback direto em `machine_rides`, que por sua vez pode falhar por RLS (admin autenticado pode não ter política de SELECT em `machine_rides`).

**Solução**: 
- Remover o cast `(supabase as any)` e garantir que o RPC é chamado com tipagem correta
- Melhorar o tratamento de erro para logar o erro no console
- Garantir que o fallback funciona ou confiar apenas na RPC (que é SECURITY DEFINER)

### 3. Dados faltando em alguns motoristas
Motoristas como "Michel Santiago Cruvinel" não têm CPF, telefone ou e-mail. Isso é um problema de dados — foram importados via webhook sem esses dados. Não é bug de código, mas podemos melhorar a visibilidade mostrando alertas de "dados incompletos".

## Plano de implementação

### Migração SQL — nova RPC `get_driver_ride_stats`
```sql
CREATE FUNCTION get_driver_ride_stats(p_brand_id uuid, p_customer_ids uuid[])
RETURNS TABLE(customer_id uuid, total_rides bigint, total_ride_points numeric)
```
Faz `GROUP BY` no banco e retorna dados já agregados — sem limite de 1000 linhas.

### `DriverManagementPage.tsx`
- Substituir a query direta em `machine_rides` pela chamada à RPC `get_driver_ride_stats`
- Isso corrige a contagem de corridas e pontos para todos os motoristas

### `DriverLedgerSection.tsx` (aba Extrato do admin)
- Remover o fallback direto em `machine_rides` — confiar apenas na RPC `get_driver_ledger` que é SECURITY DEFINER
- Adicionar `console.error` no tratamento de erro para facilitar debug
- Remover cast `as any` desnecessário

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| Migração SQL | Nova RPC `get_driver_ride_stats` |
| `src/pages/DriverManagementPage.tsx` | Usar RPC para contagem de corridas |
| `src/components/driver-management/DriverLedgerSection.tsx` | Simplificar: usar apenas RPC, logar erros |

