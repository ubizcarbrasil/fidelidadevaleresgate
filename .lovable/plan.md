
## Diagnóstico

Confirmei pelo preview e pelas suas imagens que existem **3 problemas somados** que estão deixando pior:

1. **O link compartilhado está sendo aberto dentro do `/webview` (iframe wrapper).** Nas imagens IMG_6985 e IMG_6988 aparece o cabeçalho "Ubiz Shop" — esse é o `WebviewPage`. Ou seja, o usuário abre o link e o app **carrega 2 SPAs em série**: primeiro o `/webview` (shell), depois um iframe com `/driver` (painel completo). Cada um faz boot do React, baixa chunks, providers, etc. Por isso 10s e por isso o "Algo deu errado" (o ErrorBoundary do iframe interno está disparando — provavelmente chunk antigo em cache do SW após o último deploy).

2. **A rota curta `/d/:brandId` ainda é um componente React** (`PaginaRedirecionamentoDriver`) que precisa: baixar `App.tsx` (34 KB) + chunk-RPCDYKBN (139 KB) + 56 scripts (~585 KB no preview), montar `<BrowserRouter>` e só então fazer `<Navigate>` para `/driver?brandId=...`. Mesmo no FastTrack, o tempo até o redirect é de 1.5s–3s só para o React mountar.

3. **O `DriverPanelPage` ainda é grande** (importa 25+ componentes do hub, overlays, gamificação, query client). Mesmo com prefetch, em rede móvel real (3G/4G no app Ubiz Car) isso é lento.

O caminho que **funciona de verdade** é cortar etapas, não otimizar etapas inúteis.

---

## Plano de correção

### 1. Parar de embrulhar o link do motorista no `/webview`

O `/webview` faz sentido para abrir sites de terceiros (afiliados) — **nunca** deveria embrulhar o nosso próprio painel. Vou:

- Auditar `src/lib/publicShareUrl.ts`, `src/components/driver/DriverMarketplace.tsx`, `src/pages/DriverPanelConfigPage.tsx` e qualquer ponto que use `buildWebviewWrapperUrl(...)` apontando para um destino interno (`/d/`, `/driver`, `/ofertas`).
- Trocar todos esses pontos por `buildDriverShortUrl(...)` direto, sem o wrapper. O link compartilhado/copiado vai ser apenas `https://app.valeresgate.com.br/d/<brandId>`.
- Resultado: **elimina um boot de SPA inteiro**, e some o cabeçalho "Ubiz Shop" do print.

### 2. Tornar `/d/:brandId` realmente instantâneo (HTML estático, sem React)

- Criar `public/d/index.html` (≈ 1 KB) com:
  - `<meta http-equiv="refresh" content="0; url=/driver?brandId=...">` **dinâmico via JS inline** (lê o pathname, extrai o `brandId`, monta a URL final preservando query string e hash) e faz `location.replace`.
  - Tela escura com spinner mínimo (CSS inline) caso o JS demore um frame.
- O Lovable hosting faz fallback SPA, mas como o arquivo `public/d/index.html` existe, ele será servido **antes** do `index.html` principal.
- Remover a rota React `<Route path="/d/:brandId" ...>` do `OfertasFastTrack` e do `AnimatedRoutes` em `src/App.tsx`.
- Apagar `src/features/driver_short_link/pagina_redirecionamento_driver.tsx`.
- Remover do `src/main.tsx` o branch `/d/` no `prefetchDriverPanel` (já não passa mais por React).

Resultado: clicar no link curto → resposta < 200 ms → redirect → navegador entra direto no `/driver?brandId=...` (que aí sim carrega o React).

### 3. Diagnosticar o "Algo deu errado" em produção

Esse erro vem do `ErrorBoundary` interno (string "Algo deu errado" em `src/components/ErrorBoundary.tsx` linha 132). Hipótese forte: chunk antigo no Service Worker depois do último publish.

- Adicionar um **kill-switch automático** no `public/d/index.html`: antes do redirect, fazer `navigator.serviceWorker.getRegistrations()` e `unregister()` + limpar `caches` **uma única vez por sessão** (flag em `sessionStorage`). Custo: < 50 ms. Garantia de que a primeira abertura no novo deploy não vai entregar bundle quebrado.
- Manter o `installGlobalDomErrorRecovery` que já existe para os demais casos.
- Pedir Sentry breadcrumbs no fluxo (já temos `reportError({source:"boundary"})`) para confirmar a causa após esse fix.

### 4. Limpar o que ficou meio-feito nas tentativas anteriores

- Manter o `OfertasFastTrack` (ele ajuda no `/driver` puro).
- Manter o prefetch de `DriverPanelPage` em `main.tsx` apenas para `/driver` (remover o ramo `/d/`).
- Atualizar `isWebviewLitePath()` se necessário.

---

## Métricas alvo (rede 4G real)

- Clique no link curto → primeiro pixel do `/driver`: **≤ 1.5 s**
- Carregamento total até CPF login: **≤ 3 s** (1ª vez), **≤ 800 ms** (2ª vez via cache)
- Zero ocorrências de "Algo deu errado" após o 1º deploy pós-correção.

---

## Arquivos afetados

```text
public/d/index.html                                       (novo, ~1 KB)
src/App.tsx                                               (remove rota /d/:brandId)
src/main.tsx                                              (remove ramo /d/ do prefetch)
src/features/driver_short_link/                           (apaga pasta inteira)
src/lib/publicShareUrl.ts                                 (auditoria de uso do webview wrapper)
src/components/driver/DriverMarketplace.tsx               (idem)
src/pages/DriverPanelConfigPage.tsx                       (idem)
```

---

## Sobre criar um projeto separado

**Não é necessário.** O gargalo não era "o projeto é grande demais para conviver com o painel", era arquitetural: 2 SPAs empilhados + chunk velho em cache. Resolver isso aqui é mais rápido, mais barato e não duplica regra de negócio (auth de motorista, ofertas, pontos, ledger). Só faria sentido um projeto separado se o time quisesse um **domínio próprio para marketing** (`ofertas.ubizcar.com.br`) com pipeline de deploy independente — mas isso é decisão de produto, não de performance.

Posso seguir e implementar?
