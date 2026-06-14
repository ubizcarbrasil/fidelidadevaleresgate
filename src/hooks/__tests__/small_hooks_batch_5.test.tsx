/**
 * Batch 5: useSidebarBadges, useAppIcons, useOfferCardConfig.
 *
 * Bug aqui = badges escondem aprovações pendentes, ícone customizado
 * volta pro default, oferta mostra "R$ undefined" por template
 * malformado.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

const mockGuard: { currentBrandId: string | null } = { currentBrandId: null };
vi.mock("@/hooks/useBrandGuard", () => ({
  useBrandGuard: () => mockGuard,
}));

const mockBrand: {
  brand: { brand_settings_json?: Record<string, unknown> } | null;
} = { brand: null };
vi.mock("@/contexts/BrandContext", () => ({
  useBrand: () => mockBrand,
}));

import { useSidebarBadges } from "../useSidebarBadges";
import { useAppIcons } from "../useAppIcons";
import { useOfferCardConfig } from "../useOfferCardConfig";

function countChain(count: number | null) {
  const c: Record<string, unknown> = {};
  c.select = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.then = (resolve: (r: unknown) => void) => resolve({ count, error: null });
  return c;
}

function wrap(): { wrapper: (p: { children: ReactNode }) => JSX.Element } {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    wrapper: ({ children }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  mockFrom.mockReset();
  mockGuard.currentBrandId = null;
  mockBrand.brand = null;
});

// ── useSidebarBadges ────────────────────────────────────
describe("useSidebarBadges", () => {
  it("sem brand: retorna {}", async () => {
    const { result } = renderHook(() => useSidebarBadges(), wrap());
    await waitFor(() => expect(result.current).toEqual({}));
  });

  it("nenhuma pendência (todos count=0): retorna {}", async () => {
    mockGuard.currentBrandId = "b1";
    mockFrom.mockReturnValue(countChain(0));
    const { result } = renderHook(() => useSidebarBadges(), wrap());
    await waitFor(() => expect(result.current).toEqual({}));
  });

  it("stores PENDING: badge sidebar.parceiros", async () => {
    mockGuard.currentBrandId = "b1";
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      // 1ª call = stores: count 3; demais: 0
      return countChain(callCount === 1 ? 3 : 0);
    });
    const { result } = renderHook(() => useSidebarBadges(), wrap());
    await waitFor(() => expect(result.current["sidebar.parceiros"]).toBe(3));
  });

  it("múltiplas pendências: badges populados', count null tratado como 0", async () => {
    mockGuard.currentBrandId = "b1";
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      // call 1=stores:2, 2=rules:1, 3=emitter:null (ignored), 4=redemptions:5
      const counts = [2, 1, null, 5];
      return countChain(counts[callCount - 1] ?? 0);
    });
    const { result } = renderHook(() => useSidebarBadges(), wrap());
    await waitFor(() => expect(Object.keys(result.current).length).toBeGreaterThan(0));
    expect(result.current["sidebar.parceiros"]).toBe(2);
    expect(result.current["sidebar.aprovar_regras"]).toBe(1);
    expect(result.current["sidebar.resgates"]).toBe(5);
    expect(result.current["sidebar.solicitacoes_emissor"]).toBeUndefined();
  });
});

// ── useAppIcons ─────────────────────────────────────────
describe("useAppIcons", () => {
  it("sem brand: getIcon retorna defaults lucide", () => {
    const { result } = renderHook(() => useAppIcons());
    expect(result.current.getIcon("nav_home")).toEqual({ type: "lucide", name: "House" });
    expect(result.current.getIcon("nav_offers")).toEqual({ type: "lucide", name: "Tag" });
  });

  it("brand com app_icons custom: usa override", () => {
    mockBrand.brand = {
      brand_settings_json: {
        app_icons: {
          nav_home: { type: "custom", name: "MyHome", url: "https://x.com/home.svg" },
        },
      },
    };
    const { result } = renderHook(() => useAppIcons());
    const r = result.current.getIcon("nav_home");
    expect(r).toMatchObject({ type: "custom", name: "MyHome" });
  });

  it("getLucideComponent: retorna componente do lucide pra default", () => {
    const { result } = renderHook(() => useAppIcons());
    const Comp = result.current.getLucideComponent("nav_home");
    expect(Comp).toBeDefined();
  });

  it("getLucideComponent: retorna null pra config type='custom'", () => {
    mockBrand.brand = {
      brand_settings_json: {
        app_icons: {
          nav_home: { type: "custom", name: "x", url: "https://x.com" },
        },
      },
    };
    const { result } = renderHook(() => useAppIcons());
    expect(result.current.getLucideComponent("nav_home")).toBeNull();
  });

  it("getCustomUrl: retorna url quando type=custom", () => {
    mockBrand.brand = {
      brand_settings_json: {
        app_icons: {
          nav_home: { type: "custom", name: "x", url: "https://x.com" },
        },
      },
    };
    const { result } = renderHook(() => useAppIcons());
    expect(result.current.getCustomUrl("nav_home")).toBe("https://x.com");
  });

  it("getCustomUrl: null pra lucide config", () => {
    const { result } = renderHook(() => useAppIcons());
    expect(result.current.getCustomUrl("nav_home")).toBeNull();
  });
});

// ── useOfferCardConfig ──────────────────────────────────
describe("useOfferCardConfig", () => {
  it("sem brand: usa DEFAULT_CONFIG", () => {
    const { result } = renderHook(() => useOfferCardConfig());
    expect(result.current.config.store.title_template).toContain("{credit}");
  });

  it("brand com saved.store custom: merge com defaults pros campos não-override", () => {
    mockBrand.brand = {
      brand_settings_json: {
        offer_card_config: {
          store: { title_template: "TROQUE {points} POR {credit}" },
        },
      },
    };
    const { result } = renderHook(() => useOfferCardConfig());
    expect(result.current.config.store.title_template).toBe("TROQUE {points} POR {credit}");
    // subtitle preserva default
    expect(result.current.config.store.subtitle_template).toContain("{points}");
  });

  it("formatTitle aplica template com pt-BR (vírgula decimal)", () => {
    const { result } = renderHook(() => useOfferCardConfig());
    const out = result.current.formatTitle("store", { credit: 19.9 });
    expect(out).toContain("R$ 19,90");
  });

  it("formatSubtitle preenche {points} {credit} {min}", () => {
    const { result } = renderHook(() => useOfferCardConfig());
    const out = result.current.formatSubtitle("store", { points: 100, credit: 5, min: 30 });
    expect(out).toContain("100");
    expect(out).toContain("R$ 5,00");
    expect(out).toContain("R$ 30,00");
  });

  it("formatDetail emitter sem campos: vazio", () => {
    const { result } = renderHook(() => useOfferCardConfig());
    const out = result.current.formatDetail("emitter", {});
    expect(out).toBe(""); // template emitter default é vazio
  });

  it("getBadgeConfig retorna shape esperada", () => {
    const { result } = renderHook(() => useOfferCardConfig());
    const badge = result.current.getBadgeConfig("store");
    expect(badge).toHaveProperty("text_template");
    expect(badge).toHaveProperty("text_color");
    expect(badge).toHaveProperty("icon");
  });

  it("template com {credit} sem dado: '0,00' fallback", () => {
    const { result } = renderHook(() => useOfferCardConfig());
    const out = result.current.formatTitle("store", {});
    expect(out).toContain("R$ 0,00");
  });
});
