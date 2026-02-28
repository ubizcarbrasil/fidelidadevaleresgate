

## Adicionar métricas de regras customizadas por loja ao Dashboard

### Alterações em `src/pages/Dashboard.tsx`

1. **Novas métricas via `useMetric`** para `store_points_rules`:
   - Total de regras
   - Ativas (`status = 'ACTIVE'`)
   - Pendentes (`status = 'PENDING_APPROVAL'`)
   - Rejeitadas (`status = 'REJECTED'`)

2. **Novo gráfico pie** "Regras de Loja" ao lado dos charts existentes (grid `md:grid-cols-2` → `md:grid-cols-3` ou adicionar uma terceira linha):
   - Fatias: Ativas, Pendentes, Rejeitadas
   - Mesmo padrão visual do pie de ofertas

3. **Alerta de pendentes** (similar ao alerta de resgates pendentes):
   - Se `storeRulesPending > 0`, mostrar card com borda warning e link para `/approve-store-rules`

4. **Visibilidade**: Mostrar para escopos `ROOT`, `TENANT`, `BRAND`, `BRANCH`

### Arquivo afetado
| Ação | Arquivo |
|------|---------|
| Editar | `src/pages/Dashboard.tsx` |

