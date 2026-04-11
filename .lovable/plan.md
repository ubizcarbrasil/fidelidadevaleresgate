
## Plano: Configuração de linhas de "Resgatar com Pontos" para o cliente

### Contexto
O motorista já tem essa configuração em `DriverPanelConfigPage` via `driver_redeem_rows` no `brand_settings_json`. O cliente precisa do equivalente (`customer_redeem_rows`), configurável na página de Produtos de Resgate.

### Mudanças

**Arquivo 1**: `src/pages/ProdutosResgatePage.tsx`
- Ler `customer_redeem_rows` do `brandSettings` (já existe a query)
- Adicionar controle de +/- linhas (1 a 5) ao lado do toggle de espelhamento
- Salvar no `brand_settings_json` usando a mesma lógica da `toggleMirrorMutation` (fetch → merge → update)

**Arquivo 2**: `src/components/customer/AchadinhoSection.tsx`
- Buscar `customer_redeem_rows` do `brand_settings_json` (a query de brand já existe no contexto)
- Na linha 436, onde calcula `configuredRows` para a categoria `__redeemable__`, usar `customer_redeem_rows` em vez do default `1`

### Detalhes técnicos
- Nenhuma migração SQL necessária — o valor é armazenado em JSON (`brand_settings_json`)
- Chave: `customer_redeem_rows` (número entre 1 e 5, default 1)
- UI do controle: stepper com botões `-` e `+`, idêntico ao do DriverPanelConfigPage
