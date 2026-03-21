

## Plano: Banner do topo igual ao do passageiro + título editável + busca de produtos

### 1. Banner do topo com mesmo tamanho do passageiro

**Arquivo**: `src/components/driver/DriverBannerCarousel.tsx`
- Trocar `h-36` por `aspect-[21/9]` na imagem — mesmo aspect ratio usado nos banners intercalados e no `BannerManagerPage`

### 2. Título "Marketplace" editável

**Arquivo**: `src/components/driver/DriverMarketplace.tsx`
- Ler `settings.driver_marketplace_title` do `brand_settings_json` (fallback: "Marketplace")
- Ler `settings.driver_marketplace_subtitle` (fallback: "Ofertas exclusivas para motoristas parceiros")

**Arquivo**: `src/pages/DriverPanelConfigPage.tsx`
- Adicionar campos de texto "Título do Marketplace" e "Subtítulo" na seção de configuração geral
- Salvar em `brand_settings_json.driver_marketplace_title` e `driver_marketplace_subtitle`

### 3. Barra de busca por produtos

**Arquivo**: `src/components/driver/DriverMarketplace.tsx`
- Adicionar input de busca com ícone de lupa no header (abaixo do título, estilo similar ao app do cliente)
- Estado `searchTerm` com debounce
- Quando ativo, filtrar `allDeals` pelo título/descrição e mostrar resultados em grid, ocultando as seções normais
- Quando vazio, volta ao layout normal de categorias

### Arquivos envolvidos
- **Editar**: `src/components/driver/DriverBannerCarousel.tsx` — aspect ratio
- **Editar**: `src/components/driver/DriverMarketplace.tsx` — título dinâmico + busca
- **Editar**: `src/pages/DriverPanelConfigPage.tsx` — campos de título/subtítulo

