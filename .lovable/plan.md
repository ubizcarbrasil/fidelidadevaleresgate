

## Etapa 3 — Guards aguardam boot resolvido antes de redirecionar

### Problema atual

Os três guards (`ProtectedRoute`, `RootGuard`, `ModuleGuard`) dependem apenas do seu próprio estado de loading local. Quando auth termina mas brand ainda não resolveu, ou quando modules ainda estão carregando durante o boot, os guards podem redirecionar prematuramente (ex: `Navigate to="/"` porque `isModuleEnabled` retorna `false` enquanto dados ainda não chegaram).

Isso causa telas brancas: o redirect acontece, a página destino também está em estado parcial, e o ciclo se repete.

### Solução

Adicionar um hook `useBootReady()` que lê o `bootState` e retorna `true` somente quando a fase é `BRAND_READY`, `APP_MOUNTED` ou `FAILED`. Enquanto o boot não estiver resolvido, os guards renderizam um spinner estável — **nunca** um `Navigate`.

### Mudanças (4 arquivos)

**1. `src/lib/bootState.ts` — adicionar `useBootReady` hook**

```typescript
import { useSyncExternalStore } from "react";

// Fases que indicam "boot resolvido"
const RESOLVED: Set<BootPhase> = new Set(["BRAND_READY", "APP_MOUNTED", "FAILED"]);

export function isBootResolved(): boolean {
  return RESOLVED.has(currentPhase);
}

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => { const i = listeners.indexOf(cb); if (i >= 0) listeners.splice(i, 1); };
}

export function useBootReady(): boolean {
  return useSyncExternalStore(subscribe, isBootResolved, isBootResolved);
}
```

Usa `useSyncExternalStore` para integrar com React sem criar novo contexto.

**2. `src/components/ProtectedRoute.tsx`**

```typescript
import { useBootReady } from "@/lib/bootState";

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const bootReady = useBootReady();

  // Enquanto boot OU auth não resolveram → spinner estável
  if (!bootReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
```

**3. `src/components/RootGuard.tsx`**

```typescript
import { useBootReady } from "@/lib/bootState";

export default function RootGuard({ children }) {
  const { isRootAdmin, loading } = useAuth();
  const bootReady = useBootReady();

  if (!bootReady || loading) {
    return (/* spinner */);
  }

  if (!isRootAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
```

**4. `src/components/ModuleGuard.tsx`**

```typescript
import { useBootReady } from "@/lib/bootState";

export default function ModuleGuard({ moduleKey, children }) {
  const { isModuleEnabled, isLoading } = useBrandModules();
  const bootReady = useBootReady();

  if (!bootReady || isLoading) {
    return (/* spinner */);
  }

  if (!isModuleEnabled(moduleKey)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
```

### Como funciona

| Situação | Antes | Depois |
|---|---|---|
| Auth resolveu, brand ainda não | Guard podia redirecionar (módulos não carregados = `false`) | Spinner estável até `BRAND_READY` |
| Boot completo | Redirect normal | Redirect normal (sem mudança) |
| Boot falhou | Ficava em limbo | `FAILED` é resolvido → guard avalia normalmente, ErrorBoundary cuida do resto |

### Condição que bloqueia redirects prematuros
```typescript
if (!bootReady || loading) → renderiza spinner, NUNCA Navigate
```
`bootReady` só é `true` quando `bootState` atingiu `BRAND_READY`, `APP_MOUNTED` ou `FAILED`.

### O que NÃO muda
- `AuthContext.tsx` — sem alteração
- `BrandContext.tsx` — sem alteração
- `App.tsx` — sem alteração
- Layout, pág