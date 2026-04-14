

## Centralizar configuração de menus dos sidebars

### Problema
Os 3 sidebars (`RootSidebar`, `BrandSidebar`, `BranchSidebar`) definem cada um seu próprio array `groups` com itens de menu. Muitos itens compartilham a mesma `key` e `url` mas podem ter `defaultTitle`, `icon` ou `moduleKey` diferentes entre eles. Quando se altera um item num sidebar, os outros ficam desatualizados.

### Solução
Criar um **registro central único** de todos os itens de menu, e fazer cada sidebar referenciar esse registro em vez de duplicar as definições.

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/compartilhados/constants/constantes_menu_sidebar.ts` | **Novo** — Registro central com todos os itens de menu (key, defaultTitle, url, icon, moduleKey, scoringFilter) |
| `src/components/consoles/RootSidebar.tsx` | Refatorar `groups` para importar itens do registro central, mantendo apenas a estrutura de grupos específica do Root |
| `src/components/consoles/BrandSidebar.tsx` | Refatorar `groups` para importar itens do registro central, mantendo apenas a estrutura de grupos e filtros específicos do Brand |
| `src/components/consoles/BranchSidebar.tsx` | Refatorar `groups` para importar itens do registro central, mantendo apenas a estrutura de grupos e filtros específicos do Branch |

### Como funciona

1. **Registro central** — Um `Map` ou objeto indexado por `key` (ex: `"sidebar.parceiros"`) contendo `defaultTitle`, `url`, `icon`, `moduleKey` e `scoringFilter`. Fonte única da verdade para cada item.

2. **Grupos por sidebar** — Cada sidebar define apenas a **estrutura de grupos** (label, ordem, quais keys incluir) e pode sobrescrever campos específicos quando necessário (ex: Branch tem `branchModuleKey`). Os dados base vêm do registro.

3. **Função helper** — `buildSidebarGroups(groupDefs, registry)` que monta os grupos finais mesclando a definição local com o registro central.

```text
Antes:
  RootSidebar.tsx   → groups[] (definição completa inline)
  BrandSidebar.tsx  → groups[] (definição completa inline, duplicada)
  BranchSidebar.tsx → groups[] (definição completa inline, duplicada)

Depois:
  constantes_menu_sidebar.ts → MENU_REGISTRY (fonte única)
  RootSidebar.tsx   → rootGroupDefs[] (só keys + estrutura) → buildGroups()
  BrandSidebar.tsx  → brandGroupDefs[] (só keys + estrutura) → buildGroups()
  BranchSidebar.tsx → branchGroupDefs[] (só keys + estrutura) → buildGroups()
```

### Regras de merge
- Se um item mudar `defaultTitle`, `url` ou `icon` no registro central, todas as sidebars refletem automaticamente.
- Cada sidebar pode adicionar propriedades extras (ex: `branchModuleKey` no Branch) sem afetar os outros.
- Items que existem em apenas um sidebar continuam no registro central — são simplesmente referenciados apenas por aquele sidebar.

### O que NÃO muda
- Nenhuma rota é removida ou adicionada
- O comportamento visual dos sidebars permanece idêntico
- A lógica de filtragem por módulo/scoring permanece em cada sidebar
- Os componentes `CollapsibleGroup` não mudam

