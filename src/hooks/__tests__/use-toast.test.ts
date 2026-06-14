/**
 * use-toast — toast manager singleton (shadcn pattern).
 *
 * Reducer puro testado direto + comportamento de `toast()` factory
 * (singleton listener pattern). Bug aqui:
 *   - Toast aparece e some imediatamente (TOAST_LIMIT errado)
 *   - Múltiplos toasts: anterior não desaparece
 *   - Dismiss não fecha (open=true sempre)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { reducer, toast } from "../use-toast";
import type { ToastProps } from "@/components/ui/toast";

type T = ToastProps & { id: string; title?: string; open?: boolean };

beforeEach(() => {
  vi.useRealTimers();
});

// ── Reducer ──────────────────────────────────────────────
describe("reducer — ADD_TOAST", () => {
  it("adiciona toast novo no início (LIFO)", () => {
    const state = reducer(
      { toasts: [{ id: "a" } as T] },
      { type: "ADD_TOAST", toast: { id: "b" } as T },
    );
    expect(state.toasts.map((t) => t.id)).toEqual(["b"]); // TOAST_LIMIT=1
  });

  it("TOAST_LIMIT=1 trunca: só mantém o mais novo", () => {
    let s = reducer({ toasts: [] }, { type: "ADD_TOAST", toast: { id: "1" } as T });
    s = reducer(s, { type: "ADD_TOAST", toast: { id: "2" } as T });
    s = reducer(s, { type: "ADD_TOAST", toast: { id: "3" } as T });
    expect(s.toasts.map((t) => t.id)).toEqual(["3"]);
  });
});

describe("reducer — UPDATE_TOAST", () => {
  it("merge props no toast com id correspondente", () => {
    const state = reducer(
      { toasts: [{ id: "a", title: "old" } as T] },
      { type: "UPDATE_TOAST", toast: { id: "a", title: "new" } as Partial<T> },
    );
    expect(state.toasts[0].title).toBe("new");
  });

  it("toast desconhecido: mantém estado intacto", () => {
    const initial = { toasts: [{ id: "a", title: "x" } as T] };
    const state = reducer(initial, {
      type: "UPDATE_TOAST",
      toast: { id: "b", title: "y" } as Partial<T>,
    });
    expect(state.toasts[0].title).toBe("x");
  });
});

describe("reducer — DISMISS_TOAST", () => {
  it("dismiss por id: seta open=false só nesse toast", () => {
    const state = reducer(
      {
        toasts: [
          { id: "a", open: true } as T,
          { id: "b", open: true } as T,
        ],
      },
      { type: "DISMISS_TOAST", toastId: "a" },
    );
    expect(state.toasts.find((t) => t.id === "a")?.open).toBe(false);
    expect(state.toasts.find((t) => t.id === "b")?.open).toBe(true);
  });

  it("dismiss sem id: fecha TODOS", () => {
    const state = reducer(
      {
        toasts: [
          { id: "a", open: true } as T,
          { id: "b", open: true } as T,
        ],
      },
      { type: "DISMISS_TOAST" },
    );
    expect(state.toasts.every((t) => t.open === false)).toBe(true);
  });
});

describe("reducer — REMOVE_TOAST", () => {
  it("remove por id: filtra esse toast", () => {
    const state = reducer(
      { toasts: [{ id: "a" } as T, { id: "b" } as T] },
      { type: "REMOVE_TOAST", toastId: "a" },
    );
    expect(state.toasts.map((t) => t.id)).toEqual(["b"]);
  });

  it("remove sem id: limpa todos", () => {
    const state = reducer(
      { toasts: [{ id: "a" } as T, { id: "b" } as T] },
      { type: "REMOVE_TOAST" },
    );
    expect(state.toasts).toEqual([]);
  });
});

// ── toast() factory ──────────────────────────────────────
describe("toast() factory", () => {
  it("retorna {id, dismiss, update}", () => {
    const t = toast({ title: "hi" });
    expect(typeof t.id).toBe("string");
    expect(typeof t.dismiss).toBe("function");
    expect(typeof t.update).toBe("function");
  });

  it("ids são únicos (genId incrementa)", () => {
    const a = toast({ title: "1" });
    const b = toast({ title: "2" });
    expect(a.id).not.toBe(b.id);
  });

  it("dismiss(): chama action que fecha o toast (não throw)", () => {
    const t = toast({ title: "hi" });
    expect(() => t.dismiss()).not.toThrow();
  });

  it("update(): chama action que atualiza props (não throw)", () => {
    const t = toast({ title: "hi" });
    expect(() => t.update({ id: t.id, title: "new" } as never)).not.toThrow();
  });
});
