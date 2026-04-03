
# Corrigir Cache do Modelo de Negócio ao Salvar

## Problema
Quando o empreendedor altera o modelo de negócio de uma cidade na página "Regras de Resgate", o sidebar do franqueado não reflete a mudança porque o cache da query `branch-scoring-model` não é invalidado. A página invalida `brand-settings` e `brand-branches-scoring`, mas esquece de invalidar `branch-scoring-model` — que é a query usada pelo hook `useBranchScoringModel` para filtrar os itens do menu.

## Solução
Adicionar invalidação da query `branch-scoring-model` no `onSuccess` da mutation de save em `RegrasResgatePage.tsx`:

```typescript
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["brand-settings"] });
  qc.invalidateQueries({ queryKey: ["brand-branches-scoring"] });
  qc.invalidateQueries({ queryKey: ["branch-scoring-model"] }); // ← adicionar
  toast.success(...);
},
```

## Arquivo a modificar
- `src/pages/RegrasResgatePage.tsx` — adicionar invalidação do cache `branch-scoring-model` no onSuccess da mutation
