

## Correção: Layout mobile dos cards de cidade

### Problemas identificados

1. **Botões de ação cortados**: Os 3 botões ("Criar Franqueado", "Resetar pontos", "Editar") estão em uma linha sem `flex-wrap`, causando overflow horizontal no mobile.
2. **Padding esquerdo excessivo**: `pl-12` nos badges e botões desperdiça espaço em telas pequenas.

### Correção

**Arquivo:** `src/pages/BrandBranchesPage.tsx`

1. **Linha dos botões (linha 139)**: Adicionar `flex-wrap` para que os botões quebrem linha no mobile:
   ```
   // De:
   <div className="flex items-center gap-2 pl-12">
   
   // Para:
   <div className="flex items-center gap-2 flex-wrap pl-0 sm:pl-12">
   ```

2. **Linha dos badges (linha 114)**: Reduzir padding no mobile:
   ```
   // De:
   <div className="flex items-center gap-2 flex-wrap pl-12">
   
   // Para:
   <div className="flex items-center gap-2 flex-wrap pl-0 sm:pl-12">
   ```

### Resultado

- Mobile: botões empilham em 2 linhas, sem corte, sem padding excessivo
- Desktop/tablet: layout inalterado com `pl-12`

### Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/pages/BrandBranchesPage.tsx` | `flex-wrap` nos botões + padding responsivo |

