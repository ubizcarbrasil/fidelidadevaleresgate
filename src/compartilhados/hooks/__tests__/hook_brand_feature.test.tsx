/**
 * hook_brand_feature — features Duelo Motorista (cinturão, aposta, ranking, duelo).
 *
 * Bug aqui:
 *   - Admin desliga feature mas UI continua mostrando (cache stale)
 *   - Apostas deixadas ativas após desligar duelo (regra D9 violada)
 *   - Dual-write (aposta) falha silenciosamente (compat legada quebrada)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { mockRpc, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: mockRpc },
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

import {
  useBrandFeature,
  useBranchFeature,
  useSetBrandDueloFeature,
  useSetBranchFeature,
} from "../hook_brand_feature";

function wrap(): { wrapper: (p: { children: ReactNode }) => JSX.Element; qc: QueryClient } {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    qc,
    wrapper: ({ children }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  mockRpc.mockReset();
  mockToastSuccess.mockReset();
  mockToastError.mockReset();
});

// ── useBrandFeature ──────────────────────────────────────
describe("useBrandFeature", () => {
  it("brandId null: query disabled", () => {
    const { result } = renderHook(
      () => useBrandFeature(null, "cinturao"),
      wrap(),
    );
    expect(result.current.isFetching).toBe(false);
  });

  it("RPC retorna true: data=true", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    const { result } = renderHook(
      () => useBrandFeature("b1", "cinturao"),
      wrap(),
    );
    await waitFor(() => expect(result.current.data).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith("brand_has_feature", {
      p_brand_id: "b1",
      p_feature: "cinturao",
    });
  });

  it("RPC retorna falsy: coerced pra false (Boolean wrap)", async () => {
    mockRpc.mockResolvedValue({ data: 0, error: null });
    const { result } = renderHook(
      () => useBrandFeature("b1", "ranking"),
      wrap(),
    );
    await waitFor(() => expect(result.current.data).toBe(false));
  });

  it("Erro RPC: marca isError, sem crash", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "denied" } });
    const { result } = renderHook(
      () => useBrandFeature("b1", "aposta"),
      wrap(),
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ── useBranchFeature ─────────────────────────────────────
describe("useBranchFeature", () => {
  it("branchId null: query disabled", () => {
    const { result } = renderHook(
      () => useBranchFeature(null, "duelo"),
      wrap(),
    );
    expect(result.current.isFetching).toBe(false);
  });

  it("chama branch_has_feature com branchId+feature", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    renderHook(() => useBranchFeature("br1", "duelo"), wrap());
    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(mockRpc).toHaveBeenCalledWith("branch_has_feature", {
      p_branch_id: "br1",
      p_feature: "duelo",
    });
  });
});

// ── useSetBrandDueloFeature ──────────────────────────────
describe("useSetBrandDueloFeature", () => {
  it("sucesso enabled=true: chama RPC + toast 'ativado' + 3 invalidates", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const { wrapper, qc } = wrap();
    const invSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useSetBrandDueloFeature(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        brandId: "b1",
        feature: "cinturao",
        enabled: true,
      });
    });

    expect(mockRpc).toHaveBeenCalledWith("brand_set_duelo_feature", {
      p_brand_id: "b1",
      p_feature: "cinturao",
      p_enabled: true,
    });
    expect(mockToastSuccess.mock.calls[0][0]).toContain("ativado");
    expect(invSpy).toHaveBeenCalledTimes(3);
  });

  it("sucesso enabled=false: toast 'desativado'", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const { wrapper } = wrap();
    const { result } = renderHook(() => useSetBrandDueloFeature(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        brandId: "b1",
        feature: "ranking",
        enabled: false,
      });
    });

    expect(mockToastSuccess.mock.calls[0][0]).toContain("desativado");
  });

  it("erro: toast.error com message + propaga rejection", async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error("denied") });
    const { wrapper } = wrap();
    const { result } = renderHook(() => useSetBrandDueloFeature(), { wrapper });

    await expect(
      result.current.mutateAsync({
        brandId: "b1",
        feature: "aposta",
        enabled: true,
      }),
    ).rejects.toThrow("denied");

    expect(mockToastError).toHaveBeenCalledWith("denied");
  });
});

// ── useSetBranchFeature (Sprint 4B — D9 + cascata) ──────
describe("useSetBranchFeature", () => {
  it("sem cascade: chama RPC com p_cascade_side_bets=false", async () => {
    mockRpc.mockResolvedValue({ data: { applied: ["duelo"], cascaded: [] }, error: null });
    const { wrapper } = wrap();
    const { result } = renderHook(() => useSetBranchFeature(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        branchId: "br1",
        feature: "duelo",
        enabled: true,
      });
    });

    expect(mockRpc).toHaveBeenCalledWith("branch_set_feature", {
      p_branch_id: "br1",
      p_feature: "duelo",
      p_enabled: true,
      p_cascade_side_bets: false,
    });
  });

  it("com cascadeSideBets=true: passa true pro RPC", async () => {
    mockRpc.mockResolvedValue({
      data: { applied: ["duelo"], cascaded: ["aposta"] },
      error: null,
    });
    const { wrapper } = wrap();
    const { result } = renderHook(() => useSetBranchFeature(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        branchId: "br1",
        feature: "duelo",
        enabled: false,
        cascadeSideBets: true,
      });
    });

    expect(mockRpc.mock.calls[0][1].p_cascade_side_bets).toBe(true);
  });

  it("retorno com cascaded: toast informa cascata", async () => {
    mockRpc.mockResolvedValue({
      data: { applied: ["duelo"], cascaded: ["aposta"] },
      error: null,
    });
    const { wrapper } = wrap();
    const { result } = renderHook(() => useSetBranchFeature(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        branchId: "br1",
        feature: "duelo",
        enabled: false,
        cascadeSideBets: true,
      });
    });

    expect(mockToastSuccess.mock.calls[0][0]).toContain("cascata");
  });

  it("retorno sem cascade: toast normal ativado/desativado", async () => {
    mockRpc.mockResolvedValue({
      data: { applied: ["aposta"], cascaded: [] },
      error: null,
    });
    const { wrapper } = wrap();
    const { result } = renderHook(() => useSetBranchFeature(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        branchId: "br1",
        feature: "aposta",
        enabled: true,
      });
    });

    expect(mockToastSuccess.mock.calls[0][0]).toContain("ativado");
    expect(mockToastSuccess.mock.calls[0][0]).not.toContain("cascata");
  });

  it("data null: fallback pra { applied:[], cascaded:[] }", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const { wrapper } = wrap();
    const { result } = renderHook(() => useSetBranchFeature(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        branchId: "br1",
        feature: "ranking",
        enabled: true,
      });
    });

    // Toast ainda dispara (não throw)
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it("erro: toast.error + propaga", async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error("D9 violado") });
    const { wrapper } = wrap();
    const { result } = renderHook(() => useSetBranchFeature(), { wrapper });

    await expect(
      result.current.mutateAsync({
        branchId: "br1",
        feature: "duelo",
        enabled: false,
      }),
    ).rejects.toThrow("D9 violado");

    expect(mockToastError).toHaveBeenCalledWith("D9 violado");
  });
});
