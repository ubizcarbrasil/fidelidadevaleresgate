

# Teste de isolamento — bootstrap mínimo

## O que será feito

Substituir temporariamente `src/main.tsx` por um arquivo mínimo que:

1. Define `window.__BOOT_PHASE__ = "MAIN_MODULE_START"` imediatamente
2. Importa apenas `react` e `react-dom/client`
3. Renderiza um `<div>` estático com "Teste mínimo carregado"
4. Chama `window.__dismissBootstrap()` para remover o overlay
5. Zero imports do app (sem App, providers, Supabase, contexts, guards, trackers)

## Arquivo alterado: `src/main.tsx`

Conteúdo completo temporário:

```tsx
(window as any).__BOOT_PHASE__ = "MAIN_MODULE_START";
console.info("[boot] MAIN_MODULE_START — teste de isolamento");

import { createRoot } from "react-dom/client";

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f0a2e",
      color: "#c4b5fd",
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      fontWeight: 600,
    }}>
      Teste mínimo carregado
    </div>
  );
  (window as any).__dismissBootstrap?.();
  (window as any).__BOOT_PHASE__ = "APP_MOUNTED";
  console.info("[boot] APP_MOUNTED — teste de isolamento concluído");
} else {
  console.error("[boot] #root não encontrado");
}
```

## Diagnóstico esperado

| Resultado | Significado |
|---|---|
| Tela aparece consistentemente | Problema está no grafo de módulos da app (imports pesados, circular deps, etc.) |
| Ainda trava em ENTRY_LOADING | Problema está no ambiente Vite/preview/Lovable, não no código |

## Escopo

- Apenas `src/main.tsx` — nenhum outro arquivo tocado
- Mudança temporária, será revertida após o diagnóstico

