
Objetivo: corrigir de forma definitiva as permissões por cidade no app do motorista para que:
- WhatsApp suma em todas as telas quando desativado
- “Compre com Pontos” exiba os produtos resgatáveis mesmo com Achadinhos desligado

Diagnóstico
- O toggle do WhatsApp já foi aplicado na Home (`DriverHomePage`), mas o app também renderiza o botão no `DriverMarketplace`, onde hoje ele usa apenas `brand_settings_json` e ignora a configuração da cidade.
- A separação Achadinhos vs Compre com Pontos foi feita na Home, mas o `DriverMarketplace` ainda continua acoplado ao `achadinhosEnabled`:
  - a query de deals é abortada quando Achadinhos está desligado
  - a seção “Resgatar com Pontos” só aparece se `achadinhosEnabled`
  - o overlay da loja de resgate existe, mas a vitrine que leva até ele não aparece

O que vou ajustar
1. Centralizar as flags finais no `DriverPanelPage`
- Resolver explicitamente:
  - `whatsappEnabled`
  - `achadinhosEnabled`
  - `marketplaceEnabled`
- Derivar um `whatsappNumber` final já filtrado pela cidade e repassar isso aos filhos.
- Passar `marketplaceEnabled` também para `DriverMarketplace`.

2. Corrigir WhatsApp em todo o app do motorista
- `DriverMarketplace.tsx`
  - parar de ler WhatsApp direto de `brand_settings_json`
  - receber `whatsappNumber` por prop
  - ocultar:
    - ícone do cabeçalho
    - banner/CTA de WhatsApp
    - link dentro de `DriverProgramInfo`, passando o número já filtrado
- `DriverPanelPage.tsx`
  - passar o `whatsappNumber` controlado por cidade tanto para `DriverHomePage` quanto para `DriverMarketplace` e `DriverProgramInfo`

3. Desacoplar “Compre com Pontos” do Achadinhos também no marketplace
- `DriverMarketplace.tsx`
  - adicionar prop `marketplaceEnabled`
  - mudar a query para carregar deals se pelo menos um estiver ativo:
    - Achadinhos OU Compre com Pontos
  - manter busca/categorias/banners dependentes de `achadinhosEnabled`
  - exibir “Resgatar com Pontos” com base em `marketplaceEnabled && redeemableDeals.length > 0`
  - manter “Novas Ofertas”, categorias e busca apenas para Achadinhos
- Assim, mesmo sem Achadinhos, os itens homologados com `is_redeemable = true` continuarão aparecendo para troca com pontos.

4. Evitar tela “vazia” quando só Compre com Pontos estiver ativo
- Ajustar o estado visual do `DriverMarketplace` para não depender do ecossistema Achadinhos.
- Quando:
  - `achadinhosEnabled = false`
  - `marketplaceEnabled = true`
- a tela deve continuar mostrando a seção de resgate e o acesso à loja de resgate, sem ficar em branco.

Arquivos que serão alterados
- `src/pages/DriverPanelPage.tsx`
- `src/components/driver/DriverMarketplace.tsx`
- possivelmente `src/components/driver/DriverProgramInfo.tsx` apenas para garantir o recebimento do número já filtrado, sem lógica própria adicional

Resultado esperado
```text
WhatsApp desligado na cidade
→ some da Home
→ some do Marketplace
→ some do CTA/banner e links relacionados

Achadinhos desligado + Compre com Pontos ligado
→ motorista não vê categorias/busca/ofertas de Achadinhos
→ motorista vê os produtos resgatáveis homologados
→ seção “Resgatar com Pontos” continua disponível
→ loja de resgate abre normalmente
```

Detalhe técnico
Hoje a Home já está quase correta, mas o Marketplace ainda usa regras antigas. A correção principal é aplicar a mesma separação lógica nas duas experiências do motorista:
- Achadinhos = vitrine afiliada, busca, categorias, banners
- Compre com Pontos = produtos resgatáveis (`affiliate_deals.is_redeemable = true`)

Validação após implementação
- Cidade com WhatsApp desligado: conferir Home, Marketplace e tela de informações
- Cidade com Achadinhos desligado e Compre com Pontos ligado: conferir se aparecem os produtos resgatáveis
- Cidade com ambos desligados: confirmar que nada de ofertas/resgate aparece
- Cidade com ambos ligados: confirmar convivência normal dos dois blocos
