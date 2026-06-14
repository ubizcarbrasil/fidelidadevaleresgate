/**
 * hook_formatos_permitidos — formatos de engajamento liberados por brand.
 *
 * Bug aqui:
 *   - Formato desconhecido vaza pra UI (botão aparece, falha ao usar)
 *   - Default sem registro: deveria ser todos liberados (3) — bug =
 *     vazio (zero opções)
 *   - Mutation root-only sem feedback de toast
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
  useFormatosPermitidos,
  useDefinirFormatosPermitidos,
} from "../hook_formatos_permitidos";

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

// ── useFormatosPermitidos ────────────────────────────────
describe("useFormatosPermitidos", () => {
  it("brandId null: enabled=false, retorna todos como fallback", () => {
    const { result } = renderHook(() => useFormatosPermitidos(null), wrap());
    expect(result.current.formatos).toEqual(["duelo", "mass_duel", "campeonato"]);
  });

  it("retorna formatos do RPC", async () => {
    mockRpc.mockResolvedValue({ data: ["duelo", "campeonato"], error: null });
    const { result } = renderHook(() => useFormatosPermitidos("b1"), wrap());
    await waitFor(() => expect(result.current.formatos).toEqual(["duelo", "campeonato"]));
  });

  it("RPC retorna null: usa default (todos os 3)", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useFormatosPermitidos("b1"), wrap());
    await waitFor(() => expect(result.current.formatos).toEqual(["duelo", "mass_duel", "campeonato"]));
  });

  it("RPC retorna formato desconhecido: FILTRA (não vaza pra UI)", async () => {
    mockRpc.mockResolvedValue({
      data: ["duelo", "torneio_invalido", "mass_duel"],
      error: null,
    });
    const { result } = renderHook(() => useFormatosPermitidos("b1"), wrap());
    await waitFor(() => expect(result.current.formatos).toEqual(["duelo", "mass_duel"]));
  });

  it("RPC retorna []: array vazio preserva (sem fallback)", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => useFormatosPermitidos("b1"), wrap());
    await waitFor(() => expect(result.current.formatos).toEqual([]));
  });

  it("Erro RPC: data fica undefined → fallback TODOS", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "denied" } });
    const { result } = renderHook(() => useFormatosPermitidos("b1"), wrap());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.formatos).toEqual(["duelo", "mass_duel", "campeonato"]);
  });
});

// ── useDefinirFormatosPermitidos ─────────────────────────
describe("useDefinirFormatosPermitidos", () => {
  it("sucesso: chama RPC com brand+formats + toast.success + invalidate", async () => {
    mockRpc.mockResolvedValue({ data: { ok: true }, error: null });
    const { wrapper, qc } = wrap();
    const invSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(() => useDefinirFormatosPermitidos(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        brandId: "b1",
        formatos: ["duelo", "mass_duel"],
      });
    });

    expect(mockRpc).toHaveBeenCalledWith("campeonato_set_allowed_formats", {
      p_brand_id: "b1",
      p_formats: ["duelo", "mass_duel"],
    });
    expect(mockToastSuccess).toHaveBeenCalledOnce();
    // 2 invalidates: duelo-allowed-formats + duelo-engagement-format
    expect(invSpy).toHaveBeenCalledTimes(2);
  });

  it("erro: toast.error com message", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Only root_admin can set formats" },
    });
    const { wrapper } = wrap();
    const { result } = renderHook(() => useDefinirFormatosPermitidos(), { wrapper });

    await expect(
      result.current.mutateAsync({ brandId: "b1", formatos: ["duelo"] }),
    ).rejects.toMatchObject({ message: "Only root_admin can set formats" });

    expect(mockToastError).toHaveBeenCalledOnce();
    expect(mockToastError.mock.calls[0][0]).toContain("Only root_admin");
  });

  it("erro sem message: usa mensagem default", async () => {
    mockRpc.mockResolvedValue({ data: null, error: {} });
    const { wrapper } = wrap();
    const { result } = renderHook(() => useDefinirFormatosPermitidos(), { wrapper });

    await expect(
      result.current.mutateAsync({ brandId: "b1", formatos: [] }),
    ).rejects.toMatchObject({});

    expect(mockToastError.mock.calls[0][0]).toBe("Erro ao atualizar formatos liberados");
  });
});
