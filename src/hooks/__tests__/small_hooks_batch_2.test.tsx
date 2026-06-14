/**
 * Batch 2 de small hooks: hook_branch_city, useRankedOffers,
 * useGanhaGanhaConfig, useBranchScoringModel, useRedeemCelebration.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// ── Shared mocks ─────────────────────────────────────────
const { mockFrom, mockRpc, mockToastSuccess, mockHapticsSuccess } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockHapticsSuccess: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess },
}));

vi.mock("@/lib/haptics", () => ({
  haptics: { success: mockHapticsSuccess },
}));

// AuthContext mock
const mockAuthState: {
  roles: Array<{ role: string; branch_id?: string | null }>;
} = { roles: [] };
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

// Brand/Customer contexts pra useRankedOffers
const mockBrandState: {
  brand: { id: string } | null;
  selectedBranch: { id: string } | null;
} = { brand: null, selectedBranch: null };
vi.mock("@/contexts/BrandContext", () => ({
  useBrand: () => mockBrandState,
}));

const mockCustomerState: { customer: { id: string } | null } = { customer: null };
vi.mock("@/contexts/CustomerContext", () => ({
  useCustomer: () => mockCustomerState,
}));

// useBrandGuard mock pra useGanhaGanhaConfig / useBranchScoringModel
const mockGuardState: { currentBrandId: string | null; currentBranchId: string | null } = {
  currentBrandId: null,
  currentBranchId: null,
};
vi.mock("@/hooks/useBrandGuard", () => ({
  useBrandGuard: () => mockGuardState,
}));

// Imports lazy pra mocks aplicarem
import { useBranchCityName } from "../hook_branch_city";
import { useRankedOffers } from "../useRankedOffers";
import { useGanhaGanhaConfig } from "../useGanhaGanhaConfig";
import { useBranchScoringModel } from "../useBranchScoringModel";
import { useRedeemCelebration } from "../useRedeemCelebration";

function singleChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.select = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.single = vi.fn(() => Promise.resolve(result));
  c.maybeSingle = vi.fn(() => Promise.resolve(result));
  c.then = (resolve: (r: unknown) => void) => resolve(result);
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
  mockRpc.mockReset();
  mockToastSuccess.mockReset();
  mockHapticsSuccess.mockReset();
  mockAuthState.roles = [];
  mockBrandState.brand = null;
  mockBrandState.selectedBranch = null;
  mockCustomerState.customer = null;
  mockGuardState.currentBrandId = null;
  mockGuardState.currentBranchId = null;
});

// ── useBranchCityName ────────────────────────────────────
describe("useBranchCityName", () => {
  it("sem role com branch_id: retorna ''", () => {
    mockAuthState.roles = [{ role: "root_admin" }];
    const { result } = renderHook(() => useBranchCityName());
    expect(result.current).toBe("");
  });

  it("com branch_id e data.city: retorna city", async () => {
    mockAuthState.roles = [{ role: "branch_admin", branch_id: "br1" }];
    mockFrom.mockReturnValue(singleChain({
      data: { city: "São Paulo", name: "Sede SP" },
    }));
    const { result } = renderHook(() => useBranchCityName());
    await waitFor(() => expect(result.current).toBe("São Paulo"));
  });

  it("data.city ausente: fallback pra data.name", async () => {
    mockAuthState.roles = [{ role: "branch_admin", branch_id: "br1" }];
    mockFrom.mockReturnValue(singleChain({
      data: { city: null, name: "Filial XYZ" },
    }));
    const { result } = renderHook(() => useBranchCityName());
    await waitFor(() => expect(result.current).toBe("Filial XYZ"));
  });
});

// ── useRankedOffers ──────────────────────────────────────
describe("useRankedOffers", () => {
  it("sem brand ou branch: query disabled", () => {
    const { result } = renderHook(() => useRankedOffers(), wrap());
    expect(result.current.isFetching).toBe(false);
  });

  it("chama RPC com brand+branch+customer+limit", async () => {
    mockBrandState.brand = { id: "b1" };
    mockBrandState.selectedBranch = { id: "br1" };
    mockCustomerState.customer = { id: "c1" };
    mockRpc.mockResolvedValue({
      data: [
        { offer_id: "o1", score: 0.9 },
        { offer_id: "o2", score: 0.7 },
      ],
      error: null,
    });

    const { result } = renderHook(() => useRankedOffers(50), wrap());
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(mockRpc).toHaveBeenCalledWith("get_recommended_offers", {
      p_brand_id: "b1",
      p_branch_id: "br1",
      p_customer_id: "c1",
      p_limit: 50,
    });
    expect(result.current.data).toEqual(["o1", "o2"]);
  });

  it("sem customer: p_customer_id undefined", async () => {
    mockBrandState.brand = { id: "b1" };
    mockBrandState.selectedBranch = { id: "br1" };
    mockRpc.mockResolvedValue({ data: [], error: null });
    renderHook(() => useRankedOffers(), wrap());
    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(mockRpc.mock.calls[0][1].p_customer_id).toBeUndefined();
  });

  it("data vazia ou erro: retorna []", async () => {
    mockBrandState.brand = { id: "b1" };
    mockBrandState.selectedBranch = { id: "br1" };
    mockRpc.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useRankedOffers(), wrap());
    await waitFor(() => expect(result.current.data).toEqual([]));
  });
});

// ── useGanhaGanhaConfig ──────────────────────────────────
describe("useGanhaGanhaConfig", () => {
  it("currentBrandId null: query disabled, isActive=false", () => {
    const { result } = renderHook(() => useGanhaGanhaConfig(), wrap());
    expect(result.current.isActive).toBe(false);
    expect(result.current.config).toBeUndefined();
  });

  it("config com is_active=true: isActive=true", async () => {
    mockGuardState.currentBrandId = "b1";
    mockFrom.mockReturnValue(singleChain({
      data: { id: "cfg-1", brand_id: "b1", is_active: true, fee_mode: "UNIFORM" },
      error: null,
    }));
    const { result } = renderHook(() => useGanhaGanhaConfig(), wrap());
    await waitFor(() => expect(result.current.config).toBeDefined());
    expect(result.current.isActive).toBe(true);
  });

  it("config null (sem registro): isActive=false defensivo", async () => {
    mockGuardState.currentBrandId = "b1";
    mockFrom.mockReturnValue(singleChain({ data: null, error: null }));
    const { result } = renderHook(() => useGanhaGanhaConfig(), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isActive).toBe(false);
  });
});

// ── useBranchScoringModel ────────────────────────────────
describe("useBranchScoringModel", () => {
  it("sem branchId: model fallback BOTH + ambos enabled", () => {
    const { result } = renderHook(() => useBranchScoringModel(), wrap());
    expect(result.current.scoringModel).toBe("BOTH");
    expect(result.current.isDriverEnabled).toBe(true);
    expect(result.current.isPassengerEnabled).toBe(true);
  });

  it("DRIVER_ONLY: isDriverEnabled true, passenger false", async () => {
    mockGuardState.currentBranchId = "br1";
    mockFrom.mockReturnValue(singleChain({
      data: { scoring_model: "DRIVER_ONLY" },
      error: null,
    }));
    const { result } = renderHook(() => useBranchScoringModel(), wrap());
    await waitFor(() => expect(result.current.scoringModel).toBe("DRIVER_ONLY"));
    expect(result.current.isDriverEnabled).toBe(true);
    expect(result.current.isPassengerEnabled).toBe(false);
  });

  it("PASSENGER_ONLY: driver false, passenger true", async () => {
    mockGuardState.currentBranchId = "br1";
    mockFrom.mockReturnValue(singleChain({
      data: { scoring_model: "PASSENGER_ONLY" },
      error: null,
    }));
    const { result } = renderHook(() => useBranchScoringModel(), wrap());
    await waitFor(() => expect(result.current.scoringModel).toBe("PASSENGER_ONLY"));
    expect(result.current.isDriverEnabled).toBe(false);
    expect(result.current.isPassengerEnabled).toBe(true);
  });

  it("branchIdOverride: usa override em vez do currentBranchId", async () => {
    mockGuardState.currentBranchId = "br-from-guard";
    let calledWith = "";
    mockFrom.mockImplementation(() => {
      const c = singleChain({ data: { scoring_model: "BOTH" }, error: null });
      c.eq = vi.fn((col: string, val: string) => {
        calledWith = val;
        return c;
      });
      return c;
    });

    renderHook(() => useBranchScoringModel("br-override"), wrap());
    await waitFor(() => expect(calledWith).toBe("br-override"));
  });
});

// ── useRedeemCelebration ─────────────────────────────────
describe("useRedeemCelebration", () => {
  it("celebrate() chama toast.success com defaults + haptics.success", () => {
    const { result } = renderHook(() => useRedeemCelebration());
    act(() => { result.current.celebrate(); });

    expect(mockToastSuccess).toHaveBeenCalledOnce();
    const call = mockToastSuccess.mock.calls[0];
    expect(call[0]).toContain("Voucher resgatado");
    expect(call[1]).toMatchObject({
      icon: "🏆",
      duration: 4000,
    });
    expect(mockHapticsSuccess).toHaveBeenCalledOnce();
  });

  it("celebrate(opts custom): sobrescreve title + description", () => {
    const { result } = renderHook(() => useRedeemCelebration());
    act(() => {
      result.current.celebrate({
        title: "Custom title",
        description: "Custom desc",
      });
    });

    expect(mockToastSuccess.mock.calls[0][0]).toBe("Custom title");
    expect(mockToastSuccess.mock.calls[0][1].description).toBe("Custom desc");
  });

  it("celebrate identity estável (memo)", () => {
    const { result, rerender } = renderHook(() => useRedeemCelebration());
    const first = result.current.celebrate;
    rerender();
    expect(result.current.celebrate).toBe(first);
  });
});
