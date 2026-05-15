/**
 * Entry point — mounts a minimal shell instantly, then lazy-loads App.
 * Sentry and web-vitals are deferred to avoid blocking the first render.
 */
console.info("[boot] main.tsx executing");
(window as any).__BOOT_PHASE__ = "MAIN_MODULE_START";

import "./index.css";
import { createRoot } from "react-dom/client";
import { Suspense, useEffect, Component, type ReactNode } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { installGlobalDomErrorRecovery } from "@/lib/pwaRecovery";
import { installRadixPointerEventsFix } from "@/lib/radixPointerEventsFix";
import { isWebviewLitePath, startMonitoring } from "@/lib/bootMonitoring";
import { installRouteDiagnostics } from "@/lib/routeDiagnostics";
import TelaCarregamento from "@/compartilhados/components/tela_carregamento";

// [TEMP] Desabilitado para diagnosticar tela preta — reativar após validação.
// Recuperação reativa apenas em erro real de chunk/import dinâmico.
// Não limpamos mais SW/caches em toda abertura — isso degradava o boot.
// installGlobalDomErrorRecovery();

// Fix global para travamento da UI causado pelo bug do Radix Dialog/Popover
// que deixa pointer-events:none no <body> ao fechar overlays em sequência.
installRadixPointerEventsFix();

// Diagnóstico por rota: expõe `window.__routeReport()` no console para
// inspecionar rapidamente em qual provider/loader uma rota travou.
// installRouteDiagnostics();

const App = lazyWithRetry(() => {
  console.info("[boot] App dynamic import started");
  (window as any).__BOOT_PHASE__ = "APP_IMPORT_START";
  return import("./App").then((m) => {
    console.info("[boot] App dynamic import succeeded");
    (window as any).__BOOT_PHASE__ = "APP_IMPORT_OK";
    // Warm-up dos chunks críticos da rota inicial em paralelo,
    // assim AppLayout e Dashboard já estão prontos quando o
    // ProtectedRoute liberar — evita "carregar em série".
    void import("@/components/AppLayout").catch(() => {});
    void import("@/pages/Dashboard").catch(() => {});
    return m;
  });
});

/**
 * Prefetch agressivo dos chunks do DriverPanel quando o usuário entra
 * via /driver ou /d/:brandId (link curto compartilhado em WebViews).
 * Dispara em paralelo ao import do App para que, no momento do redirect
 * de /d/:brandId → /driver, o bundle do painel já esteja em cache de rede.
 */
(function prefetchDriverPanel() {
  if (typeof window === "undefined") return;
  const p = window.location.pathname;
  // /d/<brandId> é redirect estático no index.html — só prefetch em /driver
  const isDriverRoute = p === "/driver" || p.startsWith("/driver/");
  if (!isDriverRoute) return;
  console.info("[boot] prefetch DriverPanelPage chunks");
  void import("@/pages/DriverPanelPage").catch(() => {});
  void import("@/components/driver/DriverMarketplace").catch(() => {});
  void import("@/components/driver/home/DriverHomePage").catch(() => {});
  void import("@/components/driver/DriverCpfLogin").catch(() => {});
})();

/* ── Error Boundary ── */

interface BootErrorState { hasError: boolean; error: Error | null; }

class BootErrorBoundary extends Component<{ children: ReactNode }, BootErrorState> {
  state: BootErrorState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    const showErr = (window as any).__showBootError;
    if (typeof showErr === "function") {
      showErr("APP_RENDER_ERROR", error.message);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0a2e", color: "#c4b5fd", fontFamily: "system-ui, sans-serif", padding: 24, textAlign: "center", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "#7c6faa" }}>APP_RENDER_ERROR</p>
          <p style={{ fontSize: 14 }}>{this.state.error?.message || "Erro ao renderizar a aplicação."}</p>
          <button onClick={() => window.location.reload()} style={{ background: "#6d4aff", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, cursor: "pointer" }}>Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Boot Shell ── */

function BootShell() {
  useEffect(() => {
    (window as any).__BOOT_PHASE__ = "APP_MOUNTED";
    (window as any).__APP_MOUNTED__ = true;
    console.info("[boot] APP_MOUNTED — dismissing overlay");
    if (typeof (window as any).__dismissBootstrap === "function") {
      (window as any).__dismissBootstrap();
    }

    // Webview leve: pula Sentry + web-vitals em /webview para reduzir
    // ainda mais o tempo de carregamento dentro de in-app browsers.
    const path = window.location.pathname;
    if (isWebviewLitePath(path)) {
      console.info("[boot] webview-lite mode — analytics/sentry desabilitados");
      return;
    }

    // Deferred: load Sentry + web-vitals after mount (non-blocking)
    const loadMonitoring = () => startMonitoring(path);
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(loadMonitoring);
    } else {
      setTimeout(loadMonitoring, 0);
    }
  }, []);

  return (
    <BootErrorBoundary>
      <Suspense fallback={<TelaCarregamento />}>
        <App />
      </Suspense>
    </BootErrorBoundary>
  );
}

/* ── Mount ── */

(window as any).__BOOT_PHASE__ = "REACT_MOUNT_START";
console.info("[boot] REACT_MOUNT_START");

const rootEl = document.getElementById("root");
if (!rootEl) {
  const showErr = (window as any).__showBootError;
  if (typeof showErr === "function") {
    showErr("NO_ROOT_ELEMENT", "Elemento #root não encontrado no HTML.");
  }
} else {
  try {
    const rootWindow = window as any;
    const root = rootWindow.__VALE_RESGATE_REACT_ROOT__ ?? createRoot(rootEl);
    rootWindow.__VALE_RESGATE_REACT_ROOT__ = root;
    root.render(<BootShell />);
    console.info("[boot] render() called");
  } catch (err: any) {
    console.error("[boot] render crash", err);
    const showErr = (window as any).__showBootError;
    if (typeof showErr === "function") {
      showErr("RENDER_CRASH", err?.message || String(err));
    }
  }
}
