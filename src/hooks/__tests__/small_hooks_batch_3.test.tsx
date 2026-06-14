/**
 * Batch 3: useBranchModules, useRedeemMutation, useCustomerFavorites,
 * useCustomerFavoriteStores, useBrandName/useBrandInfo.
 *
 * Bug aqui = módulo desabilitado aparece em UI (orphan), resgate sem
 * compra mínima passa (erro de regra), favoritos perdem optimistic
 * update no toggle.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { mockFrom, mockToastError, mockHapticsError, mockHapticsSuccess, mockToastSuccess } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockToastError: vi.fn(),
  mockHapticsError: vi.fn(),
  mockHapticsSuccess: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

vi.mock("@/lib/haptics", () => ({
  haptics: { success: mockHapticsSuccess, error: mockHapticsError },
}));

// AuthContext + BrandContext + CustomerContext mocks
const mockAuth: { roles: Array<{ role: string; brand_id?: string | null }> } = { roles: [] };
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

const mockBrand: { brand: { id: string; name?: string; subscription_plan?: string; brand_settings_json?: Record<string, unknown> } | null } = { brand: null };
vi.mock("@/contexts/BrandContext", () => ({
  useBrand: () => mockBrand,
}));

const mockCustomer: { customer: { id: string } | null } = { customer: null };
vi.mock("@/contexts/CustomerContext", () => ({
  useCustomer: () => mockCustomer,
}));

const mockGuard: { currentBranchId: string | null } = { currentBranchId: null };
vi.mock("@/hooks/useBrandGuard", () => ({
  useBrandGuard: () => mockGuard,
}));

import { useBranchModules } from "../useBranchModules";
import { useRedeemMutation } from "../useRedeemMutation";
import { useCustomerFavorites } from "../useCustomerFavorites";
import { useCustomerFavoriteStores } from "../useCustomerFavoriteStores";
import { useBrandName, useBrandInfo } from "../useBrandName";

function singleChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.select = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.single = vi.fn(() => Promise.resolve(result));
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function listChain(result: { data?: unknown }) {
  const c: Record<string, unknown> = {};
  c.select = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function deleteOrInsertChain(result: { error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.delete = vi.fn(() => c);
  c.insert = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function updateChain(result: { error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.update = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function wrap(): { wrapper: (p: { children: ReactNode }) => JSX.Element } {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    wrapper: ({ children }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  mockFrom.mockReset();
  mockToastError.mockReset();
  mockToastSuccess.mockReset();
  mockHapticsError.mockReset();
  mockHapticsSuccess.mockReset();
  mockAuth.roles = [];
  mockBrand.brand = null;
  mockCustomer.customer = null;
  mockGuard.currentBranchId = null;
});

// ── useBranchModules ────────────────────────────────────
describe("useBranchModules", () => {
  it("sem branchId: isBranchModuleEnabled=false", () => {
    const { result } = renderHook(() => useBranchModules(), wrap());
    expect(result.current.isBranchModuleEnabled("enable_duels_module")).toBe(false);
  });

  it("settings com key=true: enabled", async () => {
    mockGuard.currentBranchId = "br1";
    mockFrom.mockReturnValue(singleChain({
      data: {
        branch_settings_json: { enable_duels_module: true, enable_achadinhos_module: false },
      },
      error: null,
    }));
    const { result } = renderHook(() => useBranchModules(), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isBranchModuleEnabled("enable_duels_module")).toBe(true);
    expect(result.current.isBranchModuleEnabled("enable_achadinhos_module")).toBe(false);
  });

  it("settings sem a key: missing = false (regra unificada)", async () => {
    mockGuard.currentBranchId = "br1";
    mockFrom.mockReturnValue(singleChain({
      data: { branch_settings_json: {} },
      error: null,
    }));
    const { result } = renderHook(() => useBranchModules(), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isBranchModuleEnabled("enable_marketplace_module")).toBe(false);
  });

  it("value truthy não-boolean: false (strict ===)", async () => {
    mockGuard.currentBranchId = "br1";
    mockFrom.mockReturnValue(singleChain({
      data: { branch_settings_json: { enable_duels_module: "yes" } },
      error: null,
    }));
    const { result } = renderHook(() => useBranchModules(), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isBranchModuleEnabled("enable_duels_module")).toBe(false);
  });
});

// ── useRedeemMutation ───────────────────────────────────
describe("useRedeemMutation", () => {
  it("compra menor que min_purchase: lança erro com R$", async () => {
    const { wrapper } = wrap();
    const { result } = renderHook(() => useRedeemMutation(), { wrapper });

    await expect(
      result.current.mutateAsync({
        redemptionId: "r1",
        purchaseValue: 10,
        creditValueApplied: 5,
        minPurchase: 50,
      }),
    ).rejects.toThrow(/R\$ 50/);

    expect(mockHapticsError).toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalled();
  });

  it("min_purchase=0: aceita qualquer compra + UPDATE status=USED", async () => {
    let updatePayload: Record<string, unknown> | null = null;
    mockFrom.mockImplementation(() => {
      const c = updateChain({ error: null });
      c.update = vi.fn((p: Record<string, unknown>) => {
        updatePayload = p;
        return c;
      });
      return c;
    });

    const { wrapper } = wrap();
    const cbSuccess = vi.fn();
    const { result } = renderHook(() => useRedeemMutation(cbSuccess), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        redemptionId: "r1",
        purchaseValue: 0,
        creditValueApplied: 5,
        minPurchase: 0,
      });
    });

    expect(updatePayload).toMatchObject({
      status: "USED",
      credit_value_applied: 5,
    });
    expect(cbSuccess).toHaveBeenCalledOnce();
    // celebrate dispara toast success (de useRedeemCelebration)
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it("purchaseValue null + min=0: passa null pro payload", async () => {
    let updatePayload: Record<string, unknown> | null = null;
    mockFrom.mockImplementation(() => {
      const c = updateChain({ error: null });
      c.update = vi.fn((p: Record<string, unknown>) => {
        updatePayload = p;
        return c;
      });
      return c;
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useRedeemMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        redemptionId: "r1",
        purchaseValue: null,
        creditValueApplied: 10,
        minPurchase: 0,
      });
    });

    expect(updatePayload?.purchase_value).toBeNull();
  });

  it("UPDATE erro: toast + propaga", async () => {
    mockFrom.mockReturnValue(updateChain({ error: new Error("UPDATE failed") }));
    const { wrapper } = wrap();
    const { result } = renderHook(() => useRedeemMutation(), { wrapper });
    await expect(
      result.current.mutateAsync({
        redemptionId: "r1",
        purchaseValue: 100,
        creditValueApplied: 10,
        minPurchase: 0,
      }),
    ).rejects.toThrow("UPDATE failed");
  });
});

// ── useCustomerFavorites ────────────────────────────────
describe("useCustomerFavorites", () => {
  it("sem customer: favoritos vazios", async () => {
    const { result } = renderHook(() => useCustomerFavorites());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isFavorite("o1")).toBe(false);
  });

  it("customer com favoritos no DB: isFavorite reflete", async () => {
    mockCustomer.customer = { id: "c1" };
    mockFrom.mockReturnValue(listChain({
      data: [{ offer_id: "o1" }, { offer_id: "o2" }],
    }));
    const { result } = renderHook(() => useCustomerFavorites());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isFavorite("o1")).toBe(true);
    expect(result.current.isFavorite("o3")).toBe(false);
  });

  it("toggleFavorite adiciona (optimistic) + INSERT no DB", async () => {
    mockCustomer.customer = { id: "c1" };
    mockFrom.mockReturnValue(listChain({ data: [] }));
    const { result } = renderHook(() => useCustomerFavorites());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let insertCalled = false;
    mockFrom.mockReturnValue({
      ...deleteOrInsertChain({ error: null }),
      insert: vi.fn(() => {
        insertCalled = true;
        return deleteOrInsertChain({ error: null });
      }),
    });

    await act(async () => {
      await result.current.toggleFavorite("o1");
    });

    expect(result.current.isFavorite("o1")).toBe(true);
    expect(insertCalled).toBe(true);
  });

  it("toggleFavorite remove existente (optimistic) + DELETE no DB", async () => {
    mockCustomer.customer = { id: "c1" };
    mockFrom.mockReturnValue(listChain({ data: [{ offer_id: "o1" }] }));
    const { result } = renderHook(() => useCustomerFavorites());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let deleteCalled = false;
    mockFrom.mockReturnValue({
      ...deleteOrInsertChain({ error: null }),
      delete: vi.fn(() => {
        deleteCalled = true;
        return deleteOrInsertChain({ error: null });
      }),
    });

    await act(async () => {
      await result.current.toggleFavorite("o1");
    });

    expect(result.current.isFavorite("o1")).toBe(false);
    expect(deleteCalled).toBe(true);
  });
});

// ── useCustomerFavoriteStores (espelho do anterior) ─────
describe("useCustomerFavoriteStores", () => {
  it("sem customer: vazio", async () => {
    const { result } = renderHook(() => useCustomerFavoriteStores());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isFavoriteStore("s1")).toBe(false);
  });

  it("customer + favoritos: isFavoriteStore reflete", async () => {
    mockCustomer.customer = { id: "c1" };
    mockFrom.mockReturnValue(listChain({
      data: [{ store_id: "s1" }],
    }));
    const { result } = renderHook(() => useCustomerFavoriteStores());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isFavoriteStore("s1")).toBe(true);
  });
});

// ── useBrandName + useBrandInfo ─────────────────────────
describe("useBrandName / useBrandInfo", () => {
  it("sem brand: name='', logoUrl=null", () => {
    const { result } = renderHook(() => useBrandInfo(), wrap());
    expect(result.current.name).toBe("");
    expect(result.current.logoUrl).toBeNull();
    expect(result.current.brandId).toBeNull();
  });

  it("brand do contexto: reaproveita sem consulta", async () => {
    mockBrand.brand = {
      id: "b1",
      name: "Acme Brand",
      subscription_plan: "pro",
      brand_settings_json: { logo_url: "https://x.com/logo.png" },
    };
    mockAuth.roles = [{ role: "brand_admin", brand_id: "b1" }];

    const { result } = renderHook(() => useBrandInfo(), wrap());
    await waitFor(() => expect(result.current.name).toBe("Acme Brand"));
    expect(result.current.logoUrl).toBe("https://x.com/logo.png");
    expect(result.current.subscriptionPlan).toBe("pro");
    // Não chama supabase (contexto já tinha)
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("role.brand_id presente, contexto desatualizado: usa role como source of truth", async () => {
    mockBrand.brand = { id: "b-OLD", name: "Old Brand" };
    mockAuth.roles = [{ role: "brand_admin", brand_id: "b-NEW" }];
    mockFrom.mockReturnValue(singleChain({
      data: { name: "New Brand", brand_settings_json: {}, subscription_plan: "free" },
      error: null,
    }));

    const { result } = renderHook(() => useBrandInfo(), wrap());
    await waitFor(() => expect(result.current.name).toBe("New Brand"));
    expect(result.current.brandId).toBe("b-NEW");
  });

  it("settings inválido (array): vira {} (defensive)", async () => {
    mockBrand.brand = {
      id: "b1",
      name: "X",
      brand_settings_json: ["not", "object"] as never,
    };
    mockAuth.roles = [{ role: "brand_admin", brand_id: "b1" }];

    const { result } = renderHook(() => useBrandInfo(), wrap());
    await waitFor(() => expect(result.current.name).toBe("X"));
    expect(result.current.brandSettings).toEqual({});
  });

  it("useBrandName retorna só o name de useBrandInfo", async () => {
    mockBrand.brand = { id: "b1", name: "MyBrand" };
    mockAuth.roles = [{ role: "brand_admin", brand_id: "b1" }];
    const { result } = renderHook(() => useBrandName(), wrap());
    await waitFor(() => expect(result.current).toBe("MyBrand"));
  });
});
