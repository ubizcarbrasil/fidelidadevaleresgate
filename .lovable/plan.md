

## Plano: Cliente segue o mesmo fluxo de checkout do motorista ao resgatar produto

### Problema
Atualmente, quando o cliente clica em "Ir para oferta" na tela de detalhe do deal (`AchadinhoDealDetail`), ele é redirecionado para um link externo. Para deals resgatáveis com pontos, o cliente deveria seguir o mesmo fluxo do motorista: abrir o checkout com formulário de entrega e enviar o pedido para o painel admin.

### Solução
Modificar o `AchadinhoDealDetail` para detectar deals resgatáveis e, em vez de abrir link externo, acionar o `CustomerRedeemCheckout`.

### Mudanças

**Arquivo 1**: `src/components/customer/AchadinhoDealDetail.tsx`

1. Adicionar props opcionais: `is_redeemable`, `redeem_points_cost` na interface `AffiliateDeal`
2. Adicionar estado `showCheckout` para controlar a exibição do checkout
3. Modificar `handleGoToOffer`: se o deal for resgatável (`is_redeemable && redeem_points_cost > 0`), abrir o `CustomerRedeemCheckout` em vez de `window.open`
4. Alterar o label do CTA: para deals resgatáveis, mostrar "Resgatar com Pontos" com o custo em pontos, em vez do CTA genérico
5. Renderizar `CustomerRedeemCheckout` quando `showCheckout = true`

**Arquivo 2**: `src/components/customer/AchadinhoSection.tsx`
- Garantir que `is_redeemable` e `redeem_points_cost` estão no `selectedDeal` passado ao `AchadinhoDealDetail` (já estão na query, apenas confirmar que a interface aceita)

**Arquivo 3**: `src/components/customer/AchadinhoCategoryPage.tsx`
- Mesma verificação: garantir que os campos resgatáveis são passados ao deal detail

### Fluxo resultante
1. Cliente abre detalhe do deal
2. Se deal NÃO é resgatável → comportamento atual (abre link externo)
3. Se deal É resgatável → botão mostra "Resgatar — X pts" → clica → abre `CustomerRedeemCheckout` → preenche dados → pedido vai para o painel admin da cidade e empreendedor

### Detalhes técnicos
- Nenhuma migração SQL necessária
- O `CustomerRedeemCheckout` já existe e funciona com `order_source: "customer"`
- A query de deals já traz `is_redeemable` e `redeem_points_cost`

