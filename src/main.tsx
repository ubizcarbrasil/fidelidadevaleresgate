/**
 * Entry point — mounts a minimal shell instantly, then lazy-loads App.
 * Each phase is instrumented so failures are visible in the bootstrap overlay.
 */
console.info("[boot] main.tsx executing");
(window as any).__BOOT_PHASE__ = "MAIN_MODULE_START";

import { initSentry } from "@/lib/sentry";
initSentry();

import { reportWebVitals } from "@/lib/webVitals";
reportWebVitals();

import "./index.css";
import { createRoot } from "react-dom/client";
import { Suspense, useEffect, Component, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const App = lazyWithRetry(() => {
  console.info("[boot] App dynamic import started");
  (window as any).__BOOT_PHASE__ = "APP_IMPORT_START";
  return import("./App").then((m) => {
    console.info("[boot] App dynamic import succeeded");
    (window as any).__BOOT_PHASE__ = "APP_IMPORT_OK";
    return m;
  });
});

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
  }, []);

  return (
    <BootErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
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
    const root = createRoot(rootEl);
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
