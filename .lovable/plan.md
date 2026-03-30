

# Adicionar botão "Adicionar Produtos" na página Produtos de Resgate

## Problema
A página `/produtos-resgate` só lista produtos já marcados como resgatáveis. Para adicionar novos, o admin precisa navegar até `/affiliate-deals`, o que não é intuitivo.

## Solução
Adicionar um botão "Adicionar Produtos" no header da página que abre um modal/drawer com a lista de produtos **não resgatáveis**, permitindo selecionar e marcar em lote diretamente.

## Alterações

### 1. Criar componente `ModalAdicionarResgatavel.tsx`
**Local:** `src/pages/` (ou componente inline no mesmo arquivo)

- Modal/Dialog com busca por título
- Query: `affiliate_deals` onde `is_redeemable = false` (ou `is_redeemable IS NULL`) e `is_active = true`
- Lista com checkbox, imagem, título, preço e campo de custo em pontos
- Seleção em lote com botão "Marcar como Resgatável"
- Ao confirmar: `UPDATE` os selecionados com `is_redeemable = true` e `redeem_points_cost` informado
- Invalida queries `produtos-resgate` e `produtos-resgate-kpis`

### 2. Atualizar `ProdutosResgatePage.tsx`
- Adicionar botão `+ Adicionar Produtos` ao lado do título
- Estado `modalAberto` para controlar a abertura do modal
- Importar e renderizar o modal

### Comportamento
- O modal lista apenas produtos ativos que **ainda não são** resgatáveis
- Permite buscar por nome
- Permite definir custo em pontos antes de ativar (campo obrigatório)
- Após salvar, o modal fecha e a tabela principal atualiza automaticamente

