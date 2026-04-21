
# Corrigir tela vazia após otimização + remover o delay restante

## Diagnóstico confirmado

Há **dois problemas diferentes** acontecendo agora:

### 1. Bug crítico que fez “sumir tudo”
A regressão está em `src/contexts/AuthContext.tsx`.

Hoje o `fetchRoles` tem:
- `fetchIdRef` para descartar respostas antigas
- um throttle de 2s (`lastFetchedUserIdRef` / `lastFetchedAtRef`) para evitar duplicação

Esses dois mecanismos entraram em conflito:

```ts
const reqId = ++fetchIdRef.current;
void fetchRoles(newSession.user.id, reqId);
```

e dentro de `fetchRoles`:

```ts
if (lastFetchedUserIdRef.current === userId && now - lastFetchedAtRef.current < 2000) {
  return;
}
```

Cenário real:
1. bootstrap chama `fetchRoles(user, reqId=1)`
2. `onAuthStateChange` dispara logo depois e incrementa para `reqId=2`
3. o segundo fetch é abortado pelo throttle de 2s
4. quando o primeiro termina, ele é ignorado porque `fetchIdRef.current !== 1`
5. `roles` fica `[]`

Com `roles` vazio:
- `useBrandGuard()` cai no fallback final e retorna `consoleScope = "BRANCH"`
- `currentBrandId = null`
- `currentBranchId = null`

Resultado visível nas imagens:
- sidebar de **franqueado/cidade** aparece indevidamente
- dashboard principal fica quase vazio
- vários blocos não renderizam porque dependem de `currentBrandId` ou `currentBranchId`

Isso explica exatamente o “agora sumiu tudo”.

### 2. O delay restante ainda existe
Mesmo após o cache anterior, ainda há consultas pesadas/repetidas no boot:

- `useSidebarBadges.ts` faz **4 HEADs** e ainda com `refetchInterval: 30_000`
- `DashboardQuickLinks.tsx` faz queries extras para:
  - `brands`
  - `brand_domains`
  - `public_brand_modules_safe`
- `useBrandScoringModels.ts` ainda busca `branches.scoring_model`
- `useProductScope()` ainda busca plano + `plan_business_models` + `plan_module_templates`
- `useResolvedModules()` continua acoplando carga inicial de módulos/realtime

Pelos network logs, o gargalo atual não é mais só `brands`; agora é o conjunto:
- badges
- quick links
- escopo de produto
- scoring models
- módulos

## Correção

### Etapa 1 — corrigir a regressão de auth imediatamente
Arquivo: `src/contexts/AuthContext.tsx`

Remover o throttle temporal de 2s e substituir por uma deduplicação segura, sem invalidar o request válido.

Implementação:
- manter `fetchIdRef` para evitar race conditions
- remover:
  - `lastFetchedUserIdRef`
  - `lastFetchedAtRef`
  - early return de 2s
- opcionalmente deduplicar apenas quando o mesmo `requestId` já estiver em andamento, sem cancelar o request mais novo

Resultado esperado:
- `roles` volta a popular corretamente
- `consoleScope` deixa de cair em `"BRANCH"` por engano
- o painel volta a mostrar o console correto da marca
- a tela deixa de “sumir”

### Etapa 2 — blindar `useBrandGuard` contra fallback visual incorreto
Arquivo: `src/hooks/useBrandGuard.ts`

Hoje, sem roles, o fallback final é:

```ts
return "BRANCH";
```

Vou endurecer isso para evitar UI errada quando auth ainda não carregou ou falhou:
- se não houver nenhum role conhecido, retornar um estado seguro temporário no guard
- manter a UI esperando em vez de assumir console de cidade por padrão

Abordagem:
- adicionar um estado de guarda mais seguro no cálculo do scope, ou
- ajustar `ProtectedRoute` / `AppLayout` para não renderizar layout administrativo enquanto `roles` ainda não estiverem consistentes

Objetivo:
- nunca mais mostrar sidebar/painel errado por ausência temporária de roles

### Etapa 3 — reduzir o delay restante no boot do dashboard
Foco nos arquivos que ainda fazem carga paralela demais.

#### 3.1 `src/hooks/useSidebarBadges.ts`
Otimizar:
- aumentar `staleTime`
- desligar `refetchInterval: 30_000` no boot administrativo
- manter atualização sob demanda ou por realtime quando existir
- revisar filtros sem `brand_id` em queries globais (`store_points_rules`, `store_type_requests`) para não contar mais do que precisa

Impacto:
- reduz 4 requests recorrentes a cada abertura/navegação

#### 3.2 `src/components/dashboard/DashboardQuickLinks.tsx`
Reduzir consultas:
- reaproveitar `brandSettings` e `brandId` do `useBrandInfo()`
- evitar query duplicada de `brands`
- deixar `brandDomains` com cache mais longo
- carregar links secundários de forma preguiçosa se necessário

Impacto:
- corta queries logo após abrir a home

#### 3.3 `src/hooks/useBrandScoringModels.ts`
Otimizar:
- aumentar `staleTime`
- reutilizar contexto/cache quando possível
- evitar refetch imediato em toda navegação

#### 3.4 `src/features/city_onboarding/hooks/hook_escopo_produto.ts`
Manter o cache já criado, mas:
- aumentar `staleTime`
- evitar reconsulta desnecessária de `plan_business_models` e `plan_module_templates` no boot
- considerar cache por plano, não só por brand

#### 3.5 `src/compartilhados/hooks/hook_modulos_resolvidos.ts`
Ajustar carga inicial:
- preservar realtime
- mas reduzir agressividade de `refetchOnWindowFocus`
- evitar que o sidebar e os módulos disputem o boot inicial

## Arquivos a ajustar

1. `src/contexts/AuthContext.tsx`
2. `src/hooks/useBrandGuard.ts`
3. `src/hooks/useSidebarBadges.ts`
4. `src/components/dashboard/DashboardQuickLinks.tsx`
5. `src/hooks/useBrandScoringModels.ts`
6. `src/features/city_onboarding/hooks/hook_escopo_produto.ts`
7. `src/compartilhados/hooks/hook_modulos_resolvidos.ts`

## O que não vou mexer

- Não vou desfazer o fix de isolamento entre empresas
- Não vou recolocar resolução de brand por hostname no portal universal
- Não vou alterar RLS nem estrutura de banco para este bug
- Não vou mexer no `src/integrations/supabase/client.ts`

## Resultado esperado

### Após a Etapa 1
- o painel volta a carregar
- a sidebar deixa de cair em “Gestão Regional” por engano
- a visão da marca reaparece normalmente

### Após a Etapa 3
- clique e navegação ficam mais responsivos
- menos requests no boot
- menos polling desnecessário
- dashboard abre sem sensação de travamento

## Risco

Baixo a médio:
- o fix de `AuthContext` é crítico, mas bem localizado
- as otimizações seguintes são de cache/refetch e não mudam regra de negócio

## Ordem de implementação

1. Corrigir `AuthContext` para restaurar o painel
2. Blindar `useBrandGuard` contra fallback visual incorreto
3. Reduzir requests restantes no dashboard/sidebar
4. Verificar novamente o fluxo no mobile e no portal universal

## Estimativa

~12 min
