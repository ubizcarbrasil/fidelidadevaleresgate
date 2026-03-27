

## Diagnóstico e correção: boot preso em ENTRY_LOADING

### Análise do código atual

O `main.tsx` tem estes imports estáticos (linhas 1-5):

```text
main.tsx (TUDO deve resolver antes de qualquer linha executar)
  ├── react-dom/client  → React + ReactDOM inteiros (~150+ sub-módulos em dev/ESM)
  ├── ./index.css
  ├── @/lib/webVitals   → @/lib/logger
  ├── @/lib/errorTracker → @/lib/logger
  └── @/lib/bootState   → react (useSyncExternalStore)
```

Em modo ESM (Vite dev / preview), **cada import é uma requisição HTTP separada**. O `react-dom/client` sozinho puxa centenas de sub-módulos. Nenhuma linha de `main.tsx` executa até que TODO esse grafo resolva — incluindo a chamada `bootstrap()` na linha 121 que faz `setBootPhase("BOOTSTRAP")`.

### Causa raiz

O `createRoot` (de `react-dom/client`) é importado estaticamente na linha 1, mas só é usado dentro de `bootstrap()` na linha 113. Isso força o carregamento de React + ReactDOM inteiros **antes** de qualquer código executar, incluindo o `setBootPhase("BOOTSTRAP")`.

Em conexões lentas ou quando o servidor demora a servir os módulos, a fase fica travada em `ENTRY_LOADING` indefinidamente.

### Correção mínima — `src/main.tsx`

**Duas mudanças:**

1. **Remover o import estático de `react-dom/client`** e movê-lo para dynamic import dentro de `bootstrap()`
2. **Adicionar marcadores de fase granulares** logo no início do módulo para diagnóstico

```typescript
// ANTES (linha 1):
import { createRoot } from "react-dom/client";

// DEPOIS: remover linha 1, e dentro de bootstrap():
async function bootstrap() {
  try {
    setBootPhase("BOOTSTRAP", "importing App");
    const rootEl = document.getElementById("root");
    if (!rootEl) throw new Error("Root element not found");

    const [{ createRoot }, { default: App }] = await Promise.all([
      import("react-dom/client"),
      import("./App.tsx"),
    ]);

    createRoot(rootEl).render(<App />);
  } catch (err) { ... }
}
```

E no topo do módulo, logo após os imports leves:

```typescript
// Marcador precoce — executa assim que os imports leves resolvem
(window as any).__BOOT_PHASE__ = "MAIN_MODULE_START";
console.info("[boot] MAIN_MODULE_START");
```

### Resultado esperado

Com esta mudança, os imports estáticos de `main.tsx` ficam apenas:
- `./index.css` (CSS