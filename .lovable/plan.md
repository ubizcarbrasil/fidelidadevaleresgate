

# Eliminar delay em cliques e navegação no admin (queries duplicadas + cache faltando)

## Diagnóstico (com evidências do network log)

Em **um único segundo** após login, o portal `app.valeresgate.com.br` dispara **723 linhas de network log** com queries massivamente duplicadas. Exemplo real do log:

| Query | Vezes no mesmo segundo |
|---|---|
| `brands?select=name,brand_settings_json,subscription_plan&id=eq.{id}` | 2x+ |
| `brands?select=brand_settings_json&id=eq.{id}` | 3x+ |
| `brands?select=subscription_plan&id=eq.{id}` | 1x |
| `brand_modules` (com join) | repetido em cada navegação |
| `branches?select=...&brand_id=eq.{id}` | 2x |
| `admin_notifications` | 1x (mas roda em loop) |

### Causas raiz

**🔴 Causa #1 — `useBrandName.ts` não usa React Query**
```ts
// src/hooks/useBrandName.ts (linha 18-33)
useEffect(() => {
  supabase.from("brands").select("name, brand_settings_json, subscription_plan")...
}, [brandId]);
```
- Sem cache, sem deduplicação
- Chamado por **6 componentes simultaneamente** (`AppLayout`, `BrandSidebar`, `BranchSidebar`, `Dashboard`, `DashboardHeader`, `BrandSettingsPage`, `GanhaGanhaReportsPage`)
- Cada um dispara seu próprio `fetch` → 6 queries idênticas em paralelo
- A cada navegação, o componente desmonta/remonta → refaz tudo

**🔴 Causa #2 — `BrandContext.brand` fica `null` no portal universal**

Após o fix anterior, `app.valeresgate.com.br` foi adicionado a `PORTAL_HOSTNAMES`, então o `BrandContext` retorna sem nunca setar `brand`. Isso é correto pra evitar vazamento, MAS:
- 60+ arquivos no app fazem `supabase.from("brands").select("brand_settings_json").eq("id", currentBrandId)` separadamente, esperando ler do contexto
- Como contexto está vazio, **cada um vai ao banco** sem cache compartilhado
- Exemplos: `BrandBranchForm.tsx` (2x), `ProdutosResgatePage.tsx` (3x), `useAutoSeedDemo.ts`, `DashboardQuickLinks.tsx`, `DemoAccessCard.tsx`, etc.

**🟡 Causa #3 — `currentBrandId` instável**

`useBrandGuard.currentBrandId` depende de `[brand, roles, isRootAdmin]`. O array `roles` muda de referência a cada `setRoles()` no AuthContext (até em StrictMode duplo), invalidando todas as `queryKey: [..., currentBrandId]` e disparando refetches em cascata.

**🟡 Causa #4 — `admin_notifications` provavelmente em polling/realtime sem throttle**

Aparece no log inicial e pode estar refazendo a cada interação. Vou confirmar e otimizar se necessário.

## Correção

### 1. Reescrever `useBrandName.ts` com React Query (impacto altíssimo)

Trocar `useState + useEffect + supabase` por `useQuery` com `staleTime: 5 min`:

```ts
// src/hooks/useBrandName.ts
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";

export function useBrandInfo() {
  const { roles } = useAuth();
  const { brand: ctxBrand } = useBrand();

  const brandId = ctxBrand?.id ?? roles.find((r) => r.brand_id)?.brand_id ?? null;

  const { data } = useQuery({
    queryKey: ["brand-info", brandId],
    enabled: !!brandId,
    staleTime: 5 * 60 * 1000,  // 5 min — name/logo raramente muda
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      // Se já temos do contexto, evita ida ao banco
      if (ctxBrand && ctxBrand.id === brandId) return ctxBrand;
      const { data } = await supabase
        .from("brands")
        .select("name, brand_settings_json, subscription_plan")
        .eq("id", brandId!)
        .single();
      return data;
    },
  });

  const settings = (data?.brand_settings_json as Record<string, any>) ?? {};
  return {
    name: data?.name ?? "",
    logoUrl: settings.logo_url ?? null,
    brandId,
    subscriptionPlan: data?.subscription_plan ?? null,
  };
}

export function useBrandName(): string {
  return useBrandInfo().name;
}
```

**Impacto:** dos 6+ componentes que chamavam `useBrandInfo`, todos passam a compartilhar **1 única query cacheada por 5 minutos**.

### 2. Estender `BrandContext` para resolver `brand` via roles no portal universal

No portal `app.valeresgate.com.br`, em vez de deixar `brand = null`, carregar o `brand` correspondente ao role do usuário:

```ts
// src/contexts/BrandContext.tsx — adicionar useEffect
useEffect(() => {
  // Se brand já foi resolvido (por domain ou ?brandId=), nada a fazer
  if (brand || loading) return;
  if (!user) return;
  
  // Portal universal: resolve brand via role do usuário
  const loadFromRole = async () => {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("brand_id")
      .eq("user_id", user.id)
      .not("brand_id", "is", null)
      .limit(1)
      .maybeSingle();
    
    if (roleRow?.brand_id) {
      const brandData = await fetchBrandById(roleRow.brand_id);
      if (brandData) setBrand(brandData);
    }
  };
  loadFromRole();
}, [brand, loading, user]);
```

**Impacto:** com `brand` populado no contexto, todos os 60 arquivos que fazem queries diretas a `brands` poderão ler do contexto (passo 3) — eliminando 80%+ das queries duplicadas.

### 3. Memoizar `roles` no AuthContext (estabilidade de referência)

`roles` é setado a partir de `data || []` — cada chamada cria novo array. Adicionar comparação estrutural:

```ts
// src/contexts/AuthContext.tsx — em fetchRoles
const newRoles = data || [];
setRoles((prev) => {
  if (prev.length === newRoles.length && 
      prev.every((r, i) => r.id === newRoles[i]?.id)) {
    return prev;  // mesma referência → não re-renderiza consumidores
  }
  return newRoles;
});
```

**Impacto:** `currentBrandId` para de invalidar queryKeys quando o conteúdo de roles não mudou. Reduz refetches em cascata.

### 4. Centralizar `subscription_plan` no contexto/cache global

O `subscription_plan` é lido em 3 lugares diferentes:
- `useBrandInfo` (passo 1, agora cacheado)
- `useProductScope` (já cacheado)
- `BrandSidebar` direto

`useProductScope` já busca `subscription_plan`. Vou fazê-lo reaproveitar do React Query cache do `useBrandInfo` quando possível, evitando uma query extra:

```ts
// hook_escopo_produto.ts — usar queryClient.getQueryData
const cachedBrand = queryClient.getQueryData<any>(["brand-info", brandId]);
const planKey = cachedBrand?.subscription_plan ?? (await queryFn());
```

### 5. (Se confirmado no log) — desligar realtime/polling de `admin_notifications`

Investigar `useAdminNotifications` ou similar. Se houver `setInterval` ou subscribe sem cleanup, trocar por:
- `staleTime: 30s` + manual refetch
- ou realtime com filtro de brand_id (sem polling)

### 6. Lazy-load do `AppLayout` chunks ao clicar no menu

Verificar se há chunks pesados sendo carregados em cada clique. Se sim, adicionar prefetch nos `Link` do sidebar (`onMouseEnter` → `import()`).

## Arquivos a modificar

1. **`src/hooks/useBrandName.ts`** — reescrever com React Query (essencial)
2. **`src/contexts/BrandContext.tsx`** — popular `brand` via role no portal universal
3. **`src/contexts/AuthContext.tsx`** — estabilizar referência de `roles`
4. **`src/features/city_onboarding/hooks/hook_escopo_produto.ts`** — reaproveitar cache
5. **(condicional)** `src/hooks/useAdminNotifications.ts` (ou similar) — controlar polling
6. **(condicional)** `src/components/consoles/BrandSidebar.tsx` — adicionar prefetch nos links

## O que NÃO vou mexer

- ❌ Lógica de RLS, segurança, isolamento de tenants — recém corrigido
- ❌ `useBrandGuard.currentBrandId` — lógica está correta
- ❌ Queries que filtram dados operacionais (offers, customers, branches) — já usam React Query
- ❌ Refatorar os 60 arquivos que chamam `from("brands")` — passo 2 já resolve a maioria via contexto

## Resultado esperado

- Login no portal: queries a `brands` caem de **6+ duplicadas** para **1 única** (cache por 5 min)
- Navegação entre páginas: chunks JS já carregados + queries cacheadas → navegação **instantânea** (<100ms percebido)
- Cliques em botões com mutations: sem mudança (mutations não eram o gargalo)
- Network log inicial: deve cair de ~700 linhas para ~150-200

## Risco

**Baixo.** Mudanças focadas em cache e estabilidade de referência. Nenhuma alteração de lógica de negócio, RLS ou segurança. Cada mudança é isolada e reversível.

Único ponto de atenção: o passo 2 (popular `brand` via role no portal) precisa garantir que o usuário **só veja o brand do próprio role** — a defesa em profundidade do `useBrandGuard` (passo anterior) já protege contra leak.

## Estimativa

~10 min (4 arquivos principais + verificação de polling).

