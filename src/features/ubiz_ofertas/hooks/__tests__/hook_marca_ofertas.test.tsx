/**
 * useMarcaOfertas — resolve marca pra vitrine /ofertas.
 * Prioridade: ?brandId > hostname portal > brand_domains > erro.
 *
 * Bug aqui = portal hostname não resolvido vaza pra fallback brand_domains
 * (cria query inútil), ?brandId não bate com brand existente fica em loop
 * eterno, erro do backend não aparece pro usuário.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const { mockBuscarBrandId, mockBuscarMarca } = vi.hoisted(() => ({
  mockBuscarBrandId: vi.fn(),
  mockBuscarMarca: vi.fn(),
}));

vi.mock("../../services/servico_ofertas_publicas", () => ({
  buscarBrandIdPorHostname: mockBuscarBrandId,
  buscarMarcaPorId: mockBuscarMarca,
}));

import { useMarcaOfertas } from "../hook_marca_ofertas";

function makeWrapper(initialEntries: string[] = ["/"]) {
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
}

function setLocation(hostname: string) {
  Object.defineProperty(window, "location", {
    writable: true,
    configurable: true,
    value: { hostname, pathname: "/", search: "", origin: `https://${hostname}` },
  });
}

beforeEach(() => {
  mockBuscarBrandId.mockReset();
  mockBuscarMarca.mockReset();
});

describe("useMarcaOfertas — ?brandId param (prioridade 1)", () => {
  it("?brandId=X: usa direto, não consulta hostname", async () => {
    setLocation("preview--xyz.lovableproject.com");
    mockBuscarMarca.mockResolvedValue({ id: "b-from-param", name: "Marca Param" });
    const { result } = renderHook(() => useMarcaOfertas(), {
      wrapper: makeWrapper(["/ofertas?brandId=b-from-param"]),
    });
    await waitFor(() => expect(result.current.marca?.id).toBe("b-from-param"));
    expect(mockBuscarBrandId).not.toHaveBeenCalled();
  });
});

describe("useMarcaOfertas — portal hostname (prioridade 2)", () => {
  it("hostname app.valeresgate.com.br: usa PORTAL_BRAND_ID hardcoded", async () => {
    setLocation("app.valeresgate.com.br");
    mockBuscarMarca.mockResolvedValue({ id: "db15bd21-9137-4965-a0fb-540d8e8b26f1", name: "Ubiz Portal" });
    const { result } = renderHook(() => useMarcaOfertas(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.marca?.name).toBe("Ubiz Portal"));
    expect(mockBuscarBrandId).not.toHaveBeenCalled();
    expect(mockBuscarMarca).toHaveBeenCalledWith("db15bd21-9137-4965-a0fb-540d8e8b26f1");
  });
});

describe("useMarcaOfertas — brand_domains (prioridade 3)", () => {
  it("hostname desconhecido: resolve via brand_domains", async () => {
    setLocation("pizza.valeresgate.com.br");
    mockBuscarBrandId.mockResolvedValue("b-pizza");
    mockBuscarMarca.mockResolvedValue({ id: "b-pizza", name: "Pizza" });
    const { result } = renderHook(() => useMarcaOfertas(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.marca?.id).toBe("b-pizza"));
    expect(mockBuscarBrandId).toHaveBeenCalledWith("pizza.valeresgate.com.br");
  });

  it("hostname não encontrado: erro 'Não foi possível identificar'", async () => {
    setLocation("desconhecido.com");
    mockBuscarBrandId.mockResolvedValue(null);
    const { result } = renderHook(() => useMarcaOfertas(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.erro).toMatch(/Não foi possível identificar/));
    expect(result.current.carregando).toBe(false);
  });

  it("buscarBrandIdPorHostname throw: erro fallback", async () => {
    setLocation("desconhecido.com");
    mockBuscarBrandId.mockRejectedValue(new Error("RPC failed"));
    const { result } = renderHook(() => useMarcaOfertas(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.erro).toMatch(/Não foi possível identificar/));
  });
});

describe("useMarcaOfertas — buscarMarcaPorId errors", () => {
  it("marca não encontrada: erro 'Marca não encontrada'", async () => {
    setLocation("app.valeresgate.com.br");
    mockBuscarMarca.mockResolvedValue(null);
    const { result } = renderHook(() => useMarcaOfertas(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.erro).toBe("Marca não encontrada"));
  });

  it("buscarMarca throw com message: propaga", async () => {
    setLocation("app.valeresgate.com.br");
    mockBuscarMarca.mockRejectedValue(new Error("DB down"));
    const { result } = renderHook(() => useMarcaOfertas(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.erro).toBe("DB down"));
  });

  it("buscarMarca throw sem message: fallback 'Erro ao carregar marca'", async () => {
    setLocation("app.valeresgate.com.br");
    mockBuscarMarca.mockRejectedValue({});
    const { result } = renderHook(() => useMarcaOfertas(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.erro).toBe("Erro ao carregar marca"));
  });
});
