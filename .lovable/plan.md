
Correção completa do que você pediu

Diagnóstico rápido:
- Você está certo: o comportamento ficou inconsistente.
- Parte do fluxo já foi alterada em alguns componentes, mas não em todos os pontos de entrada. Por isso, na prática, você não viu o resultado “em todo o app”.
- Também confirmei que o botão “Meus Resgates” existe no código em mais de um lugar, mas a entrada do motorista continua fragmentada.
- A verificação por código hoje está no passo final do checkout, porém o código ainda está sendo exibido em toast local, o que está errado para esse fluxo.

O que vou ajustar

1. Garantir CTA duplo em todas as ofertas do Achadinho
- Padronizar o detalhe da oferta para sempre mostrar:
  - Comprar com pontos — X pts
  - Comprar — R$ XX,XX
- O botão de pontos continuará abrindo o checkout atual de resgate.
- O botão de compra abrirá a oferta externa e sairá da página, como você pediu.

2. Corrigir as origens que ainda não carregam os dados de resgate
Hoje o CTA duplo não aparece em todos os casos porque alguns fluxos ainda buscam a oferta sem:
- is_redeemable
- redeem_points_cost

Vou alinhar isso nos pontos que ainda estão incompletos, principalmente:
- `src/components/driver/DriverCategoryPage.tsx`
- fluxos derivados que reutilizam o mesmo detalhe

3. Manter a verificação por código apenas na última ação do resgate com pontos
- O formulário de entrega continua primeiro.
- Só ao confirmar o resgate com pontos o app abre a etapa de verificação.
- Somente após código válido o resgate é concluído.
- Vou remover o comportamento atual de exibir o código em toast/localmente, porque isso quebra o fluxo real.

4. Ajustar o checkout de pontos para ficar coerente com a regra
Arquivo principal:
- `src/components/customer/CustomerRedeemCheckout.tsx`

Ajustes:
- manter OTP somente no fluxo “comprar com pontos”
- OTP como último passo antes do RPC de conclusão
- remover exposição do código na interface
- revisar botão “reenviar código”
- garantir que o botão “Comprar” normal nunca passe por OTP

5. Deixar “Meus Resgates” visível e acessível no app do motorista
Vou consolidar o acesso ao histórico do motorista para não depender de uma tela específica.

Arquivos envolvidos:
- `src/components/driver/DriverMarketplace.tsx`
- `src/components/driver/home/DriverHomePage.tsx`
- `src/components/driver/home/QuickActionCards.tsx`
- `src/pages/DriverPanelPage.tsx`
- `src/components/driver/DriverCityRedemptionHistory.tsx`

Resultado esperado:
- motorista vê “Meus Resgates”
- toca no botão
- abre a lista/histórico corretamente
- tudo fica registrado ali

Arquivos que precisam de ajuste
- `src/components/customer/AchadinhoDealDetail.tsx`
- `src/components/customer/CustomerRedeemCheckout.tsx`
- `src/components/driver/DriverCategoryPage.tsx`
- `src/components/driver/DriverMarketplace.tsx`
- `src/components/driver/home/DriverHomePage.tsx`
- `src/components/driver/home/QuickActionCards.tsx`
- `src/pages/DriverPanelPage.tsx`

Resultado final após implementação
- Todas as ofertas resgatáveis terão dois botões
- “Comprar com pontos” vai para o checkout atual
- “Comprar” vai para a oferta externa
- OTP só aparece no último passo do resgate com pontos
- “Meus Resgates” ficará acessível no app do motorista e registrará tudo por lá

Detalhe técnico importante
- O componente `AchadinhoDealDetail.tsx` já está preparado para CTA duplo, mas isso não funciona em toda a aplicação porque alguns loaders ainda não trazem os campos de resgate.
- O maior conserto é padronizar os dados carregados e fechar os pontos de entrada quebrados.
- Não parece exigir mudança de banco para o CTA duplo; o foco é correção de frontend e do fluxo de verificação.
