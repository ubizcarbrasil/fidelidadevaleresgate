/**
 * hook_modelos_negocio_resolvidos — resolução de Business Models via
 * RPC resolve_active_business_models. Mesmo padrão de hook_modulos_resolvidos
 * mas pra Business Models (sub-fase 5.2 do roadmap).
 *
 * Bug aqui = modelo de negócio errado aparece (cobrança quebrada, fluxo
 * de cidade vs marca desalinhado).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { mockRpc, mockChannel } = vi.hoisted(() => {
  const channelObj = {
    on: vi.fn(() => channelObj),
    subscribe: vi.fn(() => channelObj),
  };
  return {
    mockRpc: vi.fn(),
    mockChannel: vi.fn(() => channelObj),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: mockRpc,
    channel: mockChannel,
    removeChannel: vi.fn(),
  },
}));

import { useResolvedBusinessModels } from "../hook_modelos_negocio_resolvidos";

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
  mockRpc.mockReset();
  mockChannel.mockClear();
});

describe("useResolvedBusinessModels — guards", () => {
  it("brandId null: retorna defaults vazios", () => {
    const { result } = renderHook(() => useResolvedBusinessModels(null), wrap());
    expect(result.current.models).toEqual({});
    expect(result.current.definitions).toEqual([]);
    expect(result.current.isModelEnabled("fidelidade")).toBe(false);
  });

  it("brandId undefined: idem", () => {
    const { result } = renderHook(() => useResolvedBusinessModels(undefined), wrap());
    expect(result.current.isModelEnabled("any")).toBe(false);
  });
});

describe("useResolvedBusinessModels — RPC + mapping", () => {
  it("chama RPC resolve_active_business_models com brandId+branchId", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    renderHook(() => useResolvedBusinessModels("b1", "br1"), wrap());
    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(mockRpc).toHaveBeenCalledWith("resolve_active_business_models", {
      p_brand_id: "b1",
      p_branch_id: "br1",
    });
  });

  it("branchId omitido: passa undefined", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    renderHook(() => useResolvedBusinessModels("b1"), wrap());
    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(mockRpc.mock.calls[0][1].p_branch_id).toBeUndefined();
  });

  it("mapeia rows pra enabledMap + definitions", async () => {
    mockRpc.mockResolvedValue({
      data: [
        { model_key: "fidelidade", is_enabled: true, source: "core" },
        { model_key: "campeonato", is_enabled: false, source: "brand" },
      ],
      error: null,
    });

    const { result } = renderHook(() => useResolvedBusinessModels("b1"), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.models).toEqual({
      fidelidade: true,
      campeonato: false,
    });
    expect(result.current.definitions).toEqual([
      { key: "fidelidade", source: "core" },
      { key: "campeonato", source: "brand" },
    ]);
  });

  it("data null: enabledMap vazio (não throw)", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useResolvedBusinessModels("b1"), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.models).toEqual({});
  });

  it("erro RPC: query marca isError, modelos fica vazio", async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error("denied") });
    const { result } = renderHook(() => useResolvedBusinessModels("b1"), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.models).toEqual({});
  });
});

describe("isModelEnabled — defensive", () => {
  it("modelo não no mapa: retorna false (não undefined)", async () => {
    mockRpc.mockResolvedValue({
      data: [{ model_key: "fidelidade", is_enabled: true, source: "core" }],
      error: null,
    });
    const { result } = renderHook(() => useResolvedBusinessModels("b1"), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isModelEnabled("inexistente")).toBe(false);
  });

  it("modelo habilitado: true", async () => {
    mockRpc.mockResolvedValue({
      data: [{ model_key: "f", is_enabled: true, source: "x" }],
      error: null,
    });
    const { result } = renderHook(() => useResolvedBusinessModels("b1"), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isModelEnabled("f")).toBe(true);
  });

  it("modelo explicitamente false: false", async () => {
    mockRpc.mockResolvedValue({
      data: [{ model_key: "f", is_enabled: false, source: "x" }],
      error: null,
    });
    const { result } = renderHook(() => useResolvedBusinessModels("b1"), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isModelEnabled("f")).toBe(false);
  });
});

describe("Realtime", () => {
  it("cria channel com brandId+branchId no nome", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    renderHook(() => useResolvedBusinessModels("b1", "br1"), wrap());
    await waitFor(() => expect(mockChannel).toHaveBeenCalled());
    expect(mockChannel.mock.calls[0][0]).toContain("b1");
    expect(mockChannel.mock.calls[0][0]).toContain("br1");
  });

  it("brandId null: NÃO cria channel", () => {
    renderHook(() => useResolvedBusinessModels(null), wrap());
    expect(mockChannel).not.toHaveBeenCalled();
  });
});
