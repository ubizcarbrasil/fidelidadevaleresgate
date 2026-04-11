

## Plano: Adicionar Pontos Manualmente para Clientes/Passageiros

### Contexto
Já existe o `ManualDriverScoringDialog` para motoristas. O `ScoredCustomersPanel` mostra clientes mas não tem botão de bonificação manual. Vamos criar o equivalente para clientes.

### Mudanças

**Arquivo 1 (novo)**: `src/components/machine-integration/ManualCustomerScoringDialog.tsx`
- Componente idêntico ao `ManualDriverScoringDialog`, adaptado para clientes
- Props: `open`, `onOpenChange`, `customer` (id, name, branch_id), `brandId`
- Insere no `points_ledger` com `reference_type: "MANUAL_BONUS"` e `entry_type: "CREDIT"`
- Atualiza `points_balance` no registro do customer
- Invalida queries `["scored-customers"]` e `["customer-ledger-machine"]`

**Arquivo 2**: `src/components/machine-integration/ScoredCustomersPanel.tsx`
- Adicionar estado `bonusCustomer` para controlar qual cliente está recebendo bonificação
- Adicionar botão de "Bonificar" (ícone `Gift`) ao lado do botão "Ver" em cada linha de cliente
- Adicionar botão "Bonificar" também dentro do drawer de detalhes do cliente
- Renderizar `ManualCustomerScoringDialog` com o cliente selecionado

### Detalhes técnicos
- Nenhuma migração SQL necessária — usa tabelas existentes (`points_ledger`, `customers`)
- Mesma lógica do driver: insert no ledger + update no saldo
- `reason` default: "Bonificação manual - Passageiro"

