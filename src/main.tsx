import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initWebVitals } from "@/lib/webVitals";
import { initErrorTracker } from "@/lib/errorTracker";

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

// Limpa SWs sem reload
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

// Bootstrap with error protection
try {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("Root element not found");

  createRoot(rootEl).render(<App />);

  // NOTE: We do NOT remove the bootstrap-fallback here.
  // The fallback is now OUTSIDE #root and will be dismissed
  // by the MountSignal component inside <App /> via window.__dismissBootstrap().
} catch (err) {
  console.error("Bootstrap failed:", err);

  // Show recovery UI in the external overlay
  const spinner = document.getElementById("bootstrap-spinner");
  const errorDiv = document.getElementById("bootstrap-error");
  if (spinner) spinner.style.display = "none";
  if (errorDiv) {
    errorDiv.style.display = "block";
    errorDiv.innerHTML = `
      <p style="margin:0 0 12px;font-size:14px;">Falha ao carregar a aplicação.</p>
      <button onclick="window.location.reload()" style="background:#6d4aff;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:14px;cursor:pointer;">Recarregar</button>
    `;
  }
}
