
# Plano de Otimização — Boot e Dashboard Lentos (>1 min)

## Diagnóstico (concreto, baseado em logs reais do preview)

A captura de rede do seu preview mostra que, ao abrir `ubiz-shop.valeresgate.com.br` logado como `brand_admin`:

1. O sistema **NÃO** abre o app do cliente (PWA). Como você é `brand_admin` da marca, o `App.tsx` (linhas 448–464) cai no caminho “admin tem painel” e carrega o **Dashboard administrativo completo**.
2. Em ~3 segundos foram disparadas **>40 requisições paralelas**, várias delas pesadas:
   - `get_dashboard_kpis` chamado **2x** (uma com `brand_id=null` agregando a plataforma inteira: 9.062 clientes, 6.732 motoristas, 37.944 eventos, 2.700+ corridas/dia × 30 dias) — isto sozinho explica boa parte do >1 min em conexão móvel.
   - `get_dashboard_daily_counts` para 7 dias (centenas de milhares de linhas no servidor).
   - `HEAD /machine_rides` com `count=exact` em janela de 30 dias.
   - 5 queries duplicadas em `brands` (mesmo brand_id, colunas sobrepostas).
   - 2 queries duplicadas em `branches` (`select=*` e `select=id`).
   - `audit_logs INSERT` (LOGIN) sincronamente no caminho crítico.
   - Realtime (4 canais) registrado antes do boot terminar.
   - Edge function `seed-demo-stores` invocada pelo `useAutoSeedDemo` em todo carregamento (faz 2 queries de `stores` antes de decidir não rodar).
3. O loader “Aplicando tema e preparando dados…” fica visível porque a fase `BRAND_READY` é seguida pelo Suspense do chunk Dashboard + ~40 queries em série/paralelo antes do primeiro pixel real renderizar.

Resumo do problema: **o Dashboard agrega contadores globais da plataforma (9k clientes, 6,7k motoristas, dezenas de milhares de corridas) sem cache cross-session, sem skeleton imediato e bloqueando a primeira tela**.

## O que vai ser feito

### 1. Cortar requisições duplicadas e mover do caminho crítico

- **Unificar todas as leituras de `brands` por brand_id** em uma única query no `BrandContext` (já carrega `*` do `public_brands_safe`). Hooks como `useBrandInfo`, `useBrandName`, `useBrandTheme(settings)`, `useBrandModules` (a parte de `brand_settings_json`) e os `select brand_settings_json` espalhados vão reusar o mesmo registro via `useBrand()` em vez de refazer fetches.
- **Remover o segundo `get_dashboard_kpis`**: o Dashboard estava disparando duas vezes (uma global, uma da marca) por reinício de queryKey causado por `periodStart` recriado a cada render. Memoizar `periodStart` e calcular `brandFilter` estável.
- **Adiar `audit_logs INSERT` de LOGIN para `requestIdleCallback`** (ainda é assim, mas em alguns caminhos roda no momento do `SIGNED_IN`; consolidar para ser sempre idle).
- **Desabilitar `useAutoSeedDemo` em marcas que já têm `auto_seed_done` no `brand_settings_json` que o BrandContext já carregou** — evita as 3 requisições de checagem (`brands` + 2× `stores HEAD`) em todo boot.

### 2. Tornar o Dashboard “shell-first” (LCP imediato)

- Renderizar **header + skeletons** do Dashboard imediatamente, sem esperar nenhuma RPC.
- `useDashboardKpis` e `useQuery("dashboard-daily-counts")` passam a retornar `placeholderData: keepPreviousData` e renderizam em estado “stale visível” quando há cache.
- Aumentar `staleTime` para `5 min` nas KPIs e `10 min` em `daily_counts` (números mudam pouco ao longo do dia para um admin).
- **Evitar a agregação global** quando o usuário tem brand definido: o Dashboard chamava `get_dashboard_kpis` com `brandFilter=undefined` em paralelo com a versão da marca. Para brand_admin, só chamar a versão da marca.
- Adiar componentes pesados (`DashboardChartsSection`, `RankingPontuacao`, `PointsFeed`, `BranchDashboardSection`) para depois do primeiro paint usando `lazyWithRetry` + `Suspense` com skeleton.

### 3. Adiar Realtime e listeners pesados

