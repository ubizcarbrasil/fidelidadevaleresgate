function buildCacheBustedUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("v", String(Date.now()));
  return url.toString();
}

export async function clearRuntimeCaches() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)));
  }

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey).catch(() => false)));
  }
}

export async function recoverFromChunkError() {
  try {
    await clearRuntimeCaches();
  } finally {
    window.location.replace(buildCacheBustedUrl());
  }
}

export function disableRuntimeCachesOnBoot() {
  void clearRuntimeCaches();
}

/**
 * Detecta se uma mensagem de erro indica problema de DOM/cache do PWA.
 * Inclui: chunk loading errors, removeChild/insertBefore (DOM dessincronizado).
 */
export function isRecoverableDomError(message: string | undefined | null): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("failed to fetch dynamically imported module") ||
    m.includes("importing a module script failed") ||
    m.includes("error loading dynamically imported module") ||
    m.includes("loading chunk") ||
    m.includes("loading css chunk") ||
    m.includes("removechild") ||
    m.includes("insertbefore") ||
    (m.includes("not a child of this node"))
  );
}

const RECOVERY_FLAG = "__pwa_auto_recovered_at__";
const RECOVERY_COOLDOWN_MS = 60_000;

/**
 * Auto-recover global: ao detectar erro de DOM/cache, limpa SW + caches e recarrega.
 * Usa cooldown via sessionStorage para não entrar em loop de reload.
 */
export function installGlobalDomErrorRecovery() {
  if (typeof window === "undefined") return;

  const tryRecover = (message: string | undefined) => {
    if (!isRecoverableDomError(message)) return;
    try {
      const last = Number(sessionStorage.getItem(RECOVERY_FLAG) || "0");
      if (Date.now() - last < RECOVERY_COOLDOWN_MS) return;
      sessionStorage.setItem(RECOVERY_FLAG, String(Date.now()));
    } catch {
      // ignore storage failures
    }
    void recoverFromChunkError();
  };

  window.addEventListener("error", (event) => {
    tryRecover(event?.message || event?.error?.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const msg = typeof reason === "string" ? reason : reason?.message;
    tryRecover(msg);
  });
}