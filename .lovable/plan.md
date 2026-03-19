

## Plano: Exibir banner da loja no detalhe da oferta

### Problema
A área "hero" no topo da página de detalhe da oferta mostra apenas a **logo** da loja como imagem de fundo. O campo `banner_url` da loja não é buscado nem exibido, resultando em uma área vazia quando a oferta não tem `image_url` próprio.

### Causa raiz
- O tipo `OfferWithStore` define `stores` como `{ name: string; logo_url: string | null }` — sem `banner_url`
- Todas as queries que buscam ofertas usam `.select("*, stores(name, logo_url)")`, ignorando o banner
- O hero da oferta tipo STORE (linha 524) usa `offer.image_url` como imagem principal, com fallback para `logo_url`, mas nunca exibe o `banner_url` da loja como fundo

### Solução

**Arquivo:** `src/pages/customer/CustomerOfferDetailPage.tsx`

1. Atualizar o tipo `OfferWithStore` para incluir `banner_url`:
   ```typescript
   stores?: { name: string; logo_url: string | null; banner_url?: string | null } | null;
   ```

2. Atualizar a query de ofertas similares (linha 69) para incluir `banner_url`:
   ```typescript
   .select("*, stores(name, logo_url, banner_url)")
   ```

3. No hero da oferta tipo **STORE** (não-PRODUCT, linha ~524): usar `offer.stores?.banner_url` como imagem de fundo do hero, com fallback para o comportamento atual (`offer.image_url`)

4. No hero da oferta tipo **PRODUCT** (linha ~311): usar `offer.stores?.banner_url` como imagem de fundo da área superior em vez de apenas a logo centralizada

**Outros arquivos** que alimentam dados para esta página (para garantir que `banner_url` chegue ao componente):
- `src/pages/customer/CustomerOffersPage.tsx` — query principal de ofertas
- `src/components/HomeSectionsRenderer.tsx` — ofertas na Home
- `src/components/customer/ForYouSection.tsx` — seção "Para Você"
- `src/components/customer/CustomerSearchOverlay.tsx` — busca
- `src/components/page-builder-v2/PageRenderer.tsx` — páginas CMS

Todas precisam adicionar `banner_url` ao select de stores.

### Resultado
Quando o lojista configura um banner na loja, ele aparecerá como fundo do hero na página de detalhe da oferta.