- O Dashboard registra **4 canais Realtime** (`redemptions`, `machine_rides`, `customers`, `offers`) já no mount. Já existe um `RealtimeRefreshGate` adiado por `requestIdleCallback`, mas o Dashboard ainda mantém o `useRealtimeRefresh` (não-gated) compilado no bundle. **Remover o hook duplicado** e manter apenas o gate idle.
- Adiar `useAdminNotifications` (com seu canal Realtime de `admin_notifications`) para depois do primeiro paint.

### 4. Reduzir bundle inicial e split mais agressivo

- O `App.tsx` declara ~120 `lazy()` no topo do arquivo. Em React, isso gera 120 entradas de chunk-graph mas o módulo `App.tsx` em si fica enxuto — OK. Porém o `vite.config.ts` faz `manualChunks` que junta `recharts` num único `vendor-charts` que **só é usado no Dashboard**: garantir que o chunk só carrega quando o Dashboard for navegado (já é, via lazy), mas o import top-level de `DashboardChartsSection` em `Dashboard.tsx` força o bundle do Dashboard a puxar Recharts no primeiro paint. **Lazy-load `DashboardChartsSection`**.
- `framer-motion` está em `vendor-motion` mas é importado no topo de `CustomerLayout.tsx` (e em vários outros). Como o Dashboard NÃO usa, não afeta o boot atual, mas vou auditar imports do AppLayout para garantir que não puxa motion/charts.
- Auditar e remover `console.info("[boot] …")` em produção (já são leves, mas somam ~12 logs).

### 5. Roteamento mais inteligente do portal

- No `App.tsx`, quando o domínio é white-label (não-portal) e o usuário é `brand_admin` da marca, hoje carregamos o Dashboard inteiro. **Adicionar um atalho**: se o usuário entrar pela URL raiz `/` em domínio white-label, mostrar primeiro um **mini-loader leve com escolha** (“Painel Admin” / “Ver como Cliente”) ou ir direto pro WhiteLabelLayout (PWA do cliente) e tornar o painel admin acessível por subdomínio dedicado. **Vou perguntar antes de mexer nessa lógica de UX**, pois muda o comportamento que o usuário pode estar acostumado.

### 6. Limpeza de código não utilizado (low-risk)

- Remover o hook `useRealtimeRefresh` antigo (substituído por `RealtimeRefreshGate`).
- Remover/consolidar consultas duplicadas de `brand_settings_json` (centralizar via `useBrand()`).
- Remover `disableRuntimeCachesOnBoot` (já é no-op, mantido só pra compatibilidade — apagar referências).
- Detectar e remover duplicação entre `src/hooks/useCrmContacts.ts` vs `src/modules/crm/hooks/useCrmContacts.ts` e `src/hooks/useTierStats.ts` vs `src/modules/crm/hooks/useTierStats.ts` (existem dois pares — manter apenas o do módulo).

## O que NÃO está no plano (e por quê)

- Não vou refatorar a estrutura de `App.tsx` (rotas) — risco alto, ganho de boot pequeno.
- Não vou trocar React Query por outra lib.
- Não vou mexer nas RPCs SQL `get_dashboard_kpis`/`get_dashboard_daily_counts` agora — elas já são server-side; o ganho real virá do cache + adiamento. Se depois da Fase 1 ainda estiver lento, aí sim avalio criar uma RPC consolidada `dashboard_bootstrap()` que retorna KPIs+counts+notifications em uma chamada só.

## Resultado esperado

- **Tempo até o primeiro pixel útil (LCP) do Dashboard: <1.5s** (hoje fica ≥30s aguardando KPIs).
- **Requisições do boot: de ~40 para ~12** no primeiro carregamento e ~4 nos seguintes (graças ao cache).
- **Dados do dashboard preenchem a tela em background**, sem bloquear navegação.

## Pergunta antes de implementar

Sobre o item **5 (roteamento)**: hoje quando você (`brand_admin`) abre `ubiz-shop.valeresgate.com.br`, cai direto no Dashboard administrativo. Você quer:

- **A)** Manter como está (Dashboard direto) — apenas otimizar performance.
- **B)** Mudar para abrir o **App do Cliente (PWA)** por padrão, e o admin entra pelo botão “Painel” no menu.
- **C)** Mostrar uma tela rápida de escolha (Cliente / Admin) só na primeira visita.

Vou aguardar sua resposta dessa pergunta para finalizar o plano e seguir com a implementação.
