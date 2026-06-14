/**
 * hook_branches_sync — sincronização centralizada de cache de cidades.
 *
 * Bug aqui = cidade nova/editada/removida não aparece em outras telas
 * (cache stale → admin pensa que mudança não salvou).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useBranchesSync,
  BRANCH_RELATED_QUERY_KEYS,
} from "../hook_branches_sync";

function wrap(): { wrapper: (p: { children: ReactNode }) => JSX.Element; qc: QueryClient } {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    qc,
    wrapper: ({ children }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ── BRANCH_RELATED_QUERY_KEYS ────────────────────────────
describe("BRANCH_RELATED_QUERY_KEYS — inventário", () => {
  it("é uma lista não-vazia", () => {
    expect(BRANCH_RELATED_QUERY_KEYS.length).toBeGreaterThan(0);
  });

  it("contém as listas core (brand-branches, branches, branches-select)", () => {
    const flat = BRANCH_RELATED_QUERY_KEYS.map((k) => k[0]);
    expect(flat).toContain("brand-branches");
    expect(flat).toContain("branches");
    expect(flat).toContain("branches-select");
  });

  it("contém regras de resgate (cidade pode customizar)", () => {
    const flat = BRANCH_RELATED_QUERY_KEYS.map((k) => k[0]);
    expect(flat).toContain("regras-resgate-efetivas");
  });

  it("sem duplicatas", () => {
    const flat = BRANCH_RELATED_QUERY_KEYS.map((k) => k[0] as string);
    expect(new Set(flat).size).toBe(flat.length);
  });
});

// ── invalidateAll ────────────────────────────────────────
describe("invalidateAll", () => {
  it("chama queryClient.invalidateQueries pra cada key do catálogo", async () => {
    const { wrapper, qc } = wrap();
    const spy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useBranchesSync(), { wrapper });

    await act(async () => {
      await result.current.invalidateAll();
    });

    expect(spy).toHaveBeenCalledTimes(BRANCH_RELATED_QUERY_KEYS.length);
    // Cada chamada teve o formato { queryKey: [...] }
    spy.mock.calls.forEach((call) => {
      expect(call[0]).toHaveProperty("queryKey");
    });
  });
});

describe("refetchActive", () => {
  it("chama queryClient.refetchQueries com type=active", async () => {
    const { wrapper, qc } = wrap();
    const spy = vi.spyOn(qc, "refetchQueries");
    const { result } = renderHook(() => useBranchesSync(), { wrapper });

    await act(async () => {
      await result.current.refetchActive();
    });

    expect(spy).toHaveBeenCalledTimes(BRANCH_RELATED_QUERY_KEYS.length);
    spy.mock.calls.forEach((call) => {
      expect(call[0]).toMatchObject({ type: "active" });
    });
  });
});

describe("syncAfterMutation", () => {
  it("chama invalidateAll (N invalidações) + refetchActive (>= N refetches)", async () => {
    const { wrapper, qc } = wrap();
    const invSpy = vi.spyOn(qc, "invalidateQueries");
    const refSpy = vi.spyOn(qc, "refetchQueries");
    const { result } = renderHook(() => useBranchesSync(), { wrapper });

    await act(async () => {
      await result.current.syncAfterMutation();
    });

    const N = BRANCH_RELATED_QUERY_KEYS.length;
    // invalidateAll: N calls explícitos
    expect(invSpy.mock.calls.length).toBe(N);
    // refetchActive: pelo menos N calls explícitos (TanStack pode adicionar
    // refetches extras como side-effect dos invalidates, por isso >= N)
    expect(refSpy.mock.calls.length).toBeGreaterThanOrEqual(N);
  });
});

describe("memoização", () => {
  it("rerender com state idêntico mantém identity das funções", () => {
    const { result, rerender } = renderHook(() => useBranchesSync(), wrap());
    const first = result.current;
    rerender();
    expect(result.current.invalidateAll).toBe(first.invalidateAll);
    expect(result.current.refetchActive).toBe(first.refetchActive);
    expect(result.current.syncAfterMutation).toBe(first.syncAfterMutation);
  });
});
