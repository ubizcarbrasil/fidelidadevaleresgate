

# Página Admin de Produtos de Resgate

## Visão Geral

Criar uma página dedicada que lista apenas os achadinhos marcados como resgatáveis (`is_redeemable = true`), permitindo ao admin ativar/desativar o modo resgate e editar o custo em pontos em massa, sem precisar abrir cada deal individualmente na página de Achadinhos.

## Arquitetura

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| **Criar** | `src/pages/ProdutosResgatePage.tsx` | Página principal com listagem, filtros, seleção em massa e edição inline |
| **Editar** | `src/components/consoles/BrandSidebar.tsx` | Adicionar item "Produtos de Resgate" no grupo Achadinhos |
| **Editar** | `src/App.tsx` | Adicionar rota `/produtos-resgate` |

## Funcionalidades da Página

1. **Listagem filtrada**: Query em `affiliate_deals` com `is_redeemable = true` + filtro por brand_id via `useBrandGuard`
2. **Busca por título**: Input de pesquisa com debounce
3. **Tabela com colunas**: Imagem, Título, Preço Original, Custo em Pontos, Status (ativo/inativo), Ações
4. **Edição inline do custo em pontos**: Campo editável diretamente na tabela
5. **Seleção em massa**: Checkboxes para selecionar múltiplos itens
6. **Ações em massa**:
   - Desativar resgate (set `is_redeemable = false`)
   - Alterar custo em pontos para todos os selecionados
7. **Toggle individual**: Switch para ativar/desativar `is_redeemable` por item
8. **KPIs no topo**: Total de produtos resgatáveis, total ativos, faixa de preço em pontos

## Detalhes Técnicos

- Usa `useBrandGuard` para scoping de marca
- Query com `useQuery` filtrando `is_redeemable = true` e `brand_id`
- Mutations com `useMutation` para updates individuais e batch
- Segue padrão visual dark mode existente
- Componentes do shadcn: Table, Switch, Input, Badge, Button, Card
- Sem migração de banco — usa campos existentes (`is_redeemable`, `redeem_points_cost`)

