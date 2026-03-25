

## Etapa 1 — Estado global de boot com fases observáveis

### Objetivo
Criar um módulo centralizado (`bootState`) que rastreia cada fase da inicialização com logs explícitos, sem alterar guards, redirects ou lógica de negócio.

### Arquivos alterados (4 arquivos, mudanças mínimas)

**1. Novo: `src/lib/bootState.ts`**
Módulo singleton com estado de boot e logging:
```typescript
export type BootPhase =
  | "BOOTSTRAP"    // main.tsx carregou, App.tsx importado
  | "AUTH_LOADING"  // AuthProvider iniciando restauração
  | "AUTH_READY"    // AuthProvider resolveu sessão (ou timeout)
  | "BRAND_LOADING" // BrandProvider resolvendo marca
  | "BRAND_READY"   // BrandProvider resolveu
  | "APP_MOUNTED"   // MountSignal executou
  | "FAILED";       // Erro fatal

let currentPhase: BootPhase = "BOOTSTRAP";
const listeners: Array<(phase: BootPhase) => void> = [];

export function setBootPhase(phase: BootPhase, detail?: string) {
  currentPhase = phase;
  const ts = (performance.now() / 1000).toFixed(2);
  console.info(`[boot] ${ts}s → ${phase}${detail ? ` (${detail})` : ""}`);
  listeners.forEach(fn => fn(phase));
}

export function getBootPhase() { return currentPhase; }
export function onBootPhase(fn: (phase: BootPhase) => void) {
  listeners.push(fn);
  return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
}
```

**2. `src/main.tsx` — marcar fase BOOTSTRAP**
Adicionar 2 linhas:
```diff
+ import { setBootPhase } from "@/lib/bootState";

  async function bootstrap() {
    try {
+     setBootPhase("BOOTSTRAP", "importing App");
      const rootEl = document.getElementById("root");
      ...
      createRoot(rootEl).render(<App />);
    } catch (err) {
+     setBootPhase("FAILED", String(err));
      console.error("Bootstrap failed:", err);
      showBootstrapError(...);
    }
  }
```

**3. `src/contexts/AuthContext.tsx` — marcar fases AUTH**
Adicionar 3 linhas dentro do `useEffect` existente:
```diff
+ import { setBootPhase } from "@/lib/bootState";

  const bootstrap = async () => {
+   setBootPhase("AUTH_LOADING");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      ...
    } finally {
      if (mountedRef.current) {
        setLoading(false);
+       setBootPhase("AUTH_READY");
      }
    }
  };
```
No timeout de segurança:
```diff
  if (mountedRef.current && !initialLoadDone) {
+   setBootPhase("AUTH_READY", "timeout");
    setLoading(false);
  }
```

**4. `src/contexts/BrandContext.tsx` — marcar fases BRAND**
Adicionar 2 linhas nos pontos onde `loading` muda para `false`:
```diff
+ import { setBootPhase } from "@/lib/bootState";

  // No início da resolução:
+ setBootPhase("BRAND_LOADING");

  // Quando loading = false (sucesso ou erro):
+ setBootPhase("BRAND_READY");
```

**5. `src/components/MountSignal.tsx` — marcar APP_MOUNTED**
Adicionar 1 linha:
```diff
+ import { setBootPhase } from "@/lib/bootState";

  useEffect(() => {
+   setBootPhase("APP_MOUNTED");
    (window as any).__APP_MOUNTED__ = true;
    ...
  }, []);
```

**6. `src/components/ErrorBoundary.tsx` — marcar FAILED**
Adicionar 1 linha no `componentDidCatch`:
```diff
+ import { setBootPhase } from "@/lib/bootState";

  componentDidCatch(error, errorInfo) {
+   setBootPhase("FAILED", error.message);
    reportError({