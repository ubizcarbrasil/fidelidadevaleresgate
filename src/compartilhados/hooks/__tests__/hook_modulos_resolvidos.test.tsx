/**
 * hook_modulos_resolvidos — resolução de módulos ativos por cascata
 * (cidade > marca > is_core). Bug aqui = módulo desabilitado aparece
 * na sidebar (item morto) OU módulo habilitado some (UX quebrada).
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

import { useResolvedModules } from "../hook_modulos_resolvidos";

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

describe("useResolvedModules — guards", () => {
  it("brandId null: enabled=false, retorna defaults", () => {
    const { result } = renderHook(() => useResolvedModules(null), wrap());
    expect(result.current.modules).toEqual({});
    expect(result.current.definitions).toEqual([]);
    expect(result.current.isModuleEnabled("loyalty")).toBe(false);
  });

  it("brandId undefined: também desabilita", () => {
    const { result } = renderHook(() => useResolvedModules(undefined), wrap());
    expect(result.current.isModuleEnabled("any")).toBe(false);
  });
});

describe("useResolvedModules — RPC + mapping", () => {
  it("mapeia rows da RPC pra enabledMap + definitions", async () => {
    mockRpc.mockResolvedValue({
      data: [
        { module_key: "loyalty", is_enabled: true, source: "core" },
        { module_key: "campaign", is_enabled: false, source: "brand" },
        { module_key: "vouchers", is_enabled: true, source: "city" },
      ],
      error: null,
    });

    const { result } = renderHook(() => useResolvedModules("b1"), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.modules).toEqual({
      loyalty: true,
      campaign: false,
      vouchers: true,
    });
    expect(result.current.definitions).toEqual([
      { key: "loyalty", source: "core" },
      { key: "campaign", source: "brand" },
      { key: "vouchers", source: "city" },
    ]);
  });

  it("chama RPC com brand_id + branch_id (quando passado)", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    renderHook(() => useResolvedModules("b1", "br1"), wrap());
    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(mockRpc).toHaveBeenCalledWith("resolve_active_modules", {
      p_brand_id: "b1",
      p_branch_id: "br1",
    });
  });

  it("branchId omitido: passa undefined pro RPC", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    renderHook(() => useResolvedModules("b1"), wrap());
    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(mockRpc.mock.calls[0][1].p_branch_id).toBeUndefined();
  });

  it("data null: enabledMap vazio (não throw)", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useResolvedModules("b1"), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.modules).toEqual({});
  });

  it("RPC erro: query marca como error, modules fica vazio", async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error("denied") });
    const { result } = renderHook(() => useResolvedModules("b1"), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.modules).toEqual({});
  });
});

describe("isModuleEnabled — defensive defaults", () => {
  it("módulo não no mapa: retorna false (não undefined)", async () => {
    mockRpc.mockResolvedValue({
      data: [{ module_key: "loyalty", is_enabled: true, source: "core" }],
      error: null,
    });
    const { result } = renderHook(() => useResolvedModules("b1"), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isModuleEnabled("desconhecido")).toBe(false);
  });

  it("módulo explicitamente desabilitado: retorna false", async () => {
    mockRpc.mockResolvedValue({
      data: [{ module_key: "loyalty", is_enabled: false, source: "brand" }],
      error: null,
    });
    const { result } = renderHook(() => useResolvedModules("b1"), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isModuleEnabled("loyalty")).toBe(false);
  });

  it("módulo habilitado: retorna true", async () => {
    mockRpc.mockResolvedValue({
      data: [{ module_key: "loyalty", is_enabled: true, source: "core" }],
      error: null,
    });
    const { result } = renderHook(() => useResolvedModules("b1"), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isModuleEnabled("loyalty")).toBe(true);
  });
});

describe("Realtime subscription", () => {
  it("cria channel com nome que inclui brandId + branchId (cache key)", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    renderHook(() => useResolvedModules("b1", "br1"), wrap());
    await waitFor(() => expect(mockChannel).toHaveBeenCalled());
    expect(mockChannel.mock.calls[0][0]).toContain("b1");
    expect(mockChannel.mock.calls[0][0]).toContain("br1");
  });

  it("sem branchId: usa sufixo 'no-branch' no channel name", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    renderHook(() => useResolvedModules("b1"), wrap());
    await waitFor(() => expect(mockChannel).toHaveBeenCalled());
    expect(mockChannel.mock.calls[0][0]).toContain("no-branch");
  });

  it("brandId null: NÃO cria channel", () => {
    renderHook(() => useResolvedModules(null), wrap());
    expect(mockChannel).not.toHaveBeenCalled();
  });
});
