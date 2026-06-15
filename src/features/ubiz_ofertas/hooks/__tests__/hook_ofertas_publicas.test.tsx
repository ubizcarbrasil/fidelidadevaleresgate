/**
 * useOfertasPublicas — combina ofertas + categorias do brand em uma
 * única query (cache 60s). Bug aqui = brandId null dispara query (RLS
 * error), carregando false quando categorias ainda carregando (UI
 * mostra grade vazia), staleTime errado refresh excessivo.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { mockBuscarOfertas, mockBuscarCategorias } = vi.hoisted(() => ({
  mockBuscarOfertas: vi.fn(),
  mockBuscarCategorias: vi.fn(),
}));

vi.mock("../../services/servico_ofertas_publicas", () => ({
  buscarOfertasAtivas: mockBuscarOfertas,
  buscarCategoriasAtivas: mockBuscarCategorias,
}));

import { useOfertasPublicas } from "../hook_ofertas_publicas";

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mockBuscarOfertas.mockReset();
  mockBuscarCategorias.mockReset();
});

describe("useOfertasPublicas", () => {
  it("brandId null: queries disabled, retorna arrays vazios", async () => {
    const { result } = renderHook(() => useOfertasPublicas(null), { wrapper });
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.ofertas).toEqual([]);
    expect(result.current.categorias).toEqual([]);
    expect(mockBuscarOfertas).not.toHaveBeenCalled();
    expect(mockBuscarCategorias).not.toHaveBeenCalled();
  });

  it("brandId válido: combina ofertas + categorias", async () => {
    mockBuscarOfertas.mockResolvedValue([{ id: "o1" }, { id: "o2" }]);
    mockBuscarCategorias.mockResolvedValue([{ id: "c1" }]);

    const { result } = renderHook(() => useOfertasPublicas("b1"), { wrapper });
    await waitFor(() => expect(result.current.ofertas).toHaveLength(2));
    expect(result.current.categorias).toHaveLength(1);
    expect(mockBuscarOfertas).toHaveBeenCalledWith("b1");
    expect(mockBuscarCategorias).toHaveBeenCalledWith("b1");
  });

  it("carregando=true enquanto QUALQUER query loading", async () => {
    let resolveOfertas!: (v: unknown[]) => void;
    mockBuscarOfertas.mockImplementation(
      () => new Promise<unknown[]>((r) => { resolveOfertas = r; }),
    );
    mockBuscarCategorias.mockResolvedValue([]);

    const { result } = renderHook(() => useOfertasPublicas("b1"), { wrapper });
    await waitFor(() => expect(result.current.carregando).toBe(true));
    resolveOfertas([]);
    await waitFor(() => expect(result.current.carregando).toBe(false));
  });

  it("data null: ofertas/categorias retornam [] (não null)", async () => {
    mockBuscarOfertas.mockResolvedValue(undefined as never);
    mockBuscarCategorias.mockResolvedValue(undefined as never);

    const { result } = renderHook(() => useOfertasPublicas("b1"), { wrapper });
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.ofertas).toEqual([]);
    expect(result.current.categorias).toEqual([]);
  });
});
