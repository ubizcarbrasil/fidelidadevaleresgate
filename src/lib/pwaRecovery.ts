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
    showRecoveryOverlay();
    await clearRuntimeCaches();
  } finally {
    // Pequeno atraso para o usuário enxergar o aviso antes do reload.
    setTimeout(() => {
      window.location.replace(buildCacheBustedUrl());
    }, 900);
  }
}

/**
 * Mostra um overlay leve avisando que a página está sendo atualizada.
 * Usa DOM puro (sem React) porque é chamado quando o app pode estar quebrado.
 */
function showRecoveryOverlay() {
  if (typeof document === "undefined") return;
  if (document.getElementById("__pwa_recovery_overlay__")) return;
  const el = document.createElement("div");
  el.id = "__pwa_recovery_overlay__";
  el.setAttribute("role", "alert");
  el.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:2147483647",
    "display:flex",
    "flex-direction:column",
    "align-items:center",
    "justify-content:center",
    "gap:16px",
    "background:rgba(10,10,26,0.96)",
    "color:#e8edf3",
    "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
    "text-align:center",
    "padding:24px",
  ].join(";");
  el.innerHTML = `
    <div style="width:42px;height:42px;border:3px solid rgba(255,255,255,0.15);border-top-color:#7dd3fc;border-radius:50%;animation:__pwa_spin 0.9s linear infinite"></div>
    <div style="font-size:16px;font-weight:600">Atualizando o aplicativo…</div>
    <div style="font-size:13px;color:#94a3b8;max-width:280px">Detectamos uma versão antiga em cache. Recarregando com a versão mais recente.</div>
    <style>@keyframes __pwa_spin{to{transform:rotate(360deg)}}</style>
  `;
  document.body.appendChild(el);
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
 * Fonte única de verdade para decidir se podemos disparar uma recuperação
 * agora. Compartilhada por lazyWithRetry, installGlobalDomErrorRecovery e
 * qualquer outro ponto que precise recuperar de chunk stale — evita que
 * o HTML bootstrap, o lazy import e o hook PWA disparem reloads em cadeia.
 */
export function canAttemptRecovery(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RECOVERY_FLAG) || "0");
    if (Date.now() - last < RECOVERY_COOLDOWN_MS) return false;
    sessionStorage.setItem(RECOVERY_FLAG, String(Date.now()));
    return true;
  } catch {
    return true;
  }
}

/**
 * Auto-recover global: ao detectar erro de DOM/cache, limpa SW + caches e recarrega.
 * Usa cooldown via sessionStorage para não entrar em loop de reload.
 */
export function installGlobalDomErrorRecovery() {
  if (typeof window === "undefined") return;

  const tryRecover = (message: string | undefined) => {
    if (!isRecoverableDomError(message)) return;
    if (!canAttemptRecovery()) return;
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