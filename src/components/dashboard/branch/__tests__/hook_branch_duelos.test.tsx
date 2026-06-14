/**
 * useBranchDuelosStats — agrega métricas de duelos + apostas da cidade.
 * Bug aqui = pontosEmEscrow conta apostas settled (deveria ser só matched),
 * mês corrente errado por timezone, count null vira NaN em UI.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

import { useBranchDuelosStats } from "../hook_branch_duelos";

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// Chain thenable que resolve com result após qualquer encadeamento await-ável
function thenableChain(result: { data?: unknown; count?: number; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  ["select", "eq", "in", "gte"].forEach((m) => { chain[m] = vi.fn(() => chain); });
  chain.then = (resolve: (r: unknown) => void) => resolve(result);
  return chain;
}

function countChain(count: number) {
  return thenableChain({ count, data: null, error: null });
}

function dataChain(rows: unknown[]) {
  return thenableChain({ data: rows, count: 0, error: null });
}

beforeEach(() => {
  mockFrom.mockReset();
});

describe("useBranchDuelosStats", () => {
  function setupMocks(opts: {
    duelosAtivos?: number;
    duelosFinalizados?: number;
    apostasAbertas?: number;
    apostasMatched?: Array<{ bettor_a_points: number; bettor_b_points: number }>;
    bonus?: Array<{ duel_winner_bonus: number }>;
  }) {
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      // ordem: duelosAtivos / duelosFinalizados / apostasAbertas / apostasMatched / bonus
      if (call === 1) return countChain(opts.duelosAtivos ?? 0);
      if (call === 2) return countChain(opts.duelosFinalizados ?? 0);
      if (call === 3) return countChain(opts.apostasAbertas ?? 0);
      if (call === 4) return dataChain(opts.apostasMatched ?? []);
      if (call === 5) return dataChain(opts.bonus ?? []);
      return countChain(0);
    });
  }

  it("retorna shape completo com 6 métricas", async () => {
    setupMocks({});
    const { result } = renderHook(() => useBranchDuelosStats("br1"), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual({
      duelosAtivos: 0,
      duelosFinalizadosMes: 0,
      apostasAbertas: 0,
      apostasMatched: 0,
      pontosEmEscrow: 0,
      bonusDistribuido: 0,
    });
  });

  it("count null/undefined: vira 0 (não NaN)", async () => {
    mockFrom.mockImplementation(() => thenableChain({ count: null, data: null, error: null }));
    const { result } = renderHook(() => useBranchDuelosStats("br1"), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.duelosAtivos).toBe(0);
    expect(result.current.data?.bonusDistribuido).toBe(0);
  });

  it("pontosEmEscrow: soma bettor_a_points + bettor_b_points das matched", async () => {
    setupMocks({
      apostasMatched: [
        { bettor_a_points: 10, bettor_b_points: 10 },
        { bettor_a_points: 50, bettor_b_points: 50 },
        { bettor_a_points: 100, bettor_b_points: 100 },
      ],
    });
    const { result } = renderHook(() => useBranchDuelosStats("br1"), { wrapper });
    await waitFor(() => expect(result.current.data?.pontosEmEscrow).toBe(320));
    expect(result.current.data?.apostasMatched).toBe(3);
  });

  it("bonusDistribuido: soma duel_winner_bonus das settled", async () => {
    setupMocks({
      bonus: [
        { duel_winner_bonus: 100 },
        { duel_winner_bonus: 200 },
      ],
    });
    const { result } = renderHook(() => useBranchDuelosStats("br1"), { wrapper });
    await waitFor(() => expect(result.current.data?.bonusDistribuido).toBe(300));
  });

  it("counts retornados: aplicados em cada métrica", async () => {
    setupMocks({
      duelosAtivos: 7,
      duelosFinalizados: 12,
      apostasAbertas: 3,
    });
    const { result } = renderHook(() => useBranchDuelosStats("br1"), { wrapper });
    await waitFor(() => expect(result.current.data?.duelosAtivos).toBe(7));
    expect(result.current.data?.duelosFinalizadosMes).toBe(12);
    expect(result.current.data?.apostasAbertas).toBe(3);
  });
});
