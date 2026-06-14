/**
 * usePacotesPontos + usePacotesPontosOrders + useCriarPacote +
 * useAtualizarPacote + useConfirmarPedido + useCancelarPedido — CRUD
 * de pacotes de pontos e pedidos.
 *
 * Bug aqui = brand_id null vaza pacotes de outro tenant, cancelar
 * pedido CONFIRMED dá erro silencioso, confirm sem user.id quebra audit.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const {
  mockFrom,
  mockRpc,
  mockUseBrandGuard,
  mockUseAuth,
  mockToastSuccess,
  mockToastError,
} = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockUseBrandGuard: vi.fn(),
  mockUseAuth: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}));

vi.mock("@/hooks/useBrandGuard", () => ({
  useBrandGuard: () => mockUseBrandGuard(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

import {
  usePacotesPontos,
  usePacotesPontosOrders,
  useCriarPacote,
  useAtualizarPacote,
  useConfirmarPedido,
  useCancelarPedido,
} from "../hook_pacotes_pontos";

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
}

function listChain(data: unknown[], error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error }),
  };
}

beforeEach(() => {
  mockFrom.mockReset();
  mockRpc.mockReset();
  mockUseBrandGuard.mockReset();
  mockUseBrandGuard.mockReturnValue({ currentBrandId: "b1" });
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue({ user: { id: "u1" } });
  mockToastSuccess.mockReset();
  mockToastError.mockReset();
});

// ────────────────────────────────────────────────────────
// usePacotesPontos (query)
// ────────────────────────────────────────────────────────
describe("usePacotesPontos", () => {
  it("currentBrandId null: query disabled", async () => {
    mockUseBrandGuard.mockReturnValue({ currentBrandId: null });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => usePacotesPontos(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("brand válido: fetcha pacotes ordenados por sort_order", async () => {
    mockFrom.mockReturnValue(listChain([{ id: "p1", name: "Bronze" }]));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => usePacotesPontos(), { wrapper });
    await waitFor(() => expect(result.current.packages).toHaveLength(1));
  });
});

// ────────────────────────────────────────────────────────
// usePacotesPontosOrders (query)
// ────────────────────────────────────────────────────────
describe("usePacotesPontosOrders", () => {
  it("brand válido: fetcha orders com joins", async () => {
    mockFrom.mockReturnValue(listChain([{ id: "ord1" }]));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => usePacotesPontosOrders(), { wrapper });
    await waitFor(() => expect(result.current.orders).toHaveLength(1));
  });
});

// ────────────────────────────────────────────────────────
// useCriarPacote (mutation)
// ────────────────────────────────────────────────────────
describe("useCriarPacote", () => {
  it("success: insert com brand_id + toast + invalida", async () => {
    let insertedPayload: Record<string, unknown> | null = null;
    mockFrom.mockReturnValue({
      insert: vi.fn((payload: Record<string, unknown>) => {
        insertedPayload = payload;
        return Promise.resolve({ error: null });
      }),
    });
    const { wrapper, queryClient } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCriarPacote(), { wrapper });

    result.current.mutate({ name: "Pacote A", points_amount: 100, price_cents: 5000 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(insertedPayload).toEqual({
      brand_id: "b1",
      name: "Pacote A",
      points_amount: 100,
      price_cents: 5000,
      description: null,
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringMatching(/criado com sucesso/));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["points-packages"] });
  });

  it("description vazia: vira null no DB", async () => {
    let insertedPayload: { description?: unknown } | null = null;
    mockFrom.mockReturnValue({
      insert: vi.fn((p: { description?: unknown }) => {
        insertedPayload = p;
        return Promise.resolve({ error: null });
      }),
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCriarPacote(), { wrapper });

    result.current.mutate({ name: "X", points_amount: 1, price_cents: 1, description: "" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(insertedPayload?.description).toBeNull();
  });

  it("error: toast.error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: "dup" } }),
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCriarPacote(), { wrapper });

    result.current.mutate({ name: "X", points_amount: 1, price_cents: 1 });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockToastError).toHaveBeenCalledWith(expect.stringMatching(/Erro ao criar/));
  });
});

// ────────────────────────────────────────────────────────
// useAtualizarPacote (mutation)
// ────────────────────────────────────────────────────────
describe("useAtualizarPacote", () => {
  it("success: update + invalida cache", async () => {
    let updatedPayload: Record<string, unknown> | null = null;
    let receivedEq: unknown[] = [];
    mockFrom.mockReturnValue({
      update: vi.fn((u: Record<string, unknown>) => {
        updatedPayload = u;
        return {
          eq: vi.fn((col: string, val: unknown) => {
            receivedEq = [col, val];
            return Promise.resolve({ error: null });
          }),
        };
      }),
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAtualizarPacote(), { wrapper });

    result.current.mutate({ id: "p1", name: "Renomeado", price_cents: 6000 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // id NÃO entra no update payload
    expect(updatedPayload).toEqual({ name: "Renomeado", price_cents: 6000 });
    expect(receivedEq).toEqual(["id", "p1"]);
  });

  it("error: toast.error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "fail" } }),
      }),
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAtualizarPacote(), { wrapper });

    result.current.mutate({ id: "p1", name: "X" });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockToastError).toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────
// useConfirmarPedido (mutation com RPC)
// ────────────────────────────────────────────────────────
describe("useConfirmarPedido", () => {
  it("success: RPC com user.id + invalida 3 caches", async () => {
    mockRpc.mockResolvedValue({ data: { success: true }, error: null });
    const { wrapper, queryClient } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useConfirmarPedido(), { wrapper });

    result.current.mutate("ord1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRpc).toHaveBeenCalledWith("confirm_package_order", {
      p_order_id: "ord1",
      p_confirmed_by: "u1",
    });
    const keys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["points-package-orders"]);
    expect(keys).toContainEqual(["branch-wallet"]);
    expect(keys).toContainEqual(["branch-dashboard-stats-v2"]);
  });

  it("RPC retorna success=false: throw com mensagem", async () => {
    mockRpc.mockResolvedValue({ data: { success: false, error: "Saldo insuficiente" }, error: null });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useConfirmarPedido(), { wrapper });

    result.current.mutate("ord1");
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Saldo insuficiente");
  });

  it("RPC error: toast.error", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "RLS denied" } });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useConfirmarPedido(), { wrapper });

    result.current.mutate("ord1");
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockToastError).toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────
// useCancelarPedido (mutation)
// ────────────────────────────────────────────────────────
describe("useCancelarPedido", () => {
  it("success: update CANCELLED + WHERE status=PENDING", async () => {
    let payload: unknown = null;
    const eqCalls: Array<[string, unknown]> = [];
    mockFrom.mockReturnValue({
      update: vi.fn((u: unknown) => {
        payload = u;
        return {
          eq: vi.fn(function (this: never, col: string, val: unknown) {
            eqCalls.push([col, val]);
            return eqCalls.length === 1 ? this : Promise.resolve({ error: null });
          }),
        };
      }),
    });
    const { wrapper, queryClient } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCancelarPedido(), { wrapper });

    result.current.mutate("ord1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(payload).toEqual({ status: "CANCELLED" });
    expect(eqCalls).toContainEqual(["id", "ord1"]);
    expect(eqCalls).toContainEqual(["status", "PENDING"]);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["points-package-orders"] });
  });

  it("error: toast.error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "fail" } }),
        }),
      }),
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCancelarPedido(), { wrapper });

    result.current.mutate("ord1");
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockToastError).toHaveBeenCalled();
  });
});
