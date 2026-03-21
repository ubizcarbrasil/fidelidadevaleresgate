

## Plano: Página de Detalhe do Achadinho (Intersticial antes do Marketplace)

### O que será criado

Uma página/overlay full-screen que aparece ao clicar em qualquer card de Achadinho (tanto no app do cliente quanto do motorista). Em vez de ir direto para o link, o usuário vê os detalhes do produto antes de sair. Visual inspirado no print de referência.

### Layout da página

```text
┌──────────────────────────────────┐
│  ←                          🔗   │  Header
├──────────────────────────────────┤
│ ██████ BANNER DE FUNDO ████████ │  Banner decorativo
│ ███████████████████████████████ │
│     ┌──────────────────┐        │
│     │                  │        │
│     │   FOTO PRODUTO   │        │  Imagem centralizada
│     │                  │        │  sobre o banner
│     └──────────────────┘        │
├──────────────────────────────────┤
│  Celular Samsung Galaxy S26+... │  Título
│         R$ 7.037,23              │  Preço bold
│    era R$ 9.000,00 • Shopee     │  Preço original + loja
├──────────────────────────────────┤
│  ┌──────────────────────────┐   │
│  │  IR PARA OFERTA          │   │  Botão CTA configurável
│  └──────────────────────────┘   │  (cor + texto via admin)
├──────────────────────────────────┤
│  Ofertas semelhantes             │
│ ┌────────┐ Shopee               │
│ │  IMG   │ Smartphone Realme... │  Lista horizontal
│ │        │ R$ 839,00  R$1.999   │  (mesma categoria)
│ └────────┘                      │
│ ┌────────┐ Amazon               │
│ │  IMG   │ Moto Razr 60...     │
│ └────────┘                      │
└──────────────────────────────────┘
```

### Implementação

**1. Novo componente `src/components/customer/AchadinhoDealDetail.tsx`**
- Overlay full-screen (z-index acima da categoria)
- Recebe `deal` (AffiliateDeal), `onBack`, `brandId`, `branchId`
- Banner de fundo: usa gradiente ou imagem configurável em `brand_settings_json.achadinho_detail_banner_url` (fallback: gradiente suave com cor primária)
- Imagem do produto centralizada sobre o banner com rounded-2xl e sombra
- Título, preço formatado, preço original riscado, nome do marketplace
- SEM cashback, SEM cupom
- Botão CTA: cor e texto lidos de `brand_settings_json.achadinho_cta` (`{ bg_color, text_color, label }`). Default: fundo laranja (#F97316), texto branco, label "Ir para oferta"
- Ao clicar CTA: registra click em `affiliate_clicks` + abre `affiliate_url`
- Seção "Ofertas semelhantes": query `affiliate_deals` na mesma `category_id`, excluindo o deal atual, limite 20. Cards horizontais (imagem 100px + info) igual à AchadinhoCategoryPage

**2. Integrar nos pontos de clique existentes**

- `src/components/customer/AchadinhoSection.tsx`: `handleClick` → em vez de `window.open`, abrir o `AchadinhoDealDetail`
- `src/components/customer/AchadinhoCategoryPage.tsx`: `handleClick` → mesmo
- `src/components/driver/DriverMarketplace.tsx`: clique nos cards → abre versão driver do detail
- `src/components/driver/DriverCategoryPage.tsx`: clique nos cards → mesmo

**3. Config no admin**

- `src/pages/AffiliateCategoriesPage.tsx` ou `BrandSettingsPage`: adicionar seção "Botão CTA dos Achadinhos" com:
  - Input de texto (label do botão)
  - Color picker para cor de fundo
  - Color picker para cor do texto
  - Salva em `brand_settings_json.achadinho_cta`

### Arquivos
- `src/components/customer/AchadinhoDealDetail.tsx` — novo
- `src/components/customer/AchadinhoSection.tsx` — alterar handleClick
- `src/components/customer/AchadinhoCategoryPage.tsx` — alterar handleClick
- `src/components/driver/DriverMarketplace.tsx` — alterar clique dos cards
- `src/components/driver/DriverCategoryPage.tsx` — alterar clique dos cards
- `src/pages/AffiliateCategoriesPage.tsx` — config do CTA

