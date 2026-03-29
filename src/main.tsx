import "./index.css";
import { initWebVitals } from "@/lib/webVitals";
import { initErrorTracker } from "@/lib/errorTracker";
import { setBootPhase } from "@/lib/bootStateCore";

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
  try {
    setBootPhase("BOOTSTRAP", "importing App");
    const rootEl = document.getElementById("root");
    if (!rootEl) throw new Error("Root element not found");

    const [{ createRoot }, { default: App }] = await Promise.all([
      import("react-dom/client"),
      import(/* @vite-ignore */ "./App.tsx?t=" + Date.now()),
    ]);

    createRoot(rootEl).render(<App />);
  } catch (err) {
    setBootPhase("FAILED", String(err));
    console.error("Bootstrap failed:", err);
    showBootstrapError("Falha ao carregar a aplicação.");
  }
}

void bootstrap();
