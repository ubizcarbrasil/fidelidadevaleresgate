

## Plano: Atualizar Painel do Parceiro para tokens Cyan

O painel já usa `text-primary`, `bg-primary/10` etc. que resolvem para Cyan automaticamente. Os ajustes necessários são pontuais em cores hardcoded que não seguem os tokens do Design System.

### Mudanças

**1. `src/index.css` — KPI icon gradients**
- `.kpi-icon-blue`: atualizar de `hsl(187 90% 53%)` → `hsl(187 90% 53%)` (confirmar que já é Cyan, ajustar se não)
- Garantir que `.kpi-icon-green` e `.kpi-icon-emerald` usem `hsl(var(--success))` em vez de valores hardcoded

**2. `src/components/store-owner/EmitterUpgradeCard.tsx`**
- `from-amber-50 to-orange-50` → `from-warning/8 to-warning/3` (usa token `--warning`)
- `dark:from-amber-950/20 dark:to-orange-950/20` → remover (token `--warning` já adapta ao dark)
- `text-amber-600` → `text-warning`
- `border-amber-400 text-amber-700 bg-amber-50` → `border-warning/40 text-warning bg-warning/10`

**3. `src/components/store-owner/StoreOrdersTab.tsx`**
- `bg-amber-100` / `text-amber-600` → `bg-warning/15` / `text-warning`
- `bg-green-100` / `text-green-600` → `bg-success/15` / `text-success`

### Arquivos

| Arquivo | Escopo |
|---|---|
| `src/index.css` | Atualizar `.kpi-icon-*` para usar Cyan/tokens do DS |
| `src/components/store-owner/EmitterUpgradeCard.tsx` | Trocar amber/orange hardcoded por tokens `--warning` |
| `src/components/store-owner/StoreOrdersTab.tsx` | Trocar amber/green hardcoded por tokens `--warning`/`--success` |

### Regras
- Zero alteração em lógica, rotas, queries
- Somente cores de apresentação

