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
  // Se o app JÁ MONTOU (boot completou), evitamos reload completo.
  // Erros isolados pós-mount podem ser tratados pelo BotaoAtualizarApp
  // (notificação discreta), em vez de derrubar a sessão inteira.
  //
  // Reload via location.replace só faz sentido DURANTE o boot, quando o
  // app ainda não consegue se recuperar sozinho. Pós-mount, vira sintoma
  // pior que a doença — usuário perde estado, scroll, formulário aberto.
  const appJaMontou =
    typeof window !== "undefined" &&
    Boolean((window as unknown as Record<string, unknown>).__APP_MOUNTED__);

  if (appJaMontou) {
    console.warn(
      "[pwaRecovery] chunk error pós-mount — não recarregando (preserva sessão)",
    );
    showRecoveryOverlay();
    // Limpeza de caches em background, mas SEM reload automático.
    // O overlay fica até o usuário interagir (refresh manual ou navegar).
    try {
      await clearRuntimeCaches();
    } catch {
      /* ignore */
    }
    return;
  }

  // Boot: comportamento original — overlay + schedule reload.
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
 *
 * Visual alinhado ao TelaCarregamento (mesmo bg, mesmo anel, mesmo logo)
 * para que o usuário não perceba "mudança de tela" durante o boot — só
 * uma transição suave. Mensagem NÃO é alarmista ("Detectamos versão...")
 * — só "Sincronizando…" porque na maioria dos casos é boot normal com
 * um chunk em transição entre SW v10→v11, não erro real.
 */
function showRecoveryOverlay() {
  if (typeof document === "undefined") return;
  if (document.getElementById("__pwa_recovery_overlay__")) return;
  const el = document.createElement("div");
  el.id = "__pwa_recovery_overlay__";
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:2147483647",
    "display:flex",
    "flex-direction:column",
    "align-items:center",
    "justify-content:center",
    "gap:24px",
    "background:#0f1729", // === bg-background do tema (hsl(222 47% 11%))
    "color:#e2e8f0",
    "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
    "text-align:center",
    "padding:24px",
  ].join(";");
  el.innerHTML = `
    <style>
      @keyframes __pwa_spin{to{transform:rotate(360deg)}}
      @keyframes __pwa_pulse{0%,100%{opacity:0.85;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
      @keyframes __pwa_bar{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}
      #__pwa_recovery_overlay__ .bar-track{position:absolute;top:0;left:0;right:0;height:2px;overflow:hidden}
      #__pwa_recovery_overlay__ .bar-fill{display:block;height:100%;width:33%;border-radius:9999px;background:linear-gradient(90deg,rgba(59,130,246,0) 0%,#3b82f6 50%,rgba(59,130,246,0) 100%);animation:__pwa_bar 1.4s cubic-bezier(0.4,0,0.2,1) infinite}
      @media (prefers-reduced-motion: reduce){
        #__pwa_recovery_overlay__ svg,#__pwa_recovery_overlay__ img,#__pwa_recovery_overlay__ .bar-fill{animation:none !important}
      }
    </style>
    <div class="bar-track"><span class="bar-fill"></span></div>
    <div style="position:relative;width:96px;height:96px;display:flex;align-items:center;justify-content:center">
      <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true" style="animation:__pwa_spin 1.1s linear infinite">
        <defs>
          <linearGradient id="__pwa_grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="1"/>
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.15"/>
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r="45" fill="none" stroke="rgba(59,130,246,0.08)" stroke-width="3"/>
        <circle cx="48" cy="48" r="45" fill="none" stroke="url(#__pwa_grad)" stroke-width="3" stroke-linecap="round" stroke-dasharray="99 283"/>
      </svg>
      <img src="/logo-vale-resgate.png" alt="" aria-hidden="true" style="position:absolute;width:48px;height:48px;border-radius:9999px;object-fit:contain;animation:__pwa_pulse 2.4s ease-in-out infinite"/>
    </div>
    <p style="max-width:280px;font-size:14px;font-weight:500;color:#94a3b8;margin:0">Sincronizando…</p>
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