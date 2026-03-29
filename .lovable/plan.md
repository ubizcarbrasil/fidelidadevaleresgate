

# Restaurar src/main.tsx real do projeto

## Contexto

O `src/main.tsx` está com o código do teste de isolamento (render estático). Precisa ser restaurado para o bootstrap real que importa e renderiza `App.tsx`.

O cache stale do `index.html` já foi corrigido na mensagem anterior (cache-bust + limpeza do `.vite`), então o import literal `import("/src/main.tsx")` deve funcionar agora.

## Arquivo alterado: `src/main.tsx`

Restaurar com o bootstrap progressivo que:

1. Define `__BOOT_PHASE__ = "MAIN_MODULE_START"` imediatamente
2. Importa `bootStateCore` e sinaliza `BOOTSTRAP`
3. Importa `react-dom/client` e renderiza um shell mínimo (spinner) para dismissar o overlay rapidamente
4. Carrega `App.tsx` via `import("./App.tsx")` dinâmico e substitui o shell
5. Trata erros com UI de fallback

```tsx
(window as any).__BOOT_PHASE__ = "MAIN_MODULE_START";
console.info("[boot] MAIN_MODULE_START");

import { setBootPhase } from "@/lib/bootStateCore";
import { createRoot } from "react-dom/client";

setBootPhase("BOOTSTRAP");

const rootEl = document.getElementById("root");
if (!rootEl) {
  console.error("[boot] #root não encontrado");
} else {
  const root = createRoot(rootEl);

  // Shell mínimo — dismissa overlay imediatamente
  root.render(
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f0a2e",
      color: "#c4b5fd",
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
    }}>
      Carregando aplicação…
    </div>
  );
  (window as any).__dismissBootstrap?.();

  // Carrega App real
  import("./App.tsx")
    .then(({ default: App }) => {
      root.render(<App />);
    })
    .catch((err) => {
      console.error("[boot] Falha ao carregar App", err);
      setBootPhase("FAILED", err?.message);
      root.render(
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0a2e",
          color: "#c4b5fd",
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
          gap: "12px",
        }}>
          <p>Falha ao carregar a aplicação.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#6d4aff",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 24px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Recarregar
          </button>
        </div>
      );
    });
}
```

## Escopo

- Apenas `src/main.tsx` — nenhum outro arquivo tocado
- Após restaurar, verificar console/preview para confirmar boot

