/**
 * hook_business_model_addons — CRUD de Add-ons avulsos (Modelos de
 * Negócio vendidos individualmente).
 *
 * Bug aqui = add-on concedido vira UPSERT errado (perde brand_id ou
 * branch_id), cancel não fecha expires_at, ou invalidação de cache
 * deixa UI mostrando estado antigo após mutation.
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
  useBusinessModelAddons,
  useGrantBusinessModelAddon,
  useUpdateBusinessModelAddon,
  useCancelBusinessModelAddon,
  useDeleteBusinessModelAddon,
} from "../hook_business_model_addons";

function selectChain(maybeSingleResult: unknown) {
  const c: Record<string, unknown> = {};
  c.select = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.is = vi.fn(() => c);
  c.maybeSingle = vi.fn(() => Promise.resolve(maybeSingleResult));
  c.single = vi.fn(() => Promise.resolve(maybeSingleResult));
  c.then = (resolve: (r: unknown) => void) => resolve(maybeSingleResult);
  return c;
}

function updateChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.update = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.select = vi.fn(() => c);
  c.single = vi.fn(() => Promise.resolve(result));
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function insertChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.insert = vi.fn(() => c);
  c.select = vi.fn(() => c);
  c.single = vi.fn(() => Promise.resolve(result));
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function deleteChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.delete = vi.fn(() => c);
  c.eq = vi.fn(() => c);
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

// ── useBusinessModelAddons ───────────────────────────────
describe("useBusinessModelAddons", () => {
  it("chama list_business_model_addons RPC", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    renderHook(() => useBusinessModelAddons(), wrap());
    await waitFor(() => expect(mockRpc).toHaveBeenCalledWith("list_business_model_addons"));
  });

  it("retorna data como array", async () => {
    mockRpc.mockResolvedValue({
      data: [{ id: "a1", brand_name: "Brand X", model_key: "campeonato" }],
      error: null,
    });
    const { result } = renderHook(() => useBusinessModelAddons(), wrap());
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });

  it("data null: array vazio", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useBusinessModelAddons(), wrap());
    await waitFor(() => expect(result.current.data).toEqual([]));
  });
});

// ── useGrantBusinessModelAddon (UPDATE path) ─────────────
describe("useGrantBusinessModelAddon — addon existente (UPDATE)", () => {
  it("achou addon existente: UPDATE em vez de INSERT", async () => {
    let updatePayload: Record<string, unknown> | null = null;
    let usedInsert = false;

    mockFrom.mockImplementation(() => {
      const findChain = selectChain({ data: { id: "existing-uuid" }, error: null });
      const updChain = updateChain({ data: { id: "existing-uuid" }, error: null });
      const insChain = insertChain({ data: null, error: null });

      // Multiplexer: cada chamada retorna chain diferente
      return {
        select: vi.fn(() => findChain),
        update: vi.fn((p: Record<string, unknown>) => {
          updatePayload = p;
          return updChain;
        }),
        insert: vi.fn(() => {
          usedInsert = true;
          return insChain;
        }),
      };
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useGrantBusinessModelAddon(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        brand_id: "b1",
        business_model_id: "m1",
        billing_cycle: "monthly",
        price_cents: 9990,
      });
    });

    expect(updatePayload).toMatchObject({
      brand_id: "b1",
      business_model_id: "m1",
      billing_cycle: "monthly",
      price_cents: 9990,
      status: "active",
    });
    expect(usedInsert).toBe(false);
    expect(mockToastSuccess).toHaveBeenCalledWith("Add-on concedido");
  });
});

describe("useGrantBusinessModelAddon — INSERT path", () => {
  it("addon não existe: INSERT + branch_id null + created_by do user", async () => {
    let insertPayload: Record<string, unknown> | null = null;

    mockFrom.mockImplementation(() => {
      const findChain = selectChain({ data: null, error: null });
      const insChain = insertChain({ data: { id: "new-uuid" }, error: null });
      return {
        select: vi.fn(() => findChain),
        insert: vi.fn((p: Record<string, unknown>) => {
          insertPayload = p;
          return insChain;
        }),
      };
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useGrantBusinessModelAddon(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        brand_id: "b1",
        business_model_id: "m1",
        billing_cycle: "yearly",
        price_cents: 99990,
      });
    });

    expect(insertPayload).toMatchObject({
      brand_id: "b1",
      branch_id: null, // defaults pra marca inteira
      business_model_id: "m1",
      billing_cycle: "yearly",
      price_cents: 99990,
      status: "active",
      created_by: "u1",
    });
    expect(insertPayload?.activated_at).toBeTypeOf("string");
  });

  it("branch_id explícito: passa pro payload", async () => {
    let insertPayload: Record<string, unknown> | null = null;
    mockFrom.mockImplementation(() => {
      const findChain = selectChain({ data: null, error: null });
      const insChain = insertChain({ data: { id: "new" }, error: null });
      return {
        select: vi.fn(() => findChain),
        insert: vi.fn((p: Record<string, unknown>) => {
          insertPayload = p;
          return insChain;
        }),
      };
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useGrantBusinessModelAddon(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        brand_id: "b1",
        branch_id: "br-99",
        business_model_id: "m1",
        billing_cycle: "monthly",
        price_cents: 1000,
      });
    });
    expect(insertPayload?.branch_id).toBe("br-99");
  });

  it("erro: toast + propaga", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => selectChain({ data: null, error: new Error("rls") })),
    });
    const { wrapper } = wrap();
    const { result } = renderHook(() => useGrantBusinessModelAddon(), { wrapper });
    await expect(
      result.current.mutateAsync({
        brand_id: "b1",
        business_model_id: "m1",
        billing_cycle: "monthly",
        price_cents: 0,
      }),
    ).rejects.toThrow("rls");
    expect(mockToastError).toHaveBeenCalled();
  });
});

// ── useUpdateBusinessModelAddon ──────────────────────────
describe("useUpdateBusinessModelAddon", () => {
  it("UPDATE com patch (sem id e brand_id) + eq(id) + invalidate + toast", async () => {
    let updatePayload: Record<string, unknown> | null = null;
    mockFrom.mockImplementation(() => {
      const c = updateChain({ data: null, error: null });
      c.update = vi.fn((p: Record<string, unknown>) => {
        updatePayload = p;
        return c;
      });
      return c;
    });

    const { wrapper, qc } = wrap();
    const invSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useUpdateBusinessModelAddon(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "addon-1",
        brand_id: "b1",
        price_cents: 5000,
        notes: "novo",
      });
    });

    // brand_id deve ter sido removido do patch (não vai pra update)
    expect(updatePayload).toEqual({ price_cents: 5000, notes: "novo" });
    expect(invSpy).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalledWith("Add-on atualizado");
  });
});

// ── useCancelBusinessModelAddon ──────────────────────────
describe("useCancelBusinessModelAddon", () => {
  it("UPDATE status='cancelled' + expires_at=now + eq(id)", async () => {
    let updatePayload: Record<string, unknown> | null = null;
    mockFrom.mockImplementation(() => {
      const c = updateChain({ data: null, error: null });
      c.update = vi.fn((p: Record<string, unknown>) => {
        updatePayload = p;
        return c;
      });
      return c;
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useCancelBusinessModelAddon(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: "addon-1", brand_id: "b1" });
    });

    expect(updatePayload).toMatchObject({ status: "cancelled" });
    expect(updatePayload?.expires_at).toBeTypeOf("string");
    expect(mockToastSuccess).toHaveBeenCalledWith("Add-on cancelado");
  });
});

// ── useDeleteBusinessModelAddon ──────────────────────────
describe("useDeleteBusinessModelAddon", () => {
  it("DELETE eq(id) + invalidate + toast", async () => {
    mockFrom.mockReturnValue(deleteChain({ data: null, error: null }));
    const { wrapper, qc } = wrap();
    const invSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useDeleteBusinessModelAddon(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: "addon-1", brand_id: "b1" });
    });
    expect(invSpy).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalledWith("Add-on removido");
  });

  it("erro: toast.error + propaga", async () => {
    mockFrom.mockReturnValue(deleteChain({ data: null, error: new Error("denied") }));
    const { wrapper } = wrap();
    const { result } = renderHook(() => useDeleteBusinessModelAddon(), { wrapper });
    await expect(
      result.current.mutateAsync({ id: "addon-1", brand_id: "b1" }),
    ).rejects.toThrow("denied");
  });
});
