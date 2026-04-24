## Problema

No menu lateral do empreendedor (mobile e desktop), não há um atalho direto para a tela inicial ("Visão Geral / Dashboard"). O item "Visão Geral" existe, mas está dentro do grupo colapsável "Painel" — e em algumas marcas (como a do print: Ubiz Shop) o grupo nem aparece porque o item depende do módulo `dashboard` estar habilitado, e o grupo todo some quando o item é filtrado.

Resultado: ao abrir o menu em mobile, o usuário começa em "Guias & Manuais" e não tem como voltar para a Visão Geral pelo menu — só fechando o menu e usando outro caminho.

## Solução

Promover "Visão Geral" a **item fixo no topo do sidebar**, sempre visível, fora dos grupos colapsáveis e independente do módulo `dashboard` estar habilitado (já que toda marca tem uma tela inicial).

### Como vai ficar

```text
┌─ Ubiz Shop · Gestão Estratégica ──┐
│                                    │
│  🏠  Visão Geral        ← NOVO     │
│ ─────────────────────              │
│  > GUIAS & MANUAIS                 │
│  > CIDADES                         │
│  > PERSONALIZAÇÃO & VITRINE        │
│  ...                               │
└────────────────────────────────────┘
```

- Item destacado, sempre visível, sem precisar expandir nada.
- Marca como ativo automaticamente quando a rota é `/`.
- Em mobile, ao tocar fecha o sidebar e navega para a Home.
- Em desktop colapsado, mostra só o ícone com tooltip "Visão Geral".

### Arquivos a modificar

1. **`src/components/consoles/BrandSidebar.tsx`**
   - Adicionar bloco `SidebarGroup` fixo no topo do `SidebarContent` com um único `SidebarMenuItem` apontando para `/` (ícone `LayoutDashboard`, label "Visão Geral" obtida via `getLabel("sidebar.dashboard")` para respeitar rótulos personalizados).
   - Marcar como `isActive` quando `location.pathname === "/"`.
   - Fechar o menu mobile no clique (`setOpenMobile(false)`).

2. **`src/compartilhados/constants/constantes_grupos_sidebar_marca.ts`**
   - Remover o grupo "Painel" da lista (vira item fixo, não precisa mais do grupo colapsável duplicado).

### Impacto colateral

- A página de **Pré-visualização do Produto Comercial** (que usa `brandGroupDefs` para montar o preview do sidebar) precisa também mostrar o "Visão Geral" como item fixo. Vou ajustar o componente de preview do sidebar para refletir essa mesma estrutura (item fixo + grupos), mantendo a consistência entre o que o admin configura no produto e o que a marca enxerga.

- Não afeta nenhuma permissão: a rota `/` já é acessível por todos os perfis de admin de marca; estamos apenas tornando o atalho mais descobrível.

## Outros pontos verificados

- Os outros consoles (Branch / Store / Root) usam sidebars próprios com seus próprios grupos — não há regressão neles.
- O sumiço do grupo "Painel" para a Ubiz Shop confirma que o módulo `dashboard` não está habilitado para essa marca; ainda assim, o usuário precisa do atalho para a Home (ela existe e funciona). Por isso o item fixo não fica condicionado a esse módulo.
