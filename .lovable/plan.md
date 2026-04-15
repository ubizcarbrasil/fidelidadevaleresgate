

## Diagnóstico

Após investigar todo o código, **tudo já está implementado corretamente**:

### No painel do empreendedor (sidebar)
- "Venda de Pontos" está registrado no menu (`sidebar.compra_pontos_motorista`) dentro do grupo "Gestão Comercial"
- A rota `/driver-points-purchase` está configurada no `App.tsx`
- A página `pagina_compra_pontos_config.tsx` tem: configuração do preço do milheiro, mínimo/máximo, toggle ativar/desativar, e lista de pedidos com botões Confirmar/Cancelar

### No app do motorista
- O botão "Comprar Pontos" está no `QuickActionCards.tsx`
- O overlay de compra (`DriverBuyPointsOverlay.tsx`) está integrado no `DriverPanelPage.tsx`
- O botão só aparece quando a flag `enable_driver_points_purchase` está ativa na cidade

### Na configuração da cidade
- O toggle "Motorista compra pontos?" já existe em `constantes_toggles.ts` com a key `enable_driver_points_purchase`

## Por que você não está vendo

Você está acessando `app.valeresgate.com.br` (URL de produção). As mudanças existem apenas no **Preview** — ainda não foram publicadas.

Além disso, para o botão aparecer no app do motorista, é necessário:
1. Ativar o toggle "Motorista compra pontos?" na configuração da cidade
2. Configurar o preço do milheiro na página "Venda de Pontos" do admin

## Plano

Não há código novo a implementar — tudo já está pronto. O que precisa ser feito:

1. **Publicar o app** para que as mudanças cheguem à URL de produção
2. **Ativar o toggle** "Motorista compra pontos?" na configuração da cidade desejada
3. **Configurar o preço** do milheiro na página "Venda de Pontos" do sidebar

Se após publicar e ativar o toggle você ainda não encontrar o item "Venda de Pontos" no sidebar, pode ser que o filtro de scoring model esteja escondendo — nesse caso precisaria ajustar o `scoringFilter` do item no menu registry. Confirme se quer que eu remova essa restrição para que o item apareça sempre.

