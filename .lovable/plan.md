

## Problemas identificados

A tela mostra "Nenhuma cidade selecionada" e o menu exibe o texto cru "sidebar.gamificacao" em vez de "Duelos & Ranking". São dois bugs:

1. **Label faltando**: A chave `sidebar.gamificacao` não existe no mapa `DEFAULT_LABELS` em `src/hooks/useMenuLabels.ts`, então o `getLabel()` retorna a própria chave como fallback.

2. **Sem seletor de cidade para Brand Admin**: A `GamificacaoAdminPage` depende de `currentBranchId` (disponível apenas para franqueados/Branch Admin). Quando o empreendedor (Brand Admin) acessa, não há `currentBranchId`, então a query nem executa e cai no fallback "Nenhuma cidade selecionada". A página precisa de um seletor de cidade para o escopo BRAND.

## Correções

### 1. Adicionar label no mapa de defaults

**Arquivo**: `src/hooks/useMenuLabels.ts`

Adicionar na seção `admin` do `DEFAULT_LABELS`:
```ts
"sidebar.gamificacao": "Duelos & Ranking",
```

### 2. Adicionar seletor de cidade na GamificacaoAdminPage

**Arquivo**: `src/pages/GamificacaoAdminPage.tsx`

Quando `consoleScope === "BRAND"` e não há `currentBranchId`, buscar a lista de cidades da marca e exibir um `<Select>` para o usuário escolher qual cidade gerenciar. Usar `useState` para armazenar o `branchId` selecionado e passar para a query existente.

Fluxo:
- Se `consoleScope === "BRANCH"` → usa `currentBranchId` direto (comportamento atual)
- Se `consoleScope === "BRAND"` → busca cidades da marca, exibe dropdown, usa o ID selecionado

### Arquivos modificados
- `src/hooks/useMenuLabels.ts` — adicionar `"sidebar.gamificacao": "Duelos & Ranking"`
- `src/pages/GamificacaoAdminPage.tsx` — adicionar seletor de cidade para Brand Admin

