import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHookPaginacao } from "../hook_paginacao";

const gerar = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("useHookPaginacao", () => {
  it("limita itens visíveis ao tamanho da página", () => {
    const { result } = renderHook(() =>
      useHookPaginacao(gerar(55), { itensPorPagina: 20 }),
    );
    expect(result.current.itensVisiveis).toHaveLength(20);
    expect(result.current.itensVisiveis[0]).toBe(1);
    expect(result.current.itensVisiveis[19]).toBe(20);
  });

  it("calcula totalPaginas como ceil(total / itensPorPagina)", () => {
    const { result } = renderHook(() =>
      useHookPaginacao(gerar(55), { itensPorPagina: 20 }),
    );
    expect(result.current.totalPaginas).toBe(3);
    expect(result.current.totalItens).toBe(55);
  });

  it("muda os itens visíveis ao avançar de página", () => {
    const { result } = renderHook(() =>
      useHookPaginacao(gerar(55), { itensPorPagina: 20 }),
    );
    act(() => result.current.irParaPagina(2));
    expect(result.current.paginaAtual).toBe(2);
    expect(result.current.itensVisiveis[0]).toBe(21);
    expect(result.current.itensVisiveis).toHaveLength(20);
  });

  it("trava o irParaPagina dentro do range válido", () => {
    const { result } = renderHook(() =>
      useHookPaginacao(gerar(55), { itensPorPagina: 20 }),
    );
    act(() => result.current.irParaPagina(99));
    expect(result.current.paginaAtual).toBe(3);
    act(() => result.current.irParaPagina(-5));
    expect(result.current.paginaAtual).toBe(1);
  });

  it("reseta para página 1 quando o total muda (após filtro)", () => {
    const { result, rerender } = renderHook(
      ({ itens }) => useHookPaginacao(itens, { itensPorPagina: 20 }),
      { initialProps: { itens: gerar(55) } },
    );
    act(() => result.current.irParaPagina(3));
    expect(result.current.paginaAtual).toBe(3);

    rerender({ itens: gerar(10) });
    expect(result.current.paginaAtual).toBe(1);
    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.itensVisiveis).toHaveLength(10);
  });

  it("retorna 1 página mesmo quando a lista está vazia", () => {
    const { result } = renderHook(() =>
      useHookPaginacao([], { itensPorPagina: 20 }),
    );
    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.totalItens).toBe(0);
    expect(result.current.itensVisiveis).toEqual([]);
  });
});