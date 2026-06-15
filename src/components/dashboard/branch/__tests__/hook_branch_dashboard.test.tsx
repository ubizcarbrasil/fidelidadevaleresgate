/**
 * useBranchDashboardStats + useBranchRanking + useBranchRealtimeFeed +
 * useBranchPassengerStats + useBranchRidesPerDay — hooks do dashboard
 * de cidade. Bug aqui = ranking sem position vira número errado, RPC
 * sem branchId vaza dados de outra cidade, feed realtime perde subscribe
 * ao remontar.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { mockRpc, mockFrom, mockChannel, mockRemoveChannel } = vi.hoisted(() => {
  const channelObj = {
    on: vi.fn(() => channelObj),
    subscribe: vi.fn(() => channelObj),
  };
  return {
    mockRpc: vi.fn(),
    mockFrom: vi.fn(),
    mockChannel: vi.fn(() => channelObj),
    mockRemoveChannel: vi.fn(),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

import {
  useBranchDashboardStats,
  useBranchRanking,
  useBranchRealtimeFeed,
  useBranchPassengerStats,
  useBranchRidesPerDay,
} from "../hook_branch_dashboard";

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mockRpc.mockReset();
  mockFrom.mockReset();
  mockChannel.mockClear();
  mockRemoveChannel.mockReset();
});

// ────────────────────────────────────────────────────────
// useBranchDashboardStats
// ────────────────────────────────────────────────────────
describe("useBranchDashboardStats", () => {
  it("branchId vazio: query disabled", async () => {
    const { result } = renderHook(() => useBranchDashboardStats(""), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("branchId válido: chama RPC get_branch_dashboard_stats_v2", async () => {
    const stats = { total_drivers: 100, active_today: 25 };
    mockRpc.mockResolvedValue({ data: stats, error: null });
    const { result } = renderHook(() => useBranchDashboardStats("br1"), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(stats));
    expect(mockRpc).toHaveBeenCalledWith("get_branch_dashboard_stats_v2", { p_branch_id: "br1" });
  });

  it("error: propaga via isError", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "fail" } });
    const { result } = renderHook(() => useBranchDashboardStats("br1"), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ────────────────────────────────────────────────────────
// useBranchRanking
// ────────────────────────────────────────────────────────
describe("useBranchRanking", () => {
  it("retorna ranking com position calculada (1-based)", async () => {
    mockRpc.mockResolvedValue({
      data: [
        { participant_name: "João", participant_type: "driver", total_points: 500 },
        { participant_name: "Maria", participant_type: "driver", total_points: 400 },
        { participant_name: "Pedro", participant_type: "driver", total_points: 300 },
      ],
      error: null,
    });
    const { result } = renderHook(() => useBranchRanking("br1"), { wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(3));
    expect(result.current.data?.[0]).toEqual({ position: 1, name: "João", points: 500 });
    expect(result.current.data?.[1]).toEqual({ position: 2, name: "Maria", points: 400 });
    expect(result.current.data?.[2]).toEqual({ position: 3, name: "Pedro", points: 300 });
  });

  it("chama RPC com limit=10", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    renderHook(() => useBranchRanking("br1"), { wrapper });
    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(mockRpc).toHaveBeenCalledWith("get_branch_points_ranking", { p_branch_id: "br1", p_limit: 10 });
  });

  it("data null: array vazio (não crasha)", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useBranchRanking("br1"), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual([]));
  });

  it("points: convertido pra Number (DB pode retornar string)", async () => {
    mockRpc.mockResolvedValue({
      data: [{ participant_name: "X", participant_type: "driver", total_points: "999" }],
      error: null,
    });
    const { result } = renderHook(() => useBranchRanking("br1"), { wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(typeof result.current.data?.[0].points).toBe("number");
    expect(result.current.data?.[0].points).toBe(999);
  });
});

// ────────────────────────────────────────────────────────
// useBranchRealtimeFeed
// ────────────────────────────────────────────────────────
describe("useBranchRealtimeFeed", () => {
  function makeFromChain(data: unknown[]) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data, error: null }),
    };
  }

  it("branchId vazio: feed=[] sem subscribe", async () => {
    const { result } = renderHook(() => useBranchRealtimeFeed(""), { wrapper });
    await waitFor(() => expect(result.current).toEqual([]));
    expect(mockChannel).not.toHaveBeenCalled();
  });

  it("inicial: fetcha últimos 20 rides finalizados", async () => {
    const rides = [
      { id: "r1", driver_name: "João", driver_points_credited: 5, finalized_at: "2026-06-14T10:00:00Z" },
    ];
    mockFrom.mockReturnValue(makeFromChain(rides));
    const { result } = renderHook(() => useBranchRealtimeFeed("br1"), { wrapper });
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0]).toEqual({
      id: "r1",
      driver_name: "João",
      points: 5,
      finalized_at: "2026-06-14T10:00:00Z",
    });
  });

  it("subscribe ao channel branch-feed-<branchId>", async () => {
    mockFrom.mockReturnValue(makeFromChain([]));
    renderHook(() => useBranchRealtimeFeed("br1"), { wrapper });
    await waitFor(() => expect(mockChannel).toHaveBeenCalled());
    expect(mockChannel.mock.calls[0][0]).toBe("branch-feed-br1");
  });

  it("driver_name vazio: fallback 'Motorista'", async () => {
    const rides = [
      { id: "r1", driver_name: null, driver_points_credited: 10, finalized_at: "x" },
    ];
    mockFrom.mockReturnValue(makeFromChain(rides));
    const { result } = renderHook(() => useBranchRealtimeFeed("br1"), { wrapper });
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0].driver_name).toBe("Motorista");
  });

  it("unmount: removeChannel limpa subscribe", async () => {
    mockFrom.mockReturnValue(makeFromChain([]));
    const { unmount } = renderHook(() => useBranchRealtimeFeed("br1"), { wrapper });
    await waitFor(() => expect(mockChannel).toHaveBeenCalled());
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────
// useBranchPassengerStats
// ────────────────────────────────────────────────────────
describe("useBranchPassengerStats", () => {
  it("chama RPC get_branch_passenger_stats", async () => {
    const stats = { total_passengers: 500 };
    mockRpc.mockResolvedValue({ data: stats, error: null });
    const { result } = renderHook(() => useBranchPassengerStats("br1"), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(stats));
    expect(mockRpc).toHaveBeenCalledWith("get_branch_passenger_stats", { p_branch_id: "br1" });
  });
});

// ────────────────────────────────────────────────────────
// useBranchRidesPerDay
// ────────────────────────────────────────────────────────
describe("useBranchRidesPerDay", () => {
  function makeRidesChain(data: unknown[]) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ data, error: null }),
    };
  }

  it("retorna 14 buckets (dia anterior - hoje)", async () => {
    mockFrom.mockReturnValue(makeRidesChain([]));
    const { result } = renderHook(() => useBranchRidesPerDay("br1"), { wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(14));
    // todos rides=0
    expect(result.current.data?.every((b) => b.rides === 0)).toBe(true);
  });

  it("agrupa rides por dia (dd/MM)", async () => {
    const hoje = new Date();
    const dataStr = hoje.toISOString();
    mockFrom.mockReturnValue(makeRidesChain([
      { finalized_at: dataStr },
      { finalized_at: dataStr },
      { finalized_at: dataStr },
    ]));
    const { result } = renderHook(() => useBranchRidesPerDay("br1"), { wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(14));
    // último bucket (hoje) tem 3 rides
    const total = result.current.data?.reduce((acc, b) => acc + b.rides, 0);
    expect(total).toBe(3);
  });
});
