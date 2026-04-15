
Diagnóstico mais preciso:

A configuração no backend está correta para a marca das imagens:
- Marca `Meu Mototaxi` (`f6ca82ea-621c-4e97-8c20-326fc63a8fd0`)
- `affiliate_deals = false`
- `driver_hub = false`
- Cidade `Ipatinga - MG`
- `enable_achadinhos_module = false`
- `enable_marketplace_module = false`

Ou seja: o problema não é mais toggle nem banco. O problema é front ainda expondo partes do ecossistema do motorista por caminhos paralelos.

O que encontrei no código:

1. `src/pages/DriverPanelPage.tsx`
- Já consulta `public_brand_modules_safe`
- Já combina:
  `achadinhosEnabled = affiliate_deals && enable_achadinhos_module`
- Portanto esta parte principal está certa

2. `src/components/driver/home/DriverHomePage.tsx`
- Ainda faz query de `affiliate_deals` mesmo quando `achadinhosEnabled` está falso
- O default do prop ainda está permissivo: `achadinhosEnabled = true`
- Isso abre margem para renderização residual e inconsistência

3. `src/components/driver/DriverCategoryPage.tsx`
- Busca ofertas direto de `affiliate_deals`
- Não recebe flag de bloqueio
- Se for aberto por deep link/estado antigo, continua mostrando Achadinhos

4. `src/components/driver/DriverRedeemStorePage.tsx`
- Busca produtos resgatáveis direto de `affiliate_deals`
- Não respeita `enable_marketplace_module`
- Então “Resgatar com Pontos” pode seguir aparecendo mesmo com cidade e marca desligadas

5. `src/components/customer/AchadinhoDealDetail.tsx`
- Também busca “ofertas semelhantes” direto
- Não tem bloqueio para módulo desligado
- Se um item já foi aberto/cacheado, a tela continua funcional

6. `src/components/dashboard/DashboardQuickLinks.tsx`
- O card “Achadinho Motorista” do painel administrativo depende só de `isDriverEnabled`
- `isDriverEnabled` vem do `scoring_model`, não dos módulos
- Por isso o link útil “Achadinho Motorista” continua aparecendo no painel, mesmo com módulos desligados
- Isso bate com sua imagem destacando esse card

Conclusão objetiva:
há pelo menos 2 problemas diferentes ao mesmo tempo:

```text
A) Link administrativo continua exibindo "Achadinho Motorista"
   porque ele usa scoring model e não módulos

B) Fluxos internos do app do motorista ainda têm telas/queries sem guarda central
   (home, categoria, detalhe, loja de resgate)
```

Plano de correção:

1. Criar uma regra única de visibilidade do ecossistema do motorista
- Centralizar a regra final:
  - `driverHubEnabled`
  - `affiliateDealsEnabled`
  - `branchAchadinhosEnabled`
  - `branchMarketplaceEnabled`
- Separar claramente:
  - Achadinhos afiliado
  - Loja de resgate / marketplace de resgate
  - Hub do motorista

2. Endurecer os componentes do app do motorista
- `DriverHomePage.tsx`
  - remover default permissivo
  - desabilitar query quando Achadinhos estiver falso
- `DriverCategoryPage.tsx`
  - receber flag explícita
  - bloquear abertura/renderização se módulo estiver desligado
- `DriverRedeemStorePage.tsx`
  - receber flag explícita do marketplace
  - não consultar/renderizar produtos se `enable_marketplace_module = false`
- `AchadinhoDealDetail.tsx`
  - bloquear ofertas semelhantes e CTA quando vier de módulo desligado

3. Blindar o roteamento do `DriverPanelPage`
- impedir overlays de categoria, detalhe e loja de resgate quando o módulo correspondente estiver desligado
- limpar qualquer estado residual/deep link inválido
- se houver `dealId`/`categoryId` e o módulo estiver desligado, ignorar esses parâmetros

4. Corrigir o painel administrativo
- `DashboardQuickLinks.tsx`
  - o card “Achadinho Motorista” deve depender também dos módulos reais da marca/cidade, não só do scoring model
- assim o botão “Abrir” some do painel quando a feature estiver desativada

5. Revisar defaults inseguros
- trocar defaults como `= true` por comportamento fail-safe
- enquanto módulo/configuração não carregaram, a UI deve assumir oculto
- isso evita reaparecimento por loading ou cache de estado

6. Validar o cenário exato das imagens
Depois da implementação, o comportamento esperado será:

```text
affiliate_deals = false
enable_achadinhos_module = false
=> some:
- banner amarelo
- “Novas Ofertas”
- categorias de achadinhos
- detalhes da oferta afiliada
- card “Achadinho Motorista” nos links úteis

enable_marketplace_module = false
=> some:
- Loja de Resgate
- “Resgatar com Pontos”
- fluxo de produto resgatável
```

Detalhe técnico importante:
o que está vazando hoje não é um único toggle “com defeito”, e sim múltiplos componentes consultando `affiliate_deals` por conta própria, sem uma guarda central compartilhada. A correção ideal é unificar essas regras num hook/serviço de visibilidade do painel do motorista e fazer todos os componentes consumirem a mesma fonte de verdade.

Arquivos que precisam ser ajustados:
- `src/pages/DriverPanelPage.tsx`
- `src/components/driver/home/DriverHomePage.tsx`
- `src/components/driver/DriverCategoryPage.tsx`
- `src/components/driver/DriverRedeemStorePage.tsx`
- `src/components/customer/AchadinhoDealDetail.tsx`
- `src/components/dashboard/DashboardQuickLinks.tsx`
- opcionalmente um novo hook compartilhado para regra central de visibilidade

