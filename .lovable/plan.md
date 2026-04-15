

## Correção: sidebar exibindo "sidebar.dashboard" em vez de "Visão Geral"

### Problema
A função `getLabel` em `src/hooks/useMenuLabels.ts` monta o mapa de defaults apenas a partir de `BRAND_SIDEBAR_GROUPS`, `BRANCH_SIDEBAR_GROUPS` e `APP_GROUPS`. O item "sidebar.dashboard" não está em nenhum desses grupos, então o fallback retorna a key crua: `"sidebar.dashboard"`.

### Correção
Alterar o fallback da função `getLabel` (linha 288) para consultar também o `MENU_REGISTRY` antes de devolver a key crua.

### Arquivo afetado
- `src/hooks/useMenuLabels.ts`

### Mudança exata

Na linha 1, adicionar import do `MENU_REGISTRY`:
```typescript
import { MENU_REGISTRY } from "@/compartilhados/constants/constantes_menu_sidebar";
```

Na função `getLabel` (linha 285-289