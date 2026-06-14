/**
 * useConfirmDialog — controla state do AlertDialog de confirmação.
 * Bug aqui = "tem certeza?" abre sem callback (botão confirm não faz
 * nada), ou state preserva info antiga ao reabrir (mensagem errada).
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConfirmDialog } from "../useConfirmDialog";

describe("useConfirmDialog", () => {
  it("estado inicial: fechado, sem título/descrição", () => {
    const { result } = renderHook(() => useConfirmDialog());
    expect(result.current.state.open).toBe(false);
    expect(result.current.state.title).toBe("");
  });

  it("confirm() abre o dialog com opts + onConfirm callback", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.confirm({
        title: "Deletar?",
        description: "Esta ação é irreversível.",
        onConfirm: cb,
        confirmLabel: "Sim, deletar",
        variant: "destructive",
      });
    });

    expect(result.current.state).toMatchObject({
      open: true,
      title: "Deletar?",
      description: "Esta ação é irreversível.",
      confirmLabel: "Sim, deletar",
      variant: "destructive",
    });
    expect(result.current.state.onConfirm).toBe(cb);
  });

  it("close() fecha sem perder título/descrição (anim out)", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.confirm({
        title: "X",
        description: "Y",
        onConfirm: () => {},
      });
    });

    act(() => result.current.close());

    expect(result.current.state.open).toBe(false);
    expect(result.current.state.title).toBe("X"); // preserva
    expect(result.current.state.description).toBe("Y");
  });

  it("reabrir com novo confirm: sobrescreve título/descrição", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.confirm({
        title: "Primeiro",
        description: "A",
        onConfirm: () => {},
      });
    });

    act(() => {
      result.current.confirm({
        title: "Segundo",
        description: "B",
        onConfirm: () => {},
      });
    });

    expect(result.current.state.title).toBe("Segundo");
    expect(result.current.state.description).toBe("B");
  });

  it("identity das funções confirm/close estável entre renders", () => {
    const { result, rerender } = renderHook(() => useConfirmDialog());
    const firstConfirm = result.current.confirm;
    const firstClose = result.current.close;
    rerender();
    expect(result.current.confirm).toBe(firstConfirm);
    expect(result.current.close).toBe(firstClose);
  });
});
