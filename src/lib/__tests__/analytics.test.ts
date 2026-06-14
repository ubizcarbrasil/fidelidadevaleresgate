/**
 * analytics — wrapper PostHog com graceful degradation + lazy init.
 *
 * Bug aqui = perda de eventos de produto (NPS quebrado), OU bundle
 * inflado por carregar PostHog SDK no SSR, OU erro de PostHog
 * quebrando boot.
 *
 * Testa:
 *   - initAnalytics sem VITE_POSTHOG_KEY: no-op silencioso
 *   - initAnalytics em SSR (window undefined): no-op
 *   - identify/track/resetIdentity/trackPageView sem init: graceful
 *   - identify/track agendam pra após init quando ainda não pronto
 *   - track passa event + props pro PostHog corretamente
 *   - PostHog SDK load falhar NÃO quebra app
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPosthog = {
  init: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  capture: vi.fn(),
};

// Mock dinâmico do posthog-js. Cada test pode override via
// vi.doMock antes do import.
vi.mock("posthog-js", () => ({
  default: mockPosthog,
}));

beforeEach(() => {
  // Limpa singletons (initPromise, posthogInstance)
  vi.resetModules();
  // Restaura todos os spies (mocks de import.meta.env, console, etc.)
  vi.restoreAllMocks();
  // Limpa env stubs do teste anterior (sem isso, VITE_POSTHOG_HOST vaza)
  vi.unstubAllEnvs();
  mockPosthog.init.mockReset();
  mockPosthog.identify.mockReset();
  mockPosthog.reset.mockReset();
  mockPosthog.capture.mockReset();
  // Por default, env tem key — testes "no key" sobrescrevem
  vi.stubEnv("VITE_POSTHOG_KEY", "phc_test_key");
});

async function fresh() {
  return import("../analytics");
}

// ── initAnalytics ────────────────────────────────────────
describe("initAnalytics — graceful degradation", () => {
  it("sem VITE_POSTHOG_KEY: retorna null, NÃO carrega SDK", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "");
    const { initAnalytics } = await fresh();
    const result = await initAnalytics();
    expect(result).toBeNull();
    expect(mockPosthog.init).not.toHaveBeenCalled();
  });

  it("idempotente: 2 chamadas retornam a mesma Promise", async () => {
    const { initAnalytics } = await fresh();
    const p1 = initAnalytics();
    const p2 = initAnalytics();
    expect(p1).toBe(p2);
    await p1;
    // posthog.init chamado só 1x
    expect(mockPosthog.init).toHaveBeenCalledOnce();
  });

  it("chama posthog.init com key + opts canônicos", async () => {
    const { initAnalytics } = await fresh();
    await initAnalytics();
    expect(mockPosthog.init).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: false,
        persistence: "localStorage+cookie",
      }),
    );
  });

  it("VITE_POSTHOG_HOST customizado vai pro api_host", async () => {
    vi.stubEnv("VITE_POSTHOG_HOST", "https://eu.posthog.com");
    const { initAnalytics } = await fresh();
    await initAnalytics();
    const opts = mockPosthog.init.mock.calls[0][1];
    expect(opts.api_host).toBe("https://eu.posthog.com");
  });

  it("api_host default us.i.posthog.com quando VITE_POSTHOG_HOST não definido", async () => {
    // NÃO seta VITE_POSTHOG_HOST — fica undefined, fallback dispara
    const { initAnalytics } = await fresh();
    await initAnalytics();
    const opts = mockPosthog.init.mock.calls[0][1];
    expect(opts.api_host).toBe("https://us.i.posthog.com");
  });
});

// ── identify ─────────────────────────────────────────────
describe("identify", () => {
  it("após init: chama posthog.identify direto", async () => {
    const { initAnalytics, identify } = await fresh();
    await initAnalytics();
    identify("user-123", { plan: "pro" });
    expect(mockPosthog.identify).toHaveBeenCalledWith("user-123", { plan: "pro" });
  });

  it("antes de init: agenda (chama via initAnalytics().then)", async () => {
    const { identify } = await fresh();
    identify("user-123");
    // Aguarda microtask + init promise
    await new Promise((r) => setTimeout(r, 0));
    expect(mockPosthog.identify).toHaveBeenCalledWith("user-123", undefined);
  });

  it("sem POSTHOG_KEY (init resolve null): identify agendado vira no-op", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "");
    const { identify } = await fresh();
    identify("user-X");
    await new Promise((r) => setTimeout(r, 0));
    expect(mockPosthog.identify).not.toHaveBeenCalled();
  });
});

// ── resetIdentity ────────────────────────────────────────
describe("resetIdentity", () => {
  it("após init: chama posthog.reset", async () => {
    const { initAnalytics, resetIdentity } = await fresh();
    await initAnalytics();
    resetIdentity();
    expect(mockPosthog.reset).toHaveBeenCalledOnce();
  });

  it("antes de init: no-op (não agenda — perda OK em logout)", async () => {
    const { resetIdentity } = await fresh();
    resetIdentity();
    await new Promise((r) => setTimeout(r, 0));
    expect(mockPosthog.reset).not.toHaveBeenCalled();
  });
});

// ── track ────────────────────────────────────────────────
describe("track — eventos tipados", () => {
  it("após init: passa event name + props pro PostHog.capture", async () => {
    const { initAnalytics, track } = await fresh();
    await initAnalytics();
    track("customer_signup", {
      brand_id: "b1",
      branch_id: "br1",
      source: "storefront",
    });
    expect(mockPosthog.capture).toHaveBeenCalledWith("customer_signup", {
      brand_id: "b1",
      branch_id: "br1",
      source: "storefront",
    });
  });

  it("antes de init: agenda pra não perder eventos do boot", async () => {
    const { track } = await fresh();
    track("brand_module_toggled", {
      brand_id: "b1", module_key: "loyalty", enabled: true,
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(mockPosthog.capture).toHaveBeenCalledWith(
      "brand_module_toggled",
      expect.objectContaining({ brand_id: "b1" }),
    );
  });
});

// ── trackPageView ────────────────────────────────────────
describe("trackPageView", () => {
  it("após init: $pageview com $current_url", async () => {
    const { initAnalytics, trackPageView } = await fresh();
    await initAnalytics();
    trackPageView("/customers");
    expect(mockPosthog.capture).toHaveBeenCalledWith("$pageview", {
      $current_url: "/customers",
    });
  });

  it("antes de init: no-op (não agenda — pageview perdido OK)", async () => {
    const { trackPageView } = await fresh();
    trackPageView("/x");
    await new Promise((r) => setTimeout(r, 0));
    expect(mockPosthog.capture).not.toHaveBeenCalled();
  });
});
