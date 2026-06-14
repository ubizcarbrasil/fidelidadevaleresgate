/**
 * bootStateCore — state machine de boot SEM dependência React.
 *
 * Bug aqui = loader infinito ou loader fica preso em fase antiga.
 * Importante:
 *   - Monotônico (não regride): se BrandContext skip-local chega a
 *     BRAND_READY antes do AuthContext terminar, AUTH_LOADING tardio
 *     NÃO pode reverter o estado.
 *   - Listeners disparam em toda mudança válida.
 *   - dismissBootstrap roda em APP_MOUNTED / FAILED (esconde fallback HTML).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  // Reset módulo pra zerar singleton (currentPhase, listeners, bootResolved)
  vi.resetModules();
  // Garante DOM limpo
  document.body.innerHTML = "";
  // Reset window.__BOOT_PHASE__
  delete (window as unknown as Record<string, unknown>).__BOOT_PHASE__;
  // Silencia o log.info de transição (poluiria o teste)
  vi.spyOn(console, "info").mockImplementation(() => {});
});

async function fresh() {
  return import("../bootStateCore");
}

// ── setBootPhase forward ─────────────────────────────────
describe("setBootPhase — transição válida", () => {
  it("muda de BOOTSTRAP pra AUTH_LOADING + atualiza window.__BOOT_PHASE__", async () => {
    const { setBootPhase, getBootPhase } = await fresh();
    setBootPhase("AUTH_LOADING");
    expect(getBootPhase()).toBe("AUTH_LOADING");
    expect((window as unknown as Record<string, unknown>).__BOOT_PHASE__).toBe(
      "AUTH_LOADING",
    );
  });

  it("transição sequencial até APP_MOUNTED", async () => {
    const { setBootPhase, getBootPhase } = await fresh();
    setBootPhase("AUTH_LOADING");
    setBootPhase("AUTH_READY");
    setBootPhase("BRAND_LOADING");
    setBootPhase("BRAND_READY");
    setBootPhase("APP_MOUNTED");
    expect(getBootPhase()).toBe("APP_MOUNTED");
  });
});

// ── Monotônico: não regride ──────────────────────────────
describe("setBootPhase — monotonicidade (anti-regressão)", () => {
  it("AUTH_READY → AUTH_LOADING: ignora (fase de menor rank)", async () => {
    const { setBootPhase, getBootPhase } = await fresh();
    setBootPhase("AUTH_LOADING");
    setBootPhase("AUTH_READY");
    setBootPhase("AUTH_LOADING"); // regressão
    expect(getBootPhase()).toBe("AUTH_READY");
  });

  it("BRAND_READY → BOOTSTRAP: ignora", async () => {
    const { setBootPhase, getBootPhase } = await fresh();
    setBootPhase("AUTH_READY");
    setBootPhase("BRAND_READY");
    setBootPhase("BOOTSTRAP");
    expect(getBootPhase()).toBe("BRAND_READY");
  });

  it("BRAND_READY → APP_MOUNTED: avança (rank maior)", async () => {
    const { setBootPhase, getBootPhase } = await fresh();
    setBootPhase("AUTH_READY");
    setBootPhase("BRAND_READY");
    setBootPhase("APP_MOUNTED");
    expect(getBootPhase()).toBe("APP_MOUNTED");
  });

  it("APP_MOUNTED → FAILED: FAILED tem mesmo rank, atualiza", async () => {
    // PHASE_RANK[APP_MOUNTED] = 5, FAILED também = 5.
    // A guarda é "<", então igual passa.
    const { setBootPhase, getBootPhase } = await fresh();
    setBootPhase("APP_MOUNTED");
    setBootPhase("FAILED");
    expect(getBootPhase()).toBe("FAILED");
  });
});

// ── isBootResolved (high-water mark) ─────────────────────
describe("isBootResolved", () => {
  it("falso antes de fase terminal", async () => {
    const { setBootPhase, isBootResolved } = await fresh();
    expect(isBootResolved()).toBe(false);
    setBootPhase("AUTH_READY");
    expect(isBootResolved()).toBe(false);
  });

  it("true após BRAND_READY", async () => {
    const { setBootPhase, isBootResolved } = await fresh();
    setBootPhase("BRAND_READY");
    expect(isBootResolved()).toBe(true);
  });

  it("true após FAILED", async () => {
    const { setBootPhase, isBootResolved } = await fresh();
    setBootPhase("FAILED");
    expect(isBootResolved()).toBe(true);
  });

  it("APP_MOUNTED após BRAND_READY mantém resolved=true", async () => {
    const { setBootPhase, isBootResolved } = await fresh();
    setBootPhase("BRAND_READY");
    setBootPhase("APP_MOUNTED");
    expect(isBootResolved()).toBe(true);
  });

  it("APP_MOUNTED sem passar por BRAND_READY: não é considerado terminal por design", async () => {
    // TERMINAL = {BRAND_READY, FAILED}. APP_MOUNTED sozinho não conta —
    // documenta a quirk pra evitar mudança não-intencional.
    const { setBootPhase, isBootResolved } = await fresh();
    setBootPhase("AUTH_READY");
    setBootPhase("APP_MOUNTED");
    expect(isBootResolved()).toBe(false);
  });
});

// ── Listeners ────────────────────────────────────────────
describe("onBootPhase / subscribeBootState — listeners", () => {
  it("listener disparado a cada transição válida", async () => {
    const { setBootPhase, onBootPhase } = await fresh();
    const cb = vi.fn();
    onBootPhase(cb);
    setBootPhase("AUTH_LOADING");
    setBootPhase("AUTH_READY");
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb.mock.calls[0][0]).toBe("AUTH_LOADING");
    expect(cb.mock.calls[1][0]).toBe("AUTH_READY");
  });

  it("listener NÃO disparado em transição inválida (regressão)", async () => {
    const { setBootPhase, onBootPhase } = await fresh();
    setBootPhase("AUTH_READY");
    const cb = vi.fn();
    onBootPhase(cb);
    setBootPhase("AUTH_LOADING"); // regride → no-op
    expect(cb).not.toHaveBeenCalled();
  });

  it("unsubscribe retornado por onBootPhase para de chamar callback", async () => {
    const { setBootPhase, onBootPhase } = await fresh();
    const cb = vi.fn();
    const unsub = onBootPhase(cb);
    setBootPhase("AUTH_LOADING");
    expect(cb).toHaveBeenCalledOnce();
    unsub();
    setBootPhase("AUTH_READY");
    expect(cb).toHaveBeenCalledOnce(); // não chamou de novo
  });

  it("múltiplos listeners disparam todos", async () => {
    const { setBootPhase, onBootPhase } = await fresh();
    const a = vi.fn();
    const b = vi.fn();
    onBootPhase(a);
    onBootPhase(b);
    setBootPhase("AUTH_LOADING");
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it("subscribeBootState: também escuta, tem unsubscribe", async () => {
    const { setBootPhase, subscribeBootState } = await fresh();
    const cb = vi.fn();
    const unsub = subscribeBootState(cb);
    setBootPhase("AUTH_LOADING");
    expect(cb).toHaveBeenCalledOnce();
    unsub();
    setBootPhase("AUTH_READY");
    expect(cb).toHaveBeenCalledOnce();
  });
});

// ── dismissBootstrap ─────────────────────────────────────
describe("dismissBootstrap", () => {
  it("não throw quando elemento ausente", async () => {
    const { dismissBootstrap } = await fresh();
    expect(() => dismissBootstrap()).not.toThrow();
  });

  it("esconde #bootstrap-fallback quando presente", async () => {
    const fallback = document.createElement("div");
    fallback.id = "bootstrap-fallback";
    fallback.style.display = "block";
    document.body.appendChild(fallback);

    const { dismissBootstrap } = await fresh();
    dismissBootstrap();
    expect(fallback.style.display).toBe("none");
  });

  it("setBootPhase('APP_MOUNTED') também dispara dismiss", async () => {
    const fallback = document.createElement("div");
    fallback.id = "bootstrap-fallback";
    fallback.style.display = "block";
    document.body.appendChild(fallback);

    const { setBootPhase } = await fresh();
    setBootPhase("APP_MOUNTED");
    expect(fallback.style.display).toBe("none");
  });

  it("setBootPhase('FAILED') também dispara dismiss", async () => {
    const fallback = document.createElement("div");
    fallback.id = "bootstrap-fallback";
    fallback.style.display = "block";
    document.body.appendChild(fallback);

    const { setBootPhase } = await fresh();
    setBootPhase("FAILED");
    expect(fallback.style.display).toBe("none");
  });

  it("setBootPhase('AUTH_READY') NÃO dispara dismiss (só APP_MOUNTED/FAILED)", async () => {
    const fallback = document.createElement("div");
    fallback.id = "bootstrap-fallback";
    fallback.style.display = "block";
    document.body.appendChild(fallback);

    const { setBootPhase } = await fresh();
    setBootPhase("AUTH_READY");
    expect(fallback.style.display).toBe("block");
  });
});
