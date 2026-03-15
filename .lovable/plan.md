

## Plano: Banners aparecem mesmo sem seção BANNER_CAROUSEL configurada

### Problema raiz
O fluxo atual exige que o administrador crie **duas coisas** para banners funcionarem:
1. Uma `brand_section` do tipo `BANNER_CAROUSEL` (no Construtor de Páginas)
2. Os registros de `banner_schedules` (na Central de Banners)

A marca `db15bd21...` (do screenshot do admin) tem banners cadastrados na Central de Banners, mas **não tem** uma seção `BANNER_CAROUSEL` no construtor de páginas. Por isso, o `HomeSectionsRenderer` com `renderBannersOnly` não encontra nenhuma seção e retorna `null`.

### Solução
Modificar o componente nativo **BANNERS** em `CustomerHomePage.tsx` para buscar `banner_schedules` diretamente quando `HomeSectionsRenderer` não encontrar seções `BANNER_CAROUSEL`. Isso elimina a dependência de configuração dupla.

### Alterações

**1. `src/pages/customer/CustomerHomePage.tsx`** — No `renderNativeSection`, case `"BANNERS"`:
- Criar um novo componente `StandaloneBannerCarousel` que busca `banner_schedules` diretamente pelo `brand_id`, sem depender de `brand_sections`
- Renderizar `HomeSectionsRenderer renderBannersOnly` normalmente, e em paralelo/fallback renderizar o carrossel standalone para banners globais (sem `brand_section_id`)

**2. `src/components/HomeSectionsRenderer.tsx`** — Alternativa mais limpa:
- Quando `renderBannersOnly=true` e não existem seções BANNER_CAROUSEL, fazer query direta a `banner_schedules` onde `brand_id = brand.id` e `is_active = true` e `start_at <= now` e filtrar expirados
- Renderizar o `BannerCarousel` existente com esses itens

A segunda abordagem é preferível pois mantém toda a lógica de banners centralizada no `HomeSectionsRenderer`.

### Arquivo alterado
1. `src/components/HomeSectionsRenderer.tsx` — adicionar fallback de banners diretos quando não existem seções BANNER_CAROUSEL

