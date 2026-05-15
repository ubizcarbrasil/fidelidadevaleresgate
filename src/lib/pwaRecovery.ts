function buildCacheBustedUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("v", String(Date.now()));
  return url.toString();
}

const CACHE_OPERATION_TIMEOUT_MS = 1_500;
const RECOVERY_RELOAD_DELAY_MS = 900;
const RECOVERY_RELOAD_FLAG = "__pwa_recovery_reload_scheduled__";

function withTimeout<T>(promise: Promise<T>, timeoutMs = CACHE_OPERATION_TIMEOUT_MS): Promise<T | null> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(null);
    }, timeoutMs);

    promise
      .then((value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(null);
      });
  });
}

function scheduleRecoveryReload() {
  if ((window as unknown as Record<string, boolean>)[RECOVERY_RELOAD_FLAG]) return;
  (window as unknown as Record<string, boolean>)[RECOVERY_RELOAD_FLAG] = true;
  window.setTimeout(() => {
    window.location.replace(buildCacheBustedUrl());
  }, RECOVERY_RELOAD_DELAY_MS);
}

export async function clearRuntimeCaches() {
  if ("serviceWorker" in navigator) {
    const registrations = await withTimeout(navigator.serviceWorker.getRegistrations());
    await Promise.all(
      (registrations ?? []).map((registration) =>
        withTimeout(registration.unregister()).catch(() => false),
      ),
    );
  }

  if ("caches" in window) {
    const cacheKeys = await withTimeout(caches.keys());
    await Promise.all(
      (cacheKeys ?? []).map((cacheKey) =>
        withTimeout(caches.delete(cacheKey)).catch(() => false),
      ),
    );
  }
}

export async function recoverFromChunkError() {
  showRecoveryOverlay();
  // Agenda o reload antes da limpeza: em iOS/PWA algumas APIs de cache/SW
  // podem travar indefinidamente, deixando o usuário preso no overlay.
  scheduleRecoveryReload();
  try {
    await clearRuntimeCaches();
  } catch {
    // O reload já está agendado; falhas na limpeza não devem bloquear a abertura.
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
    m.includes("object can not be found here") ||
    m.includes("object cannot be found here") ||
    m.includes("node could not be found") ||
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
    // Em dev, erros de removeChild/insertBefore vêm do React Fast Refresh
    // após HMR. Limpar SW + caches é exagero e pode loopar com o HMR —
    // basta um reload simples.
    const m = (message || "").toLowerCase();
    const isHmrDomGlitch =
      import.meta.env?.DEV &&
      (m.includes("removechild") ||
        m.includes("insertbefore") ||
        m.includes("not a child of this node"));
    if (isHmrDomGlitch) {
      window.location.reload();
      return;
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