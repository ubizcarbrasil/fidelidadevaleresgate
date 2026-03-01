

## Problemas Identificados

### 1. Botão "Resgatar agora" não aparece
O botão está condicionado a `customer && !redeemed` (linha 321). No modo preview sem login, `customer` é `null`, então o CTA nunca renderiza. **Solução**: mostrar o botão sempre, mas ao clicar sem estar logado, exibir um toast pedindo login.

### 2. Ofertas semelhantes não são clicáveis
O `onClick` das ofertas semelhantes está vazio (linha 293: `/* would need parent nav */`). **Solução**: adicionar uma prop `onOfferClick` ao componente e conectá-la ao `openOffer` do `CustomerNavContext` no `CustomerLayout`.

## Alterações

### `CustomerOfferDetailPage.tsx`
- Adicionar prop `onOfferClick?: (offer: OfferWithStore) => void` à interface `Props`
- No click das ofertas semelhantes, chamar `onOfferClick(sim)` em vez do handler vazio
- Remover a condição `customer &&` do CTA — sempre exibir o botão
- No `handleRedeem` e no `onClick` do CTA, se `customer` for null, exibir toast "Faça login para resgatar" e retornar

### `CustomerLayout.tsx`
- Passar `onOfferClick` ao `CustomerOfferDetailPage`, conectando ao `setSelectedOffer` (fechar oferta atual, abrir a nova com pequeno delay para animação)

