
## Diagnóstico (causa real)

O erro de runtime real (capturado nos logs/network) é:

```
TypeError: Importing a module script failed.
URL: /node_modules/.vite/deps/chunk-QCHXOAYK.js?v=6b467bc9
```

Ele acontece **antes mesmo de qualquer tela de Campeonato**, dentro do `AppLayout → ProtectedRoute` ao carregar `/`. Não é regressão da Etapa 3 nem do `DriverPanelPage` — é um problema de **chunk obsoleto servido pelo Service Worker** depois que o Vite re-otimizou as deps e atribuiu um novo hash (`?v=6b467bc9`). O ErrorBoundary detecta como “chunk error” e mostra o card *“Atualização disponível”*, o usuário clica em “Recarregar”, mas a tela volta preta (replay confirma: `Atualizando o aplicativo… → /?v=… → Iniciando aplicativo… → preto`).

A causa de o ciclo ficar preso (e não ser resolvido pelo próprio recovery do app) foi a **última mudança cirúrgica**:

```ts
// src/main.tsx
// installGlobalDomErrorRecovery();  // ⟵ comentada
```

Sem esse listener global, qualquer erro de import dinâmico que ocorre **fora da árvore React** (ex.: os `void import("@/components/AppLayout")` e `void import("@/pages/Dashboard")` do warm-up em `main.tsx`, e prefetches do DriverPanel) **não dispara mais a limpeza de SW + caches**. Resultado: o SW continua entregando HTML antigo apontando para chunks com hash novo → tela preta permanente até o usuário limpar o app na mão.

Resumo das duas frentes:
1. O **trigger** é stale Vite deps + SW antigo controlando a página.
2. O **motivo de não auto-recuperar** é o `installGlobalDomErrorRecovery` desativado.

## Plano de correção (mínimo, sem novas features)

### Etapa 1 — Reativar auto-recovery global
Arquivo: `src/main.tsx`
- Remover o `// [TEMP]` e descomentar `installGlobalDomErrorRecovery();`.
- Manter `installRouteDiagnostics();` ainda comentado (não é necessário para resolver o boot e não vamos reintroduzir variáveis).

Justificativa: o cooldown via `sessionStorage` (`canAttemptRecovery`, 60s) já evita loop de reload. Sem essa função, erros fora do React não recuperam.

### Etapa 2 — Quebrar o loop de Service Worker entre versões
Arquivo: `index.html` (script inline, antes de qualquer `<script type="module">`).
- Adicionar um pequeno guard que compara um `BUILD_VERSION` (string injetada pelo Vite via `import.meta.env.VITE_BUILD_ID` ou `Date.now()` no preview) com o que está em `localStorage`. Se diferente:
  - `navigator.serviceWorker.getRegistrations().then(r => r.forEach(x => x.unregister()))`
  - `caches.keys().then(k => k.forEach(c => caches.delete(c)))`
  - Salvar a nova versão no `localStorage`.
- Não recarrega — apenas garante que o próximo carregamento dos módulos não passa por SW velho.

Esse guard é **idempotente, roda uma vez por versão**, não interfere em quem já está na versão atual.

### Etapa 3 — Validação
- Abrir `/` na preview e confirmar boot até o Dashboard/Login (sem tela preta).
- Abrir `/motorista/campeonato?brandId=db15bd21-9137-4965-a0fb-540d8e8b26f1` na preview e confirmar render.
- Confirmar via console que **não** há mais `Importing a module script failed.`.

## O que NÃO vamos mexer
- `DriverPanelPage.tsx` (lógica de `campeonatoOnly` está correta — o redirect só dispara após `modulesLoaded` + sem outros módulos; não é causa da tela preta).
- `RotaCampeonatoMotorista.tsx` (com `trackStage`, mas sem efeito colateral de boot).
- `OfertasFastTrack` em `App.tsx`.
- Hooks `useDueloCampeonatoHabilitado` / `useCampeonatoStandalone`.
- Schema, RLS, edge functions.

## Detalhes técnicos resumidos

```text
boot atual (quebrado):
  index.html
    └─ main.tsx
         ├─ void import(AppLayout)        ⟵ falha (chunk stale do SW)
         ├─ void import(Dashboard)        ⟵ falha
         └─ App lazy import → render → ErrorBoundary "Atualização disponível"
              └─ Reload → SW serve HTML velho de novo → loop

boot após fix:
  index.html (guard de versão limpa SW se mudou)
    └─ main.tsx (installGlobalDomErrorRecovery ATIVO)
         └─ se ainda houver chunk stale residual: recovery dispara 1x,
            limpa caches + SW e recarrega com ?v=timestamp → ok.
```

Confiança alta no diagnóstico: o erro de import dinâmico está nos logs do cliente, e a regressão coincide exatamente com a desativação do recovery global na Etapa anterior.
