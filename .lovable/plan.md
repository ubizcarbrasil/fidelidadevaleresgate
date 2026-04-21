
## Corrigir o travamento no boot e reduzir drasticamente o tempo de abertura

Identifiquei dois problemas principais no fluxo atual de inicialização:

1. O app está **limpando Service Worker e CacheStorage cedo demais e vezes demais**:
   - `index.html` faz recuperação agressiva com reload.
   - `main.tsx` chama `disableRuntimeCachesOnBoot()` em toda abertura.
   - `usePWA.ts` chama `clearRuntimeCaches()` de novo ao montar.
   
   Isso deixa o carregamento instável, pode provocar novo reload e piora exatamente o cenário de “demora e não abre”.

2. O fluxo de permissões/roles está ambíguo:
   - `AuthContext` libera `loading=false` antes de ter uma flag clara de “roles concluídos”.
   - `useBrandGuard` usa `user && roles.length === 0` como sinônimo de “ainda carregando”.
   - Resultado: se a consulta de `user_roles` atrasar, falhar, ou vier vazia por algum motivo, o app pode ficar preso em `LOADING` mesmo com sessão válida.

## O que vou implementar

### 1) Parar de limpar cache automaticamente em toda abertura
Vou transformar a recuperação de cache em algo **reativo**, não mais parte do caminho crítico do boot.

Arquivos:
- `src/main.tsx`
- `src/hooks/usePWA.ts`
- `src/lib/pwaRecovery.ts`
- `index.html`

Mudanças:
- remover `disableRuntimeCachesOnBoot()` do boot normal;
- remover a limpeza automática de caches no `usePWA`;
- manter limpeza/reload apenas em:
  - erro real de chunk/import dinâmico;
  - botão “Atualizar agora”;
  - recuperação manual/explicitamente sinalizada;
- simplificar o script de recovery do `index.html` para não forçar recarga extra em todo load.

Resultado esperado:
- o app para de “se sabotar” no boot;
- menos reload invisível;
- menos chance de “Importing a module script failed” durante a abertura.

### 2) Separar “roles carregados” de “roles vazios”
Vou criar um estado explícito para permissões concluídas no `AuthContext`.

Arquivos:
- `src/contexts/AuthContext.tsx`
- `src/hooks/useBrandGuard.ts`
- `src/components/AppLayout.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/RootGuard.tsx`
- `src/components/ModuleGuard.tsx`

Mudanças:
- adicionar flag como `rolesCarregados` / `permissoesProntas`;
- marcar essa flag quando a busca em `user_roles` terminar, mesmo que venha lista vazia;
- fazer `useBrandGuard` depender dessa flag, e não de `roles.length === 0`;
- garantir fallback seguro em erro/timeout para não deixar o app preso no loader.

Resultado esperado:
- o app deixa de ficar eternamente em “carregando” por causa de ambiguidade de roles;
- guards decidem mais rápido e com previsibilidade;
- o loader some quando o boot realmente terminou.

### 3) Tornar o boot determinístico e mais curto
Vou alinhar as fases de boot com o que realmente bloqueia a abertura.

Arquivos:
- `src/contexts/AuthContext.tsx`
- `src/contexts/BrandContext.tsx`
- `src/compartilhados/components/tela_carregamento.tsx`

Mudanças:
- tratar como críticas apenas:
  - sessão,
  - roles,
  - resolução mínima de brand/contexto;
- deixar consultas secundárias fora do caminho crítico;
- ajustar mensagens da `TelaCarregamento` para refletir etapas reais, incluindo permissões quando necessário;
- evitar que timeouts apenas escondam o problema visualmente sem liberar o fluxo correto.

Resultado esperado:
- abertura mais direta;
- mensagens mais honestas;
- menos sensação de travamento.

### 4) Endurecer a recuperação de erro de chunk sem loop
Vou manter a proteção contra chunk stale, mas sem comportamento agressivo contínuo.

Arquivos:
- `src/lib/lazyWithRetry.ts`
- `src/lib/pwaRecovery.ts`
- `index.html`

Mudanças:
- preservar o retry com reload apenas para erro real de import dinâmico;
- impedir sequência de recuperação duplicada entre HTML bootstrap, lazy import e hook PWA;
- garantir cooldown único e fonte única de verdade para recovery.

Resultado esperado:
- continua se recuperando de build antiga/cache velho;
- sem loop de limpeza e reload;
- mais estabilidade em rede ruim.

### 5) Validar os gargalos residuais do shell inicial
Depois da correção estrutural, vou revisar o que ainda entra no caminho crítico da abertura.

Arquivos prováveis:
- `src/components/AppLayout.tsx`
- `src/hooks/useBrandName.ts`
- `src/hooks/useBrandModules.ts`
- `src/contexts/BrandContext.tsx`

Foco:
- evitar busca desnecessária no primeiro paint;
- adiar o que não precisa acontecer antes de mostrar a shell;
- manter tema/configurações não essenciais fora do bloqueio inicial.

## Critérios de aceite

- O app abre sem ficar parado indefinidamente na `TelaCarregamento`.
- Não há limpeza automática de Service Worker/cache em toda visita.
- O boot não depende mais de `roles.length === 0` para decidir loading.
- Usuário autenticado consegue chegar à rota correta sem spinner infinito.
- Em caso de chunk quebrado, a recuperação acontece de forma controlada, sem loop.
- A experiência visual do loader continua moderna, mas agora com boot realmente funcional.

## Arquivos que devem ser alterados

- `index.html`
- `src/main.tsx`
- `src/lib/pwaRecovery.ts`
- `src/lib/lazyWithRetry.ts`
- `src/hooks/usePWA.ts`
- `src/contexts/AuthContext.tsx`
- `src/hooks/useBrandGuard.ts`
- `src/contexts/BrandContext.tsx`
- `src/components/AppLayout.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/RootGuard.tsx`
- `src/components/ModuleGuard.tsx`
- `src/compartilhados/components/tela_carregamento.tsx`
