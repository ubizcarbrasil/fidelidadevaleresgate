(window as any).__BOOT_PHASE__ = "MAIN_MODULE_START";
console.info("[boot] MAIN_MODULE_START");

import "./index.css";
import { setBootPhase } from "@/lib/bootStateCore";
import { createRoot } from "react-dom/client";
import { Suspense, lazy, useEffect } from "react";
import { Loader2 } from "lucide-react";

// Lazy-load the heavy App module — keeps shell mount instant
const App = lazy(() => import("./App"));

/**
 * Minimal shell: mounts instantly, dismisses bootstrap overlay,
 * then lazy-loads the full application with an internal loader.
 */
function BootShell() {
  useEffect(() => {
    setBootPhase("APP_MOUNTED");
    (window as any).__APP_MOUNTED__ = true;
    if (typeof (window as any).__dismissBootstrap === "function") {
      (window as any).__dismissBootstrap();
    }
  }, []);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <App />
    </Suspense>
  );
}

setBootPhase("BOOTSTRAP");

const rootEl = document.getElementById("root");
if (!rootEl) {
  console.error("[boot] #root não encontrado");
} else {
  const root = createRoot(rootEl);
  root.render(<BootShell />);
}
