

## Plano: Adicionar botão "Bonificar" na página CRM de Clientes

### Contexto
A página `CrmCustomersPage` lista todos os clientes mas não tem opção de bonificação manual. O `ManualCustomerScoringDialog` já existe e funciona. Basta integrá-lo nesta página.

### Mudanças

**Arquivo**: `src/pages/CrmCustomersPage.tsx`

1. Importar `ManualCustomerScoringDialog` e `useBrandGuard` para obter o `currentBrandId`
2. Importar ícone `Gift` do lucide-react
3. Adicionar estado `bonusCustomer` para controlar qual cliente está sendo bonificado
4. Na tabela, adicionar coluna "Ações" com botão `Gift` em cada linha (com `e.stopPropagation()` para não abrir o drawer)
5. No drawer de detalhes do cliente, adicionar botão "Bonificar Cliente" abaixo dos dados
6. Renderizar `ManualCustomerScoringDialog` com o cliente selecionado e o `brandId`
7. Invalidar também a query `crm-analytics-full` no sucesso (via `onOpenChange`)

### Detalhes técnicos
- O `ManualCustomerScoringDialog` aceita `customer: { id, name, branch_id? }` — o `CrmCustomer` já tem `id` e `name`
- `brandId` vem de `useBrandGuard().currentBrandId`
- Nenhuma migração SQL necessária

