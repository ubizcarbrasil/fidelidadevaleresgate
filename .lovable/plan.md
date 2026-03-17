

## Command Palette (⌘K) — Plano de Implementação

### O que será feito
Criar um Command Palette funcional usando o componente `cmdk` já existente (`src/components/ui/command.tsx`), ativado por `⌘K` / `Ctrl+K` ou clicando no campo de busca do topbar. Permite busca global em: **páginas de navegação**, **ofertas**, **parceiros** e **clientes** (dados do banco).

---

### Arquitetura

**Novo arquivo**: `src/components/CommandPalette.tsx`
- Usa `CommandDialog` do `cmdk` já instalado
- Listener global `keydown` para `⌘K` / `Ctrl+K`
- 4 grupos de resultados:
  1. **Páginas** — lista estática das ~30 rotas admin com ícones (derivada do `routeLabels` do AppLayout)
  2. **Ofertas** — busca debounced na tabela `offers` (título, limit 5)
  3. **Parceiros** — busca debounced na tabela `stores` (nome, limit 5)
  4. **Clientes** — busca debounced na tabela `customers` (nome/email, limit 5)
- Navegação via `useNavigate` ao selecionar item
- Filtragem client-side para páginas, server-side (Supabase `.ilike`) para dados

**Alteração**: `src/components/AppLayout.tsx`
- Substituir o `<Input>` decorativo do topbar por um botão que abre o Command Palette
- Importar e renderizar `<CommandPalette />`

---

### Detalhes técnicos

- Usa `useDebounce` existente (300ms) para queries de dados
- Queries condicionais: só executam quando há ≥2 caracteres digitados
- Cada resultado de dados navega para a página de detalhe/edição correspondente
- Keyboard: `Enter` seleciona, `↑↓` navega, `Esc` fecha
- Funciona em mobile via botão de busca (sem atalho de teclado)

### Arquivos afetados
| Arquivo | Ação |
|---------|------|
| `src/components/CommandPalette.tsx` | **Criar** — componente principal |
| `src/components/AppLayout.tsx` | **Editar** — trocar Input por botão + renderizar palette |

