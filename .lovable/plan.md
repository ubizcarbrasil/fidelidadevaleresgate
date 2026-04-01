

# Corrigir extrato de pontos do motorista — dados vêm de `machine_rides`

## Problema raiz
Os pontos dos motoristas são creditados via **`machine_rides`** (coluna `driver_points_credited`), mas o extrato busca na tabela **`points_ledger`**, que está praticamente vazia para motoristas. O `points_ledger` só tem 4 registros no total (ajustes manuais e resgates), enquanto as corridas reais estão em `machine_rides`.

## Solução
Atualizar a função `get_driver_ledger` para unir dados de **ambas as tabelas**: `machine_rides` (corridas finalizadas) e `points_ledger` (ajustes manuais e resgates), retornando um extrato completo.

### 1. Migração — Recriar `get_driver_ledger`

A função precisa fazer UNION entre:
- **`machine_rides`**: cada corrida finalizada gera uma entrada CREDIT com `driver_points_credited`, mostrando nome do passageiro, valor da corrida e horário
- **`points_ledger`**: ajustes manuais (CREDIT) e resgates (DEBIT) com `reason` do admin

Colunas retornadas: `id`, `entry_type`, `points_amount`, `money_amount`, `reason`, `reference_type`, `created_at`, `branch_name`

Para corridas, o `reason` será construído como "Corrida - {nome_passageiro}" e `reference_type` será `'MACHINE_RIDE'`.

### 2. Atualizar `DriverLedgerSection.tsx` (aba Extrato do admin)

Trocar a query direta em `points_ledger` pela chamada RPC `get_driver_ledger`, que já faz o UNION. Adicionar `reference_type` na interface e exibir ícones por tipo de origem.

### 3. Sem alteração no `DriverLedgerOverlay.tsx`

O overlay do motorista já usa a RPC `get_driver_ledger` — basta a migração atualizar a função para que os dados apareçam automaticamente.

### Arquivos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Recriar funcao `get_driver_ledger` com UNION |
| `src/components/driver-management/DriverLedgerSection.tsx` | Usar RPC em vez de query direta |

