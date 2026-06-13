/**
 * pwaRecovery — recovery global de chunk errors + DOM dessincronizado.
 *
 * Bug aqui = boot loops (reload em loop), recovery não dispara em
 * cenários reais, OU recovery dispara em dev quando deveria ser HMR
 * simples.
 *
 * Cobre as funções públicas:
 *   - isRecoverableDomError (pure, 100% cobertura)
 *   - canAttemptRecovery (cooldown 60s via sessionStorage)
 *   - clearRuntimeCaches (SW unregister + cache delete com timeout)
 *   - recoverFromChunkError (orquestrador)
 *
 * installGlobalDomErrorRecovery NÃO é testado aqui — depende muito de
 * import.meta.env.DEV e bind real de window event listeners. Caso futuro
 * separado.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isRecoverableDomError,
  canAttemptRecovery,
  clearRuntimeCaches,
  recoverFromChunkError,
} from "../pwaRecovery";

// ── isRecoverableDomError ────────────────────────────────
describe("isRecoverableDomError", () => {
  it.each([
    "Failed to fetch dynamically imported module",
    "FAILED to fetch dynamically imported module", // case insensitive
    "Importing a module script failed",
    "error loading dynamically imported module",
    "Loading chunk 5 failed",
    "Loading CSS chunk app failed",
    "Cannot read property removeChild of null",
    "Failed insertBefore on Node",
    "The object can not be found here",  // Safari iOS specific
    "The object cannot be found here.",  // alternate spelling
    "Node could not be found",
    "Not a child of this node",
  ])("detecta '%s'", (msg) => {
    expect(isRecoverableDomError(msg)).toBe(true);
  });

  it.each([
    "TypeError: foo is undefined",
    "Network request failed",
    "503 Service Unavailable",
    "Cross-origin error",
    "",
  ])("NÃO detecta erro genérico '%s'", (msg) => {
    expect(isRecoverableDomError(msg)).toBe(false);
  });

  it("aceita null/undefined sem throw", () => {
    expect(isRecoverableDomError(null)).toBe(false);
    expect(isRecoverableDomError(undefined)).toBe(false);
  });
});

// ── canAttemptRecovery ───────────────────────────────────
describe("canAttemptRecovery", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("primeira chamada: retorna true + marca timestamp em sessionStorage", () => {
    const result = canAttemptRecovery();
    expect(result).toBe(true);
    expect(sessionStorage.getItem("__pwa_auto_recovered_at__")).not.toBeNull();
  });

  it("segunda chamada imediata: retorna false (dentro do cooldown 60s)", () => {
    canAttemptRecovery();
    expect(canAttemptRecovery()).toBe(false);
  });

  it("após cooldown expirar: retorna true novamente", () => {
    // Simula 1h atrás (>> cooldown de 60s)
    sessionStorage.setItem(
      "__pwa_auto_recovered_at__",
      String(Date.now() - 3_600_000),
    );
    expect(canAttemptRecovery()).toBe(true);
  });

  it("sessionStorage inacessível (private mode): retorna true (graceful)", () => {
    // Quebra o sessionStorage temporariamente
    const orig = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("SecurityError");
    };
    try {
      expect(canAttemptRecovery()).toBe(true);
    } finally {
      Storage.prototype.getItem = orig;
    }
  });
});

// ── clearRuntimeCaches ───────────────────────────────────
describe("clearRuntimeCaches", () => {
  const realNavigator = global.navigator;
  const realCaches = (global as { caches?: unknown }).caches;

  beforeEach(() => {
    // Reset
    Object.defineProperty(global, "navigator", {
      value: { ...realNavigator },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      value: realNavigator,
      writable: true,
      configurable: true,
    });
    if (realCaches) {
      (global as { caches?: unknown }).caches = realCaches;
    } else {
      delete (global as { caches?: unknown }).caches;
    }
  });

  it("sem serviceWorker e sem caches: completa sem throw", async () => {
    Object.defineProperty(global, "navigator", {
      value: {},
      writable: true,
      configurable: true,
    });
    delete (global as { caches?: unknown }).caches;
    await expect(clearRuntimeCaches()).resolves.toBeUndefined();
  });

  it("com serviceWorker: unregistra todos os registrations", async () => {
    const unregisterA = vi.fn().mockResolvedValue(true);
    const unregisterB = vi.fn().mockResolvedValue(true);
    Object.defineProperty(global, "navigator", {
      value: {
        serviceWorker: {
          getRegistrations: vi.fn().mockResolvedValue([
            { unregister: unregisterA },
            { unregister: unregisterB },
          ]),
        },
      },
      writable: true,
      configurable: true,
    });
    delete (global as { caches?: unknown }).caches;
    await clearRuntimeCaches();
    expect(unregisterA).toHaveBeenCalledOnce();
    expect(unregisterB).toHaveBeenCalledOnce();
  });

  it("com caches API: deleta todas as keys", async () => {
    const deleteA = vi.fn().mockResolvedValue(true);
    Object.defineProperty(global, "navigator", {
      value: {},
      writable: true,
      configurable: true,
    });
    (global as { caches?: unknown }).caches = {
      keys: vi.fn().mockResolvedValue(["cacheA", "cacheB"]),
      delete: deleteA,
    };
    await clearRuntimeCaches();
    expect(deleteA).toHaveBeenCalledTimes(2);
  });

  it("getRegistrations falha: não propaga exceção", async () => {
    Object.defineProperty(global, "navigator", {
      value: {
        serviceWorker: {
          getRegistrations: vi.fn().mockRejectedValue(new Error("denied")),
        },
      },
      writable: true,
      configurable: true,
    });
    delete (global as { caches?: unknown }).caches;
    await expect(clearRuntimeCaches()).resolves.toBeUndefined();
  });
});

// ── recoverFromChunkError ────────────────────────────────
describe("recoverFromChunkError", () => {
  const realLocation = window.location;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sessionStorage.clear();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Remove o flag entre testes
    delete (window as unknown as Record<string, unknown>).__APP_MOUNTED__;
    delete (window as unknown as Record<string, unknown>).__pwa_recovery_reload_scheduled__;
    // Remove overlay residual
    document.getElementById("__pwa_recovery_overlay__")?.remove();
  });

  afterEach(() => {
    // Restaura window.location se mockado
    Object.defineProperty(window, "location", {
      value: realLocation,
      writable: true,
      configurable: true,
    });
  });

  it("app já montou: avisa no console, mostra overlay, NÃO recarrega", async () => {
    (window as unknown as Record<string, unknown>).__APP_MOUNTED__ = true;
    const replaceMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...realLocation, replace: replaceMock, href: "http://test/" },
      writable: true,
      configurable: true,
    });

    await recoverFromChunkError();

    expect(warnSpy.mock.calls[0][0]).toContain("pós-mount");
    expect(document.getElementById("__pwa_recovery_overlay__")).not.toBeNull();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("boot (app não montou): mostra overlay + agenda reload", async () => {
    const replaceMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...realLocation, replace: replaceMock, href: "http://test/" },
      writable: true,
      configurable: true,
    });
    vi.useFakeTimers();
    try {
      const promise = recoverFromChunkError();
      // Resolve pending promises pra o agendamento acontecer
      await Promise.resolve();
      // Avança o RECOVERY_RELOAD_DELAY_MS (900ms)
      vi.advanceTimersByTime(900);
      await promise;
      expect(document.getElementById("__pwa_recovery_overlay__")).not.toBeNull();
      expect(replaceMock).toHaveBeenCalledOnce();
      const calledWith = replaceMock.mock.calls[0][0] as string;
      // Cache-busted URL: contém ?v=<timestamp>
      expect(calledWith).toMatch(/\?v=\d+/);
    } finally {
      vi.useRealTimers();
    }
  });

  it("overlay é idempotente: chamadas múltiplas não duplicam", async () => {
    const replaceMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...realLocation, replace: replaceMock, href: "http://test/" },
      writable: true,
      configurable: true,
    });
    (window as unknown as Record<string, unknown>).__APP_MOUNTED__ = true;
    await recoverFromChunkError();
    await recoverFromChunkError();
    expect(document.querySelectorAll("#__pwa_recovery_overlay__")).toHaveLength(1);
  });

  it("scheduleRecoveryReload é idempotente: 2 calls = 1 reload", async () => {
    const replaceMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...realLocation, replace: replaceMock, href: "http://test/" },
      writable: true,
      configurable: true,
    });
    vi.useFakeTimers();
    try {
      await recoverFromChunkError();
      await recoverFromChunkError();
      vi.advanceTimersByTime(900);
      expect(replaceMock).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
});
