
Objetivo: fazer com que os resgates de produtos feitos pelo cliente apareçam corretamente em “Meus Resgates”.

Diagnóstico
- O checkout do cliente grava o pedido em `product_redemption_orders` com `order_source = 'customer'` (`src/components/customer/CustomerRedeemCheckout.tsx`).
- A tela mostrada no print (`src/pages/customer/CustomerRedemptionsPage.tsx`) busca apenas a tabela `redemptions`.
- Já existe um histórico específico para pedidos de produto em `src/components/customer/CustomerRedeemOrderHistory.tsx`, mas ele está “solto”: foi importado no `CustomerLayout` e nunca é renderizado/aberto.
- No `CustomerLayout` existem estados `redeemStoreOpen` e `redeemHistoryOpen`, mas eles não estão conectados a nada.

Problema real
O resgate do cliente está sendo salvo no lugar certo para produto, mas a aba “Meus Resgates” não consulta esse lugar. Por isso o usuário resgata com sucesso e a lista continua vazia.

Plano de correção
1. Atualizar a experiência da aba `Meus Resgates`
- Ajustar `src/pages/customer/CustomerRedemptionsPage.tsx` para exibir também os resgates de produto do cliente, além dos resgates da tabela `redemptions`.
- Manter a lista atual de cupons/PINs e acrescentar os pedidos de produto no mesmo fluxo visual.

2. Reaproveitar o histórico já existente
- Usar a lógica de `src/components/customer/CustomerRedeemOrderHistory.tsx` como base de consulta/shape dos pedidos.
- Evitar duplicação: extrair a busca/normalização para um hook ou serviço compartilhado da feature de resgates do cliente.

3. Padronizar a exibição
- Mapear os pedidos de `product_redemption_orders` para um formato compatível com a aba de resgates.
- Exibir status como `PENDING`, `APPROVED`, `SHIPPED`, `DELIVERED` e `REJECTED` com labels em português.
- Diferenciar visualmente “cupom/QR” e “produto” para o usuário entender o tipo de resgate.

4. Atualizar a tela após concluir o checkout
- No sucesso de `CustomerRedeemCheckout`, invalidar as queries da aba de resgates do cliente para o novo pedido aparecer sem depender de recarregar manualmente.
- Garantir também refresh do saldo, como já existe hoje.

5. Limpeza de código órfão
- Remover ou conectar corretamente o fluxo hoje incompleto em `CustomerLayout` (`redeemHistoryOpen`, import lazy do `CustomerRedeemOrderHistory`), para não manter código morto.
- Se a decisão for unificar tudo na aba principal, o overlay separado deixa de ser necessário.

Arquivos envolvidos
- `src/pages/customer/CustomerRedemptionsPage.tsx`
- `src/components/customer/CustomerRedeemCheckout.tsx`
- `src/components/customer/CustomerRedeemOrderHistory.tsx`
- `src/components/customer/CustomerLayout.tsx`
- possivelmente um novo hook/serviço da feature para centralizar a leitura dos dois tipos de resgate

Detalhes técnicos
- Não parece ser problema de banco nem de política de acesso; o problema é de integração entre frontend e as tabelas corretas.
- `product_redemption_orders` já possui política de SELECT para o próprio cliente.
- Nenhuma migração SQL é necessária para esta correção.
- A melhor abordagem é consolidar os dois fluxos na experiência “Meus Resgates”, em vez de manter um histórico de produtos escondido e inacessível.
