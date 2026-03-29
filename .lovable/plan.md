

# Correção: Link "Ir para Achadinhos" aponta para rota inexistente

## Problema
O botão "Ir para Achadinhos" no estado vazio da página Produtos de Resgate aponta para `/achadinhos`, mas a rota real é `/affiliate-deals`. Isso causa o erro 404.

## Correção

### `src/pages/ProdutosResgatePage.tsx`
- Alterar o `Link to="/achadinhos"` para `Link to="/affiliate-deals"` no estado vazio (linha do botão "Ir para Achadinhos").

Correção de uma linha apenas.

