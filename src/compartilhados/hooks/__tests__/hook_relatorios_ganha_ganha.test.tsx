/**
 * hook_relatorios_ganha_ganha — 4 RPCs SECURITY DEFINER de cashback.
 *
 * Bug aqui = relatório de receita errado (cobrança incorreta), valores
 * NaN por coerção falha, ou filtros não aplicados pro RPC (admin vê
 * dados de outra cidade).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { mockRpc } = vi.hoisted(() => ({ mockRpc: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: mockRpc },
}));

import {
  useGgReportSummary,
  useGgReportByStore,
  useGgReportByBranch,
  useGgReportByMonth,
} from "../hook_relatorios_ganha_ganha";

function wrap(): { wrapper: (p: { children: ReactNode }) => JSX.Element } {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    wrapper: ({ children }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

const BASE_FILTERS = {
  brandId: "b1",
  periodStart: "2026-01-01",
  periodEnd: "2026-01-31",
};

beforeEach(() => {
  mockRpc.mockReset();
});

// ── useGgReportSummary ───────────────────────────────────
describe("useGgReportSummary", () => {
  it("periodStart vazio: query disabled", () => {
    const { result } = renderHook(
      () => useGgReportSummary({ ...BASE_FILTERS, periodStart: "" }),
      wrap(),
    );
    expect(result.current.isFetching).toBe(false);
  });

  it("chama RPC com filtros + storeId opcional", async () => {
    mockRpc.mockResolvedValue({ data: {}, error: null });
    renderHook(
      () => useGgReportSummary({ ...BASE_FILTERS, storeId: "s1" }),
      wrap(),
    );
    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(mockRpc).toHaveBeenCalledWith("rpc_gg_report_summary", {
      p_brand_id: "b1",
      p_period_start: "2026-01-01",
      p_period_end: "2026-01-31",
      p_store_id: "s1",
      p_branch_id: undefined,
    });
  });

  it("data como array: pega primeiro elemento", async () => {
    mockRpc.mockResolvedValue({
      data: [{ total_fee: 99.5, n_events: 10 }],
      error: null,
    });
    const { result } = renderHook(() => useGgReportSummary(BASE_FILTERS), wrap());
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.total_fee).toBe(99.5);
    expect(result.current.data!.n_events).toBe(10);
  });

  it("toNum: null vira 0, undefined vira 0", async () => {
    mockRpc.mockResolvedValue({ data: { total_fee: null }, error: null });
    const { result } = renderHook(() => useGgReportSummary(BASE_FILTERS), wrap());
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.total_fee).toBe(0);
    expect(result.current.data!.n_events).toBe(0); // sem campo
  });

  it("strings numéricas convertidas via Number()", async () => {
    mockRpc.mockResolvedValue({
      data: { total_fee: "150.25", total_earn_pts: "200" },
      error: null,
    });
    const { result } = renderHook(() => useGgReportSummary(BASE_FILTERS), wrap());
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.total_fee).toBe(150.25);
    expect(result.current.data!.total_earn_pts).toBe(200);
  });
});

// ── useGgReportByStore ───────────────────────────────────
describe("useGgReportByStore", () => {
  it("mapeia rows com types corretos (string/number)", async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          store_id: "s1",
          store_name: "Pizza Mario",
          branch_id: "br1",
          earn_pts: "100",
          redeem_pts: 50,
          total_fee: "12.5",
        },
      ],
      error: null,
    });
    const { result } = renderHook(() => useGgReportByStore(BASE_FILTERS), wrap());
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    const row = result.current.data![0];
    expect(row.store_id).toBe("s1");
    expect(row.store_name).toBe("Pizza Mario");
    expect(row.branch_id).toBe("br1");
    expect(row.earn_pts).toBe(100); // string virou number
    expect(row.total_fee).toBe(12.5);
  });

  it("branch_id null: preserva null (não 'null' string)", async () => {
    mockRpc.mockResolvedValue({
      data: [{ store_id: "s1", store_name: "X", branch_id: null }],
      error: null,
    });
    const { result } = renderHook(() => useGgReportByStore(BASE_FILTERS), wrap());
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(result.current.data![0].branch_id).toBeNull();
  });

  it("data null: array vazio", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useGgReportByStore(BASE_FILTERS), wrap());
    await waitFor(() => expect(result.current.data).toEqual([]));
  });
});

// ── useGgReportByBranch ──────────────────────────────────
describe("useGgReportByBranch", () => {
  it("mapeia rows + preserva strings (city/state)", async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          branch_id: "br1",
          branch_name: "Centro",
          branch_city: "São Paulo",
          branch_state: "SP",
          total_pts: 500,
          n_stores: "5",
        },
      ],
      error: null,
    });
    const { result } = renderHook(() => useGgReportByBranch(BASE_FILTERS), wrap());
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    const row = result.current.data![0];
    expect(row.branch_city).toBe("São Paulo");
    expect(row.branch_state).toBe("SP");
    expect(row.n_stores).toBe(5);
  });

  it("NÃO passa branchId pro RPC (relatório agrupa por branch)", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    renderHook(
      () => useGgReportByBranch({ ...BASE_FILTERS, branchId: "br1" }),
      wrap(),
    );
    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(mockRpc.mock.calls[0][1]).toEqual({
      p_brand_id: "b1",
      p_period_start: "2026-01-01",
      p_period_end: "2026-01-31",
    });
  });
});

// ── useGgReportByMonth ───────────────────────────────────
describe("useGgReportByMonth", () => {
  it("year=0: query disabled", () => {
    const { result } = renderHook(() => useGgReportByMonth("b1", 0), wrap());
    expect(result.current.isFetching).toBe(false);
  });

  it("chama RPC com p_year", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    renderHook(() => useGgReportByMonth("b1", 2026), wrap());
    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(mockRpc).toHaveBeenCalledWith("rpc_gg_report_by_month", {
      p_brand_id: "b1",
      p_year: 2026,
    });
  });

  it("mapeia month como string + conta n_events", async () => {
    mockRpc.mockResolvedValue({
      data: [
        { month: "2026-01", n_events: 42, total_fee: "100" },
        { month: "2026-02", n_events: 30, total_fee: 80 },
      ],
      error: null,
    });
    const { result } = renderHook(() => useGgReportByMonth("b1", 2026), wrap());
    await waitFor(() => expect(result.current.data).toHaveLength(2));
    expect(result.current.data![0].month).toBe("2026-01");
    expect(result.current.data![0].n_events).toBe(42);
    expect(result.current.data![0].total_fee).toBe(100);
  });

  it("data null: array vazio", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useGgReportByMonth("b1", 2026), wrap());
    await waitFor(() => expect(result.current.data).toEqual([]));
  });
});
