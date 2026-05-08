# Correção definitiva de `/ofertas` em WebViews / in-app browsers

## Diagnóstico real (por que as tentativas anteriores falharam)

As tentativas anteriores (denylist no SW, brandId imediato pelo hostname) atacavam sintomas. Os problemas reais são dois, e nenhum dos dois é o resolver de marca:

### Problema 1 — "demora uma eternidade para abrir"
A rota `/ofertas` carrega o **bundle inteiro do SPA admin**: `AuthProvider` chama `supabase.auth.getSession()`, `BrandProvider` resolve domínio, `queryClient` inicializa, Sentry/web-vitals carregam, e toda a árvore do `App.tsx` precisa montar antes do `__dismissBootstrap()` esconder o overlay azul "Carregando aplicativo…".

Em WebViews de Instagram/Facebook/iOS Smart App Banner, `getSession()` frequentemente trava por 5–15s porque cookies de terceiros e storage estão restringidos. Como a vitrine `/ofertas` é **100% pública** (não usa auth nem brand context), essa espera é totalmente desnecessária.

### Problema 2 — "volto, fica tudo branco e não abre mais"
Esse é o bug clássico de **bfcache (back-forward cache) em in-app browsers iOS**. Quando o usuário toca em "Voltar" (seta `<`) do WebView do Instagram/iOS, a página é restaurada do bfcache em estado congelado: o React não re-monta, mas o Service Worker já invalidou os chunks antigos (cacheId `v10`). O resultado é DOM vazio + JS morto = tela branca permanente.

A `navigateFallbackDenylist` não resolve isso porque o problema acontece **depois** que a página já carregou — é o pageshow restoration que falha.

---

## Solução

### 1. Detecção precoce de rota pública pulando providers pesados
Em `src/App.tsx`, antes de montar `AuthProvider`/`BrandProvider`, detectar `window.location.pathname === "/ofertas"` e renderizar uma árvore enxuta direto (`QueryClientProvider` + `BrowserRouter` + `<PaginaUbizOfertas />`), sem Auth, sem Brand, sem Sentry warm-up. Isso elimina o `getSession()` travado e corta dezenas de chunks lazy do caminho crítico.

### 2. Handler de bfcache restoration na vitrine
Adicionar em `src/features/ubiz_ofertas/pagina_ubiz_ofertas.tsx` um `useEffect` global:
```
window.addEventListener("pageshow", (e) => {
  if (e.persisted) window.location.reload();
});
```
Quando o usuário voltar via WebView e a página vier do bfcache, força reload limpo. Resolve a tela branca que impede reabrir.

### 3. Dismiss imediato do overlay de bootstrap em `/ofertas`
No `index.html`, no script inline (que já roda antes de qualquer JS de módulo), checar `if (location.pathname === "/ofertas")` e:
- Esconder `#bootstrap-fallback` mais cedo (sem aguardar `__APP_MOUNTED__`).
- Mostrar um spinner mínimo só se demorar > 1.5s (evita "Carregando aplicativo…" piscando).

Isso elimina a tela "Carregando aplicativo… 🐷" que aparece nos screenshots.

### 4. Garantir que SW não controle `/ofertas` em in-app browsers
Em `src/main.tsx` (ou novo `src/lib/swGuardOfertas.ts`), se `pathname.startsWith("/ofertas")` E o user-agent for in-app browser (Instagram/FBAN/FBAV/Line/WhatsApp), chamar `navigator.serviceWorker.getRegistrations()` e `unregister()` antes do mount. Garante que cliques em "Voltar" não mostrem chunks fantasmas cacheados.

### 5. Meta `Cache-Control` específico via headers no HTML
Adicionar no `index.html` (head):
```html
<meta http-equiv="Cache-Control" content="no-store" />
```
Apenas como reforço — o efeito real vem do passo 4.

---

## Arquivos alterados

- `src/App.tsx` — short-circuit antes dos providers para `/ofertas`.
- `src/features/ubiz_ofertas/pagina_ubiz_ofertas.tsx` — listener `pageshow` para bfcache.
- `src/main.tsx` — desregistrar SW em in-app browsers na rota `/ofertas`.
- `index.html` — dismiss precoce do overlay quando `pathname === "/ofertas"`.

## Resultado esperado
- Abertura em WebView do Instagram/Facebook: **< 2s** até a vitrine aparecer (vs. 8–15s hoje).
- Botão "Voltar" do WebView: ao reabrir o link, página recarrega limpa, sem tela branca.
- Sem regressão nas rotas autenticadas (`/`, `/auth`, `/dashboard` etc.) — a otimização é exclusiva para `/ofertas`.
