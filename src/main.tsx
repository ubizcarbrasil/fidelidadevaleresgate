import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initWebVitals } from "@/lib/webVitals";
import { initErrorTracker } from "@/lib/errorTracker";

async function clearPreviewPwaCache() {
  if (typeof window === "undefined") return;

  const hostname = window.location.hostname;
  const isPreviewHost =
    hostname.includes("lovableproject.com") ||
    hostname.includes("lovable.app") ||
    hostname.includes("preview--");
  if (!("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    // On preview hosts, always unregister all SWs and clear caches
    if (isPreviewHost && registrations.length > 0) {
      await Promise.all(registrations.map((r) => r.unregister()));

      if ("caches" in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((k) => caches.delete(k)));
      }

      if (!sessionStorage.getItem("__preview_sw_reset__")) {
        sessionStorage.setItem("__preview_sw_reset__", "1");
        window.location.reload();
        return;
      }
    }

    // For all hosts: tell any active SW to skipWaiting so new version activates immediately
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
  } catch (error) {
    console.warn("Falha ao limpar cache PWA no preview", error);
  }
}

void clearPreviewPwaCache();
initWebVitals();

// Fix React 18 "removeChild" error caused by third-party DOM manipulation
// https://github.com/facebook/react/issues/11538#issuecomment-417504600
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

createRoot(document.getElementById("root")!).render(
  <App />
);
