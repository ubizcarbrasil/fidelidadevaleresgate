/**
 * useDetalhesLead / useNotasLead / useAtualizarStatusLead /
 * useCriarNotaLead / useAtualizarCamposLead — hooks de CRUD da página
 * de detalhes do lead.
 *
 * Bug aqui = mutation success não invalida cache (lista fica stale),
 * leadId undefined dispara query (RLS error), toast erro vaza stack
 * trace pro usuário.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const {
  mockBuscar,
  mockListarNotas,
  mockAtualizarStatus,
  mockCriarNota,
  mockAtualizarCampos,
  mockToastSuccess,
  mockToastError,
} = vi.hoisted(() => ({
  mockBuscar: vi.fn(),
  mockListarNotas: vi.fn(),
  mockAtualizarStatus: vi.fn(),
  mockCriarNota: vi.fn(),
  mockAtualizarCampos: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("../../services/servico_detalhes_lead", () => ({
  buscarLeadPorId: mockBuscar,
  listarNotasLead: mockListarNotas,
  atualizarStatusLead: mockAtualizarStatus,
  criarNotaLead: mockCriarNota,
  atualizarCamposLead: mockAtualizarCampos,
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

import {
  useDetalhesLead,
  useNotasLead,
  useAtualizarStatusLead,
  useCriarNotaLead,
  useAtualizarCamposLead,
} from "../hook_detalhes_lead";

function makeWrapper(): { wrapper: React.FC<{ children: React.ReactNode }>; queryClient: QueryClient } {
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

beforeEach(() => {
  mockBuscar.mockReset();
  mockListarNotas.mockReset();
  mockAtualizarStatus.mockReset();
  mockCriarNota.mockReset();
  mockAtualizarCampos.mockReset();
  mockToastSuccess.mockReset();
  mockToastError.mockReset();
});

// ────────────────────────────────────────────────────────
// useDetalhesLead
// ────────────────────────────────────────────────────────
describe("useDetalhesLead", () => {
  it("leadId undefined: query disabled", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDetalhesLead(undefined), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockBuscar).not.toHaveBeenCalled();
  });

  it("leadId válido: fetcha buscarLeadPorId", async () => {
    mockBuscar.mockResolvedValue({ id: "l1", full_name: "Maria" });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDetalhesLead("l1"), { wrapper });
    await waitFor(() => expect(result.current.data?.id).toBe("l1"));
  });
});

// ────────────────────────────────────────────────────────
// useNotasLead
// ────────────────────────────────────────────────────────
describe("useNotasLead", () => {
  it("leadId vazio: disabled", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useNotasLead(""), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockListarNotas).not.toHaveBeenCalled();
  });

  it("leadId válido: fetcha listarNotasLead", async () => {
    mockListarNotas.mockResolvedValue([{ id: "n1" }, { id: "n2" }]);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useNotasLead("l1"), { wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(2));
  });
});

// ────────────────────────────────────────────────────────
// useAtualizarStatusLead
// ────────────────────────────────────────────────────────
describe("useAtualizarStatusLead", () => {
  it("success: toast.success + invalida 3 caches", async () => {
    mockAtualizarStatus.mockResolvedValue(undefined);
    const { wrapper, queryClient } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAtualizarStatusLead("l1"), { wrapper });

    result.current.mutate("convertido" as never);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringMatching(/Status atualizado/));
    // 3 invalidações: detalhe + notas + lista
    const keys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toEqual(expect.arrayContaining([
      ["lead_comercial_detalhe", "l1"],
      ["lead_comercial_notas", "l1"],
      ["leads_comerciais"],
    ]));
  });

  it("error: toast.error com mensagem do error", async () => {
    mockAtualizarStatus.mockRejectedValue(new Error("RLS denied"));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAtualizarStatusLead("l1"), { wrapper });

    result.current.mutate("contatado" as never);
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringMatching(/Erro ao atualizar/),
      expect.objectContaining({ description: "RLS denied" }),
    );
  });
});

// ────────────────────────────────────────────────────────
// useCriarNotaLead
// ────────────────────────────────────────────────────────
describe("useCriarNotaLead", () => {
  it("success: toast + invalida notas cache", async () => {
    mockCriarNota.mockResolvedValue(undefined);
    const { wrapper, queryClient } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCriarNotaLead("l1"), { wrapper });

    result.current.mutate("Anotação X");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockCriarNota).toHaveBeenCalledWith({ leadId: "l1", conteudo: "Anotação X" });
    expect(mockToastSuccess).toHaveBeenCalledWith("Nota registrada");
    const keys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["lead_comercial_notas", "l1"]);
  });

  it("error: toast.error com mensagem", async () => {
    mockCriarNota.mockRejectedValue(new Error("Conteúdo vazio"));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCriarNotaLead("l1"), { wrapper });

    result.current.mutate("");
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringMatching(/Erro ao salvar/),
      expect.objectContaining({ description: "Conteúdo vazio" }),
    );
  });
});

// ────────────────────────────────────────────────────────
// useAtualizarCamposLead
// ────────────────────────────────────────────────────────
describe("useAtualizarCamposLead", () => {
  it("success: toast + invalida detalhe + lista (2 caches)", async () => {
    mockAtualizarCampos.mockResolvedValue(undefined);
    const { wrapper, queryClient } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAtualizarCamposLead("l1"), { wrapper });

    result.current.mutate({ full_name: "Maria" } as never);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["lead_comercial_detalhe", "l1"]);
    expect(keys).toContainEqual(["leads_comerciais"]);
  });

  it("error: toast.error", async () => {
    mockAtualizarCampos.mockRejectedValue(new Error("Validation failed"));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAtualizarCamposLead("l1"), { wrapper });

    result.current.mutate({ work_email: "invalid" } as never);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockToastError).toHaveBeenCalled();
  });
});
