

## Diagnóstico: Tudo implementado, falta publicar

Investiguei todo o código e confirmei que **ambas as funcionalidades já estão prontas**:

### No painel do empreendedor
- **"Venda de Pontos"** está no sidebar, grupo "Gestão Comercial", rota `/driver-points-purchase`
- Tem configuração de preço do milheiro, mínimo/máximo, toggle ativar/desativar
- Lista de pedidos com botões Confirmar/Cancelar
- O item só aparece quando o modelo de scoring da marca inclui motoristas (`scoringFilter: "DRIVER"`)

### No app do motorista
- **"Comprar Pontos"** aparece nos QuickActionCards quando `enable_driver_points_purchase === true` no `branch_settings_json`
- Overlay completo com seletor de quantidade, botões rápidos e cálculo automático do valor

### Na configuração da cidade
- Toggle **"Motorista compra pontos?"** já existe em `constantes_toggles.ts`

### Por que você não vê

Você está acessando `app.valeresgate.com.br` (produção). As mudanças estão apenas no **Preview** do Lovable e ainda não foram publicadas.

### O que fazer

1. **Publicar o app** — clique no botão de publicar (ícone no canto superior direito no desktop, ou "..." no canto inferior direito no mobile → "Publish")
2. **Acessar o painel do empreendedor** na URL publicada — o item "Venda de Pontos" estará em "Gestão Comercial"
3. **Configurar o preço do milheiro** na página "Venda de Pontos"
4. **Ativar o toggle** "Motorista compra pontos?" na configuração da cidade
5. O motorista verá o botão "Comprar Pontos" no app

Nenhuma alteração de código é necessária — apenas publicar e configurar.

