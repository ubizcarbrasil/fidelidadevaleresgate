# Por que está lento (10s)

O link `/driver?brandId=...` (e o curto `/d/:brandId`) é servido pelo **mesmo SPA gigante** que o painel admin. Cada abertura no WebView (Ubiz Car / WhatsApp / Instagram) executa esta cadeia em série:

```text
index.html
  → main.tsx (boot shell)
    → App.tsx (centenas de lazy imports, AuthProvider, BrandProvider, QueryClient, Sentry init etc.)
      → resolve marca por ?brandId= (query Supabase)
        → resolve tema/branches (mais queries)
          → finalmente monta /driver
            → /driver dispara queries de ofertas/categorias
```

Em rede 4G dentro de um in-app browser sem cache, isso somado fácil passa de 8-10s. Não é um único gargalo — é **arquitetura**: uma landing pública carregando um app inteiro de back-office.

# Resposta direta à sua pergunta

**Não precisa criar projeto separado.** Dá para resolver dentro deste mesmo repo, com ganho equivalente, em duas frentes:

1. Tornar o `/d/:brandId` um **redirect estático** (HTML puro em `public/`), zero React.
2. Fazer `/driver` virar uma **rota leve isolada** (sem AuthProvider / BrandProvider / Sentry / lazy do admin), nos moldes do que já fizemos com `/webview`.

Só vale criar projeto separado se você quiser também **domínio próprio** (`ofertas.ubizcar.com.br`) com deploy independente — mas isso é decisão de marketing, não de performance.

# Plano técnico (3 etapas)

### Etapa 1 — Redirect estático em `/d/:brandId` (ganho imediato)
- Criar `public/d/index.html` minimalista (~1KB) com `<script>` que lê `location.pathname`, extrai o `brandId` e faz `location.replace('/driver?brandId=...')`.
- Configurar fallback de rota para `/d/*` apontar para esse HTML (Vite/SPA já serve `index.html` por padrão; precisamos servir `d/index.html` para esse prefixo — usar `vite.config.ts` ou um pequeno arquivo `_redirects` se aplicável).
- Remover a rota React `PaginaRedirecionamentoDriver` (vira morta).
- Resultado: o redirect deixa de exigir boot do React (economiza 2-4s).

### Etapa 2 — Rota `/driver` em modo "lite" (ganho principal)
Espelhar o padrão já existente do `/webview` (ver `isWebviewLitePath` em `bootMonitoring.ts` e o skip de Sentry/web-vitals em `main.tsx`):
- Adicionar `/driver` ao conjunto de rotas "lite".
- Criar um `App` enxuto (`AppDriver.tsx`) que monta apenas: `QueryClientProvider` + `BrandProvider` mínimo + `<DriverMarketplace />`. Sem `AuthProvider`, sem rotas admin, sem `lazy` desnecessário.
- No `main.tsx`, escolher `App` vs `AppDriver` por `pathname` antes do `lazyWithRetry`.
- Pré-resolver a marca via `?brandId=` direto (já é o caminho rápido — pular fallback por hostname para essa rota).

### Etapa 3 — Cache e prefetch
- Adicionar `<link rel="preconnect">` para o Supabase no `index.html` (se ainda não existe).
- Cache HTTP forte para os assets do bundle do driver.
- Service Worker: garantir que a rota `/driver` use `stale-while-revalidate` para a 2ª abertura ser instantânea (provavelmente já está, mas validar).

# Métricas alvo
- 1ª abertura no WebView: **≤ 2,5s até primeiro conteúdo visível** (LCP).
- 2ª abertura: **< 800ms** (cache + SW).

# Onde vou mexer
- `public/d/index.html` (novo, redirect estático)
- `vite.config.ts` (servir `public/d/index.html` para `/d/:brandId`) — só se necessário
- `src/main.tsx` (roteador de App por path)
- `src/AppDriver.tsx` (novo, app enxuto)
- `src/App.tsx` (remover rota `/d/:brandId` e `/driver` quando em modo lite)
- `src/lib/bootMonitoring.ts` (incluir `/driver` em `isWebviewLitePath`)
- `src/features/driver_short_link/pagina_redirecionamento_driver.tsx` (remover)

# Sobre criar um projeto separado
Só recomendaria se você quiser:
- Domínio dedicado (`ofertas.ubizcar.com.br`) com deploy independente, ou
- Time/CI separado para iterar marketing sem mexer no admin.

Para **só performance**, o plano acima entrega o mesmo resultado sem o custo de manter dois repos, dois deploys e duplicar lógica de marca/ofertas.
