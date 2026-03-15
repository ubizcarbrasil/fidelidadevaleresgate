

## Plano: Corrigir clique do banner carrossel no app do cliente

### Problema
O `BannerCarousel` em `HomeSectionsRenderer.tsx` não trata corretamente os diferentes `link_type` dos banners. Para links internos (`/p/vitrine-teste`), ele faz `window.location.href = url`, o que navega a página inteira para fora do contexto do app do cliente (que roda dentro de `/customer-preview`).

Os banners no banco possuem `link_type` como `"internal"`, `"external"`, `"webview"`, `"offer"`, `"store"`, `"category"`, `"custom_page"`, ou `"NONE"`.

### Solução

**`src/components/HomeSectionsRenderer.tsx`** — Refatorar `BannerCarousel`:

1. Importar `useCustomerNav` para acessar `openOffer`, `openStore`, `navigateToTab`
2. Refatorar `handleBannerClick` para tratar cada `link_type`:
   - `"NONE"` / sem url → ignorar (já funciona)
   - `"external"` → `window.open(url, "_blank")` (já funciona)
   - `"internal"` → Se for `/p/slug`, usar `window.location.href` mas adicionando o contexto do customer-preview. Alternativamente, abrir como webview dentro do app
   - `"webview"` → Navegar para `/webview?url=...` via SPA
   - `"offer"` → Buscar oferta pelo `link_target_id` e chamar `openOffer`
   - `"store"` → Buscar store pelo `link_target_id` e chamar `openStore`
   - `"category"` → Navegar para a aba de ofertas com filtro de categoria
   - `"custom_page"` → Navegar para `/p/slug` internamente

3. Para rotas internas (`/p/` paths), a forma mais simples e consistente é usar o sistema de webview do app (que já existe como overlay em `CustomerLayout`), tratando-as como webview interna com o path relativo.

### Arquivos alterados
1. `src/components/HomeSectionsRenderer.tsx` — Refatorar `handleBannerClick` no `BannerCarousel`

