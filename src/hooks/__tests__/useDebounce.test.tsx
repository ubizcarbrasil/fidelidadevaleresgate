/**
 * useDebounce + useDebouncedSearch — debounce de input + pagination reset.
 *
 * Bug aqui = busca atrasada/perdida, ou page não reseta ao trocar busca
 * (admin vê resultado vazio).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../useDebounce";
import { useDebouncedSearch } from "../useDebouncedSearch";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useDebounce", () => {
  it("retorna valor inicial imediatamente", () => {
    const { result } = renderHook(() => useDebounce("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("não atualiza antes do delay", () => {
    const { result, rerender } = renderHook(
      ({ v }) => useDebounce(v, 300),
      { initialProps: { v: "a" } },
    );
    rerender({ v: "b" });
    expect(result.current).toBe("a");
    act(() => { vi.advanceTimersByTime(299); });
    expect(result.current).toBe("a");
  });

  it("atualiza após delay completo", () => {
    const { result, rerender } = renderHook(
      ({ v }) => useDebounce(v, 300),
      { initialProps: { v: "a" } },
    );
    rerender({ v: "b" });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe("b");
  });

  it("mudança rápida cancela timer anterior (só último valor aplica)", () => {
    const { result, rerender } = renderHook(
      ({ v }) => useDebounce(v, 300),
      { initialProps: { v: "a" } },
    );
    rerender({ v: "b" });
    act(() => { vi.advanceTimersByTime(100); });
    rerender({ v: "c" });
    act(() => { vi.advanceTimersByTime(100); });
    rerender({ v: "d" });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe("d");
  });

  it("delay 0: aplica no próximo tick", () => {
    const { result, rerender } = renderHook(
      ({ v }) => useDebounce(v, 0),
      { initialProps: { v: "a" } },
    );
    rerender({ v: "b" });
    act(() => { vi.advanceTimersByTime(0); });
    expect(result.current).toBe("b");
  });
});

describe("useDebouncedSearch", () => {
  it("estado inicial: search vazio, page 1", () => {
    const { result } = renderHook(() => useDebouncedSearch());
    expect(result.current.search).toBe("");
    expect(result.current.page).toBe(1);
    expect(result.current.debouncedSearch).toBe("");
  });

  it("onSearchChange atualiza search + reseta page pra 1", () => {
    const { result } = renderHook(() => useDebouncedSearch());

    act(() => { result.current.setPage(3); });
    expect(result.current.page).toBe(3);

    act(() => { result.current.onSearchChange("pizza"); });
    expect(result.current.search).toBe("pizza");
    expect(result.current.page).toBe(1); // resetado
  });

  it("debouncedSearch atrasa atualização (delay default 300ms)", () => {
    const { result } = renderHook(() => useDebouncedSearch());

    act(() => { result.current.onSearchChange("pizza"); });
    expect(result.current.search).toBe("pizza");
    expect(result.current.debouncedSearch).toBe(""); // ainda não

    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.debouncedSearch).toBe("pizza");
  });

  it("setPage funciona sem afetar search", () => {
    const { result } = renderHook(() => useDebouncedSearch());
    act(() => { result.current.setPage(5); });
    expect(result.current.page).toBe(5);
    expect(result.current.search).toBe("");
  });

  it("delay custom: respeita timing diferente", () => {
    const { result } = renderHook(() => useDebouncedSearch(100));
    act(() => { result.current.onSearchChange("x"); });
    act(() => { vi.advanceTimersByTime(50); });
    expect(result.current.debouncedSearch).toBe("");
    act(() => { vi.advanceTimersByTime(50); });
    expect(result.current.debouncedSearch).toBe("x");
  });
});
