import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initWebVitals } from "@/lib/webVitals";
import { initErrorTracker } from "@/lib/errorTracker";

/**
 * Detecta se estamos em ambiente de preview (iframe do Lovable).
 * Nesses casos, desabilita completamente o service worker e cache PWA
 * para evitar ciclos de reload e tela branca.
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

    // Para hosts não-preview: gerenciar SW updates normalmente
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

// Normalize /index or /index.html to / before React mounts
if (
  typeof window !== "undefined" &&
  (window.location.pathname === "/index" ||
    window.location.pathname === "/index.html" ||
    window.location.pathname === "/index/")
) {
  const newUrl = "/" + window.location.search + window.location.hash;
  window.history.replaceState(null, "", newUrl);
}

// Limpa SWs sem reload — NUNCA forçar window.location.reload()
void cleanupServiceWorkers();
initErrorTracker();
initWebVitals();

// Fix React 18 "removeChild" error caused by third-party DOM manipulation
if (typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (console) {
        console.warn("Cannot remove a child from a different parent", child, this);
      }
      return child;
    }
    return originalRemoveChild.apply(this, [child]) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) {
        console.warn("Cannot insert before a reference node from a different parent", referenceNode, this);
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, [newNode, referenceNode]) as T;
  };
}

// Mount React and remove bootstrap fallback only after successful render
try {
  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);

  // Signal successful mount — clears the timeout in index.html
  window.__APP_READY__ = true;
  if ((window as any).__BOOTSTRAP_TIMER__) {
    clearTimeout((window as any).__BOOTSTRAP_TIMER__);
  }
  const fallback = document.getElementById("bootstrap-fallback");
  if (fallback) fallback.remove();
} catch (err) {
  console.error("Bootstrap mount failed:", err);
  // Let the index.html timeout handler show the reload button
}
