

## Plano: Substituir barra inferior por menu hamburger no header

### Problema atual
A navegação principal (Início, Ofertas, Loja, Resgates, Carteira, Perfil) está numa barra fixa no rodapé, ocupando espaço na tela. O usuário quer mover todos esses itens para um menu hamburger (ícone de 3 linhas) no header, ao lado do ícone de carteira.

### Alterações

**Arquivo**: `src/components/customer/CustomerLayout.tsx`

1. **Remover a `<nav>` inferior** (linhas 356-410) — toda a barra de abas do rodapé será eliminada
2. **Adicionar botão hamburger no header** — ao lado do botão de carteira (linha ~296), inserir um botão com ícone `Menu` (lucide-react) que abre um drawer/sheet lateral
3. **Criar menu lateral (Sheet)** com os mesmos itens de `filteredTabs`:
   - Cada item mostra ícone + label
   - Ao clicar, fecha o menu e navega para a tab correspondente (`setActiveTab`)
   - Item ativo fica destacado visualmente
4. **Remover `pb-24`** do `<main>` (linha 325) já que não há mais barra inferior ocupando espaço — ajustar para `pb-6`

**Componente novo**: `src/components/customer/CustomerMenuDrawer.tsx`
- Sheet/Drawer lateral que recebe `filteredTabs`, `activeTab` e `onNavigate`
- Visual dark premium consistente com o design system
- Animação suave de entrada/saída
- Itens com ícone, label e indicador de ativo

### Resultado
- Header ganha um ícone de 3 linhas (hamburger) que abre menu lateral
- Menu lateral lista: Início, Ofertas, Loja, Resgates, Carteira, Perfil
- Rodapé fica livre — mais espaço para conteúdo
- Navegação mantém a mesma funcionalidade

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/customer/CustomerMenuDrawer.tsx` | Novo componente — drawer com itens de navegação |
| `src/components/customer/CustomerLayout.tsx` | Remover nav inferior, adicionar botão hamburger no header, passar props ao drawer |

