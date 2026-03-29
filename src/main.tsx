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
