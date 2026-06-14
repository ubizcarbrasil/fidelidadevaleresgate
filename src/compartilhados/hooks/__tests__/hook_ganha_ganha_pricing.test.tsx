/**
 * hook_ganha_ganha_pricing — pricing versionado do Ganha-Ganha
 * (Opção B: histórico via valid_to NULL = ativo).
 *
 * Bug aqui = pricing errado (cobrança incorreta), histórico quebrado
 * (impossível reconciliar mudanças), brands com GG ativo não aparecem
 * na lista de admin.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { mockFrom, mockRpc, mockGetUser, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockGetUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
    auth: { getUser: mockGetUser },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

import {
  useGanhaGanhaPricing,
  useUpdateGanhaGanhaPricing,
  useBrandsWithGanhaGanha,
} from "../hook_ganha_ganha_pricing";

function selectChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  ["select", "is", "eq", "in", "order"].forEach((op) => {
    c[op] = vi.fn(() => c);
  });
  c.maybeSingle = vi.fn(() => Promise.resolve(result));
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function insertChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.insert = vi.fn(() => c);
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

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
  mockFrom.mockReset();
  mockRpc.mockReset();
  mockGetUser.mockClear().mockResolvedValue({ data: { user: { id: "u1" } } });
  mockToastSuccess.mockReset();
  mockToastError.mockReset();
});

// ── useGanhaGanhaPricing ─────────────────────────────────
describe("useGanhaGanhaPricing", () => {
  it("seleciona com valid_to=null + order por plan_key", async () => {
    const c = selectChain({ data: [], error: null });
    mockFrom.mockReturnValue(c);
    renderHook(() => useGanhaGanhaPricing(), wrap());
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());
    expect(c.is).toHaveBeenCalledWith("valid_to", null);
    expect(c.order).toHaveBeenCalledWith("plan_key", { ascending: true });
  });

  it("retorna data como array de pricing rows", async () => {
    mockFrom.mockReturnValue(selectChain({
      data: [
        { id: "1", plan_key: "starter", price_per_point_cents: 50 },
      ],
      error: null,
    }));
    const { result } = renderHook(() => useGanhaGanhaPricing(), wrap());
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });

  it("erro: marca isError", async () => {
    mockFrom.mockReturnValue(selectChain({ data: null, error: new Error("denied") }));
    const { result } = renderHook(() => useGanhaGanhaPricing(), wrap());
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ── useUpdateGanhaGanhaPricing ───────────────────────────
describe("useUpdateGanhaGanhaPricing", () => {
  it("RPC com margins explícitas + audit changes_json estruturado", async () => {
    mockRpc.mockResolvedValue({ data: "new-row-id", error: null });
    let auditChanges: Record<string, unknown> | null = null;
    mockFrom.mockImplementation(() => {
      const c = insertChain({ data: null });
      c.insert = vi.fn((p: Record<string, unknown>) => {
        auditChanges = (p as { changes_json: Record<string, unknown> }).changes_json;
        return c;
      });
      return c;
    });

    const { wrapper, qc } = wrap();
    const invSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useUpdateGanhaGanhaPricing(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        plan_key: "starter" as never,
        price_per_point_cents: 60,
        min_margin_pct: 5,
        max_margin_pct: 15,
        previous: {
          price_per_point_cents: 50,
          min_margin_pct: 3,
          max_margin_pct: 10,
        },
        action: "price_updated",
      });
    });

    expect(mockRpc).toHaveBeenCalledWith("update_ganha_ganha_pricing", {
      p_plan_key: "starter",
      p_price_cents: 60,
      p_min_margin_pct: 5,
      p_max_margin_pct: 15,
    });
    expect(auditChanges).toMatchObject({
      plan_key: "starter",
      price: { from: 50, to: 60 },
      min_margin_pct: { from: 3, to: 5 },
      max_margin_pct: { from: 10, to: 15 },
    });
    expect(invSpy).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalledWith("Pricing atualizado");
  });

  it("min/max null: passa undefined pro RPC", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue(insertChain({ data: null }));

    const { wrapper } = wrap();
    const { result } = renderHook(() => useUpdateGanhaGanhaPricing(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        plan_key: "free" as never,
        price_per_point_cents: 0,
        min_margin_pct: null,
        max_margin_pct: null,
      });
    });

    expect(mockRpc.mock.calls[0][1].p_min_margin_pct).toBeUndefined();
    expect(mockRpc.mock.calls[0][1].p_max_margin_pct).toBeUndefined();
  });

  it("action default = 'price_updated' quando não passa", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    let auditAction: string | null = null;
    mockFrom.mockImplementation(() => {
      const c = insertChain({ data: null });
      c.insert = vi.fn((p: Record<string, unknown>) => {
        auditAction = p.action as string;
        return c;
      });
      return c;
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useUpdateGanhaGanhaPricing(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        plan_key: "free" as never,
        price_per_point_cents: 0,
        min_margin_pct: null,
        max_margin_pct: null,
      });
    });

    expect(auditAction).toBe("price_updated");
  });

  it("RPC erro: toast + propaga", async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error("RLS denied") });
    const { wrapper } = wrap();
    const { result } = renderHook(() => useUpdateGanhaGanhaPricing(), { wrapper });
    await expect(
      result.current.mutateAsync({
        plan_key: "free" as never,
        price_per_point_cents: 0,
        min_margin_pct: null,
        max_margin_pct: null,
      }),
    ).rejects.toThrow("RLS denied");
    expect(mockToastError).toHaveBeenCalled();
  });
});

// ── useBrandsWithGanhaGanha ──────────────────────────────
describe("useBrandsWithGanhaGanha", () => {
  it("business_models 'ganha_ganha' não existe: retorna []", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "business_models") return selectChain({ data: null, error: null });
      return selectChain({ data: [] });
    });
    const { result } = renderHook(() => useBrandsWithGanhaGanha(), wrap());
    await waitFor(() => expect(result.current.data).toEqual([]));
  });

  it("nenhuma brand com vínculo ativo: retorna []", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "business_models")
        return selectChain({ data: { id: "bm-gg" }, error: null });
      if (table === "brand_business_models")
        return selectChain({ data: [], error: null });
      return selectChain({ data: [] });
    });
    const { result } = renderHook(() => useBrandsWithGanhaGanha(), wrap());
    await waitFor(() => expect(result.current.data).toEqual([]));
  });

  it("agrega data corretamente: brand+links+overrides+models", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "business_models")
        return selectChain({ data: { id: "bm-gg" }, error: null });
      if (table === "brand_business_models") {
        // 1ª call: links com is_enabled=true; 2ª call: contagem
        return selectChain({
          data: [
            { brand_id: "b1", ganha_ganha_margin_pct: 12, is_enabled: true },
            { brand_id: "b2", ganha_ganha_margin_pct: null, is_enabled: true },
          ],
          error: null,
        });
      }
      if (table === "brands")
        return selectChain({
          data: [
            { id: "b1", name: "Beta Brand", subscription_plan: "pro" },
            { id: "b2", name: "Alfa Brand", subscription_plan: "free" },
          ],
          error: null,
        });
      if (table === "city_business_model_overrides")
        return selectChain({
          data: [
            { brand_id: "b1" },
            { brand_id: "b1" }, // 2 cidades pra b1
          ],
          error: null,
        });
      return selectChain({ data: [] });
    });

    const { result } = renderHook(() => useBrandsWithGanhaGanha(), wrap());
    await waitFor(() => expect(result.current.data).toHaveLength(2));

    // Sorted por brand_name pt-BR
    expect(result.current.data![0].brand_name).toBe("Alfa Brand");
    expect(result.current.data![1].brand_name).toBe("Beta Brand");

    // b1: 2 cidades override + margin 12
    const beta = result.current.data!.find((b) => b.brand_id === "b1")!;
    expect(beta.cities_with_override).toBe(2);
    expect(beta.ganha_ganha_margin_pct).toBe(12);

    // b2: 0 cidades override + margin null
    const alfa = result.current.data!.find((b) => b.brand_id === "b2")!;
    expect(alfa.cities_with_override).toBe(0);
    expect(alfa.ganha_ganha_margin_pct).toBeNull();
  });

  it("brand sem nome: fallback '(sem nome)'", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "business_models")
        return selectChain({ data: { id: "bm-gg" }, error: null });
      if (table === "brand_business_models")
        return selectChain({
          data: [{ brand_id: "b1", ganha_ganha_margin_pct: null, is_enabled: true }],
          error: null,
        });
      if (table === "brands")
        return selectChain({
          data: [{ id: "b1", name: null, subscription_plan: null }],
          error: null,
        });
      return selectChain({ data: [] });
    });
    const { result } = renderHook(() => useBrandsWithGanhaGanha(), wrap());
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(result.current.data![0].brand_name).toBe("(sem nome)");
    expect(result.current.data![0].subscription_plan).toBe("free");
  });
});
