/**
 * Batch 4: useStoreProfileCompleteness (pure), useBrandScoringModels,
 * useStoreOwnerRedirect, useBrandModules.
 *
 * Bug aqui = % de completude errado, scoring agregado errado, store
 * admin não vai pro panel certo, módulo aparece pra brand sem acesso.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

const { mockFrom, mockNavigate } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockAuth: { user: { id: string } | null; roles: Array<{ role: string }>; loading: boolean } = {
  user: null,
  roles: [],
  loading: false,
};
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

const mockGuard: { currentBrandId: string | null; currentBranchId: string | null; consoleScope: string } = {
  currentBrandId: null,
  currentBranchId: null,
  consoleScope: "BRAND",
};
vi.mock("@/hooks/useBrandGuard", () => ({
  useBrandGuard: () => mockGuard,
}));

import { useStoreProfileCompleteness } from "../useStoreProfileCompleteness";
import { useBrandScoringModels } from "../useBrandScoringModels";
import { useStoreOwnerRedirect } from "../useStoreOwnerRedirect";
import { useBrandModules } from "../useBrandModules";

function selectChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  ["select", "eq", "order", "limit"].forEach((op) => { c[op] = vi.fn(() => c); });
  c.maybeSingle = vi.fn(() => Promise.resolve(result));
  c.single = vi.fn(() => Promise.resolve(result));
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function wrap(): { wrapper: (p: { children: ReactNode }) => JSX.Element } {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    wrapper: ({ children }) => (
      <QueryClientProvider client={qc}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  mockFrom.mockReset();
  mockNavigate.mockReset();
  mockAuth.user = null;
  mockAuth.roles = [];
  mockAuth.loading = false;
  mockGuard.currentBrandId = null;
  mockGuard.currentBranchId = null;
  mockGuard.consoleScope = "BRAND";
});

// ── useStoreProfileCompleteness ─────────────────────────
describe("useStoreProfileCompleteness", () => {
  it("store null: percent=0", () => {
    const { result } = renderHook(() => useStoreProfileCompleteness(null));
    expect(result.current.percent).toBe(0);
    expect(result.current.steps).toEqual([]);
    expect(result.current.isComplete).toBe(false);
  });

  it("store totalmente vazia: percent=0, todos missing", () => {
    const { result } = renderHook(() => useStoreProfileCompleteness({}));
    expect(result.current.percent).toBe(0);
    expect(result.current.missingSteps.length).toBe(result.current.steps.length);
  });

  it("logo + banner preenchidos: percent reflete (15+15)/100 = 30", () => {
    const { result } = renderHook(() =>
      useStoreProfileCompleteness({
        logo_url: "https://x.com/l.png",
        banner_url: "https://x.com/b.png",
      }),
    );
    expect(result.current.percent).toBe(30);
  });

  it("basics requer name AND description (não OR)", () => {
    const { result: r1 } = renderHook(() =>
      useStoreProfileCompleteness({ name: "X" }),
    );
    expect(r1.current.steps.find((s) => s.key === "basics")?.filled).toBe(false);

    const { result: r2 } = renderHook(() =>
      useStoreProfileCompleteness({ name: "X", description: "Y" }),
    );
    expect(r2.current.steps.find((s) => s.key === "basics")?.filled).toBe(true);
  });

  it("gallery: array vazio = NOT filled; com items = filled", () => {
    const { result: r1 } = renderHook(() =>
      useStoreProfileCompleteness({ gallery_urls: [] }),
    );
    expect(r1.current.steps.find((s) => s.key === "gallery")?.filled).toBe(false);

    const { result: r2 } = renderHook(() =>
      useStoreProfileCompleteness({ gallery_urls: ["a.png"] }),
    );
    expect(r2.current.steps.find((s) => s.key === "gallery")?.filled).toBe(true);
  });

  it("review é auto-filled quando todos os outros estão", () => {
    const all = {
      logo_url: "x", banner_url: "x", name: "X", description: "X",
      taxonomy_segment_id: "s1", address: "y",
      gallery_urls: ["a"], operating_hours_json: [{ day: 1 }],
    };
    const { result } = renderHook(() => useStoreProfileCompleteness(all));
    expect(result.current.steps.find((s) => s.key === "review")?.filled).toBe(true);
    expect(result.current.isComplete).toBe(true); // percent >= 95
    expect(result.current.percent).toBe(100);
  });

  it("firstMissingIndex aponta pra primeiro step não preenchido", () => {
    const { result } = renderHook(() =>
      useStoreProfileCompleteness({
        logo_url: "x", // logo preenchido
        // banner faltando → primeiro missing
      }),
    );
    expect(result.current.firstMissingIndex).toBe(1); // banner
  });
});

// ── useBrandScoringModels ───────────────────────────────
describe("useBrandScoringModels", () => {
  it("sem currentBrandId: fallback ambos enabled", () => {
    const { result } = renderHook(() => useBrandScoringModels(), wrap());
    expect(result.current.isDriverEnabled).toBe(true);
    expect(result.current.isPassengerEnabled).toBe(true);
  });

  it("brand sem branches: fallback ambos true", async () => {
    mockGuard.currentBrandId = "b1";
    mockFrom.mockReturnValue(selectChain({ data: [], error: null }));
    const { result } = renderHook(() => useBrandScoringModels(), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isDriverEnabled).toBe(true);
    expect(result.current.isPassengerEnabled).toBe(true);
  });

  it("apenas DRIVER_ONLY: passenger=false", async () => {
    mockGuard.currentBrandId = "b1";
    mockFrom.mockReturnValue(selectChain({
      data: [{ scoring_model: "DRIVER_ONLY" }, { scoring_model: "DRIVER_ONLY" }],
      error: null,
    }));
    const { result } = renderHook(() => useBrandScoringModels(), wrap());
    await waitFor(() => expect(result.current.isPassengerEnabled).toBe(false));
    expect(result.current.isDriverEnabled).toBe(true);
  });

  it("mix DRIVER + PASSENGER: ambos true", async () => {
    mockGuard.currentBrandId = "b1";
    mockFrom.mockReturnValue(selectChain({
      data: [{ scoring_model: "DRIVER_ONLY" }, { scoring_model: "PASSENGER_ONLY" }],
      error: null,
    }));
    const { result } = renderHook(() => useBrandScoringModels(), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isDriverEnabled).toBe(true);
    expect(result.current.isPassengerEnabled).toBe(true);
  });

  it("BOTH em alguma branch: ambos true (BOTH conta nos dois)", async () => {
    mockGuard.currentBrandId = "b1";
    mockFrom.mockReturnValue(selectChain({
      data: [{ scoring_model: "BOTH" }],
      error: null,
    }));
    const { result } = renderHook(() => useBrandScoringModels(), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isDriverEnabled).toBe(true);
    expect(result.current.isPassengerEnabled).toBe(true);
  });
});

// ── useStoreOwnerRedirect ───────────────────────────────
describe("useStoreOwnerRedirect", () => {
  it("auth loading: não age", () => {
    mockAuth.loading = true;
    renderHook(() => useStoreOwnerRedirect(), wrap());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("user com admin role: NÃO redireciona", () => {
    mockAuth.user = { id: "u1" };
    mockAuth.roles = [{ role: "brand_admin" }];
    renderHook(() => useStoreOwnerRedirect(), wrap());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("store_admin only: redireciona pra /store-panel", () => {
    mockAuth.user = { id: "u1" };
    mockAuth.roles = [{ role: "store_admin" }];
    renderHook(() => useStoreOwnerRedirect(), wrap());
    expect(mockNavigate).toHaveBeenCalledWith("/store-panel", { replace: true });
  });

  it("sem roles + store APPROVED no DB: redireciona", async () => {
    mockAuth.user = { id: "u1" };
    mockAuth.roles = [];
    mockFrom.mockReturnValue(selectChain({ data: { id: "store-1" }, error: null }));
    renderHook(() => useStoreOwnerRedirect(), wrap());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/store-panel", { replace: true }));
  });

  it("sem roles + sem store no DB: NÃO redireciona", async () => {
    mockAuth.user = { id: "u1" };
    mockAuth.roles = [];
    mockFrom.mockReturnValue(selectChain({ data: null, error: null }));
    const { result } = renderHook(() => useStoreOwnerRedirect(), wrap());
    await waitFor(() => expect(result.current.isRedirecting).toBe(false));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ── useBrandModules ─────────────────────────────────────
describe("useBrandModules", () => {
  it("ROOT scope: TODOS habilitados (super admin vê tudo)", () => {
    mockGuard.consoleScope = "ROOT";
    const { result } = renderHook(() => useBrandModules(), wrap());
    expect(result.current.isModuleEnabled("anything")).toBe(true);
    expect(result.current.isModuleEnabled("loyalty")).toBe(true);
  });

  it("non-root sem effective brand: false", () => {
    const { result } = renderHook(() => useBrandModules(), wrap());
    expect(result.current.isModuleEnabled("loyalty")).toBe(false);
  });

  it("ALWAYS_ON_MODULES sem entry: true (brand_settings/subscription/users_management)", async () => {
    mockGuard.currentBrandId = "b1";
    mockFrom.mockReturnValue(selectChain({ data: [], error: null }));
    const { result } = renderHook(() => useBrandModules(), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isModuleEnabled("brand_settings")).toBe(true);
    expect(result.current.isModuleEnabled("users_management")).toBe(true);
  });

  it("entry com is_enabled=true: enabled", async () => {
    mockGuard.currentBrandId = "b1";
    mockFrom.mockReturnValue(selectChain({
      data: [
        { is_enabled: true, module_definitions: { key: "loyalty" } },
      ],
      error: null,
    }));
    const { result } = renderHook(() => useBrandModules(), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isModuleEnabled("loyalty")).toBe(true);
  });

  it("entry com is_enabled=false: disabled (vence ALWAYS_ON)", async () => {
    mockGuard.currentBrandId = "b1";
    mockFrom.mockReturnValue(selectChain({
      data: [
        { is_enabled: false, module_definitions: { key: "brand_settings" } },
      ],
      error: null,
    }));
    const { result } = renderHook(() => useBrandModules(), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isModuleEnabled("brand_settings")).toBe(false);
  });

  it("módulo não-core sem entry: hide by default (false)", async () => {
    mockGuard.currentBrandId = "b1";
    mockFrom.mockReturnValue(selectChain({ data: [], error: null }));
    const { result } = renderHook(() => useBrandModules(), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isModuleEnabled("csv_import")).toBe(false);
  });
});
