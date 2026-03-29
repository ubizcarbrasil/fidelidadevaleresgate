import "./index.css";
import { createRoot, type Root } from "react-dom/client";
import { initWebVitals } from "@/lib/webVitals";
import { initErrorTracker } from "@/lib/errorTracker";
import { setBootPhase } from "@/lib/bootStateCore";
import MountSignal from "@/components/MountSignal";

// rebuild 2026-03-29
// Marcador precoce — executa assim que os imports leves resolvem
(window as any).__BOOT_PHASE__ = "MAIN_MODULE_START";
console.info("[boot] MAIN_MODULE_START");

function showBootstrapError(message = "Falha ao carregar a aplicação.") {
  const spinner = document.getElementById("bootstrap-spinner");
  const errorDiv = document.getElementById("bootstrap-error");
  if (spinner) spinner.style.display = "none";
  if (errorDiv) {
    errorDiv.style.display = "block";
    errorDiv.innerHTML = `
      <p style="margin:0 0 12px;font-size:14px;">${message}</p>
      <button onclick="window.location.reload()" style="background:#6d4aff;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:14px;cursor:pointer;">Recarregar</button>
    `;
  }
}

function BootFallback() {
  return (
    <div className="min-h-screen bg-background text-muted-foreground flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-muted border-t-primary animate-spin" />
        <p className="text-sm">Carregando aplicação…</p>
      </div>
    </div>
  );
}

function BootError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-sm text-center space-y-4">
        <p className="text-base">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Recarregar
        </button>
      </div>
    </div>
  );
}

/**
 * Detecta se estamos em ambiente de preview (iframe do Lovable).
 */
function isPreviewHost(): boolean {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return (
    hostname.includes("lovableproject.com") ||
    hostname.includes("lovable.app") ||
    hostname.includes("preview--")
  );
}

async function cleanupServiceWorkers() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length > 0) {
      await Promise.all(registrations.map((r) => r.unregister()));
      if ("caches" in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((k) => caches.delete(k)));
      }
    }

    if (!isPreviewHost()) {
      for (const reg of registrations) {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      }
    }
  } catch (error) {
    console.warn("Falha ao gerenciar service workers", error);
  }
}

// /index normalization moved to index.html loader

void cleanupServiceWorkers();
initErrorTracker();
initWebVitals();

if (typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      console.warn("Cannot remove a child from a different parent", child, this);
      return child;
    }
    return originalRemoveChild.apply(this, [child]) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      console.warn("Cannot insert before a reference node from a different parent", referenceNode, this);
      return newNode;
    }
    return originalInsertBefore.apply(this, [newNode, referenceNode]) as T;
  };
}

async function bootstrap() {
  let root: Root | null = null;

  try {
    setBootPhase("BOOTSTRAP", "rendering shell");
    const rootEl = document.getElementById("root");
    if (!rootEl) throw new Error("Root element not found");

    root = createRoot(rootEl);
    root.render(
      <>
        <MountSignal />
        <BootFallback />
      </>
    );

    setBootPhase("BOOTSTRAP", "importing App");
    const { default: App } = await import("./App.tsx");
    root.render(<App />);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao carregar a aplicação.";
    setBootPhase("FAILED", String(message));
    console.error("Bootstrap failed:", err);

    if (root) {
      root.render(<BootError message="Falha ao carregar a aplicação." />);
      return;
    }

    showBootstrapError("Falha ao carregar a aplicação.");
  }
}

void bootstrap();
