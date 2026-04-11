

## Plano: Adicionar botão "Bonificar" na CustomersPage

### Problema
O botão de bonificação manual existe no CrmCustomersPage e no ScoredCustomersPanel, mas não na página principal de clientes (`CustomersPage`), que é a tela mostrada no screenshot.

### Mudanças

**Arquivo**: `src/pages/CustomersPage.tsx`

1. Importar `ManualCustomerScoringDialog` e ícone `Gift`
2. Adicionar estado `bonusCustomer` 
3. **Mobile (cards)**: adicionar botão `Gift` ao lado dos botões de Extrato e Editar (linha 343-346)
4. **Desktop (tabela)**: adicionar botão `Gift` na coluna Ações ao lado de Extrato e Editar (linha 415-417)
5. Renderizar `ManualCustomerScoringDialog` com o cliente selecionado e `currentBrandId`
6. Ao fechar o dialog, invalidar query `["customers"]` para atualizar o saldo

### Detalhes técnicos
- Nenhuma migração SQL necessária
- Reutiliza o `ManualCustomerScoringDialog` já existente
- O customer já tem `id`, `name` e `branch_id` disponíveis no data

