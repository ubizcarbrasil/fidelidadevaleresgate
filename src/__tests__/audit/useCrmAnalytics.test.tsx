import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { createMockSupabase } from "@/test/setup";

// F5.2 — memoize useCrmAnalytics + estabilizar identidade do retorno.
// Mocka supabase + useBrandGuard ANTES de importar o hook.

const mockCustomers = [
  // active (created há 100d, last activity há 5d)
  { id: "c1", name: "Active", phone: null, cpf: null, points_balance: 100, money_balance: 0, created_at: daysAgo(100), is_active: true },
  // at_risk (last activity há 45d)
  { id: "c2", name: "AtRisk", phone: null, cpf: null, points_balance: 50, money_balance: 0, created_at: daysAgo(120), is_active: true },
  // lost (last activity há 90d)
  { id: "c3", name: "Lost", phone: null, cpf: null, points_balance: 200, money_balance: 0, created_at: daysAgo(180), is_active: true },
  // new (criado há 10d)
  { id: "c4", name: "New", phone: null, cpf: null, points_balance: 0, money_balance: 0, created_at: daysAgo(10), is_active: true },
  // potential — saldo + zero resgates
  { id: "c5", name: "Potential", phone: null, cpf: null, points_balance: 999, money_balance: 0, created_at: daysAgo(200), is_active: true },
];

const mockEarnings = [
  { customer_id: "c1", created_at: daysAgo(5) },
  { customer_id: "c1", created_at: daysAgo(10) },
  { customer_id: "c1", created_at: daysAgo(15) },
  { customer_id: "c1", created_at: daysAgo(20) },
  { customer_id: "c1", created_at: daysAgo(25) }, // 5 earnings — highFrequency
  { customer_id: "c2", created_at: daysAgo(45) },
  { customer_id: "c4", created_at: daysAgo(5) },
];

const mockRedemptions = [
  { customer_id: "c1", created_at: daysAgo(7) },
  // c5 NÃO tem redemption (potential)
];

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: createMockSupabase({
    customers: { data: mockCustomers, error: null },
    earning_events: { data: mockEarnings, error: null },
    redemptions: { data: mockRedemptions, error: null },
  }),
}));

vi.mock("@/hooks/useBrandGuard", () => ({
  useBrandGuard: () => ({ currentBrandId: "brand-1" }),
}));

// Import APÓS os mocks
const importHook = () => import("@/hooks/useCrmAnalytics");

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("F5.2 — useCrmAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("classifica clientes em status correto", async () => {
    const { useCrmAnalytics } = await importHook();
    const { result } = renderHook(() => useCrmAnalytics(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.summary.total).toBe(5);
    expect(result.current.summary.newCustomers).toBe(1); // c4
    expect(result.current.summary.active).toBeGreaterThanOrEqual(1); // c1
    expect(result.current.summary.atRisk).toBeGreaterThanOrEqual(1); // c2 (45d)
    expect(result.current.summary.lost).toBeGreaterThanOrEqual(1); // c3, c5
  });

  it("healthScore considera active + new como saudável", async () => {
    const { useCrmAnalytics } = await importHook();
    const { result } = renderHook(() => useCrmAnalytics(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Score: ((active+new)/total)*100 - (lost/total)*30
    // total=5, active≥1, new=1, atRisk≥1, lost≥1
    expect(result.current.summary.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.current.summary.healthScore).toBeLessThanOrEqual(100);
  });

  it("Pareto: top 20% gera fração proporcional do total", async () => {
    const { useCrmAnalytics } = await importHook();
    const { result } = renderHook(() => useCrmAnalytics(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 5 customers × 20% = 1 (ceil)
    expect(result.current.paretoCount).toBe(1);
    expect(result.current.paretoCustomers.length).toBe(1);
    expect(result.current.paretoCustomers[0].id).toBe("c1"); // 5 earnings, mais que todos
    expect(result.current.paretoPercentage).toBeGreaterThanOrEqual(0);
    expect(result.current.paretoPercentage).toBeLessThanOrEqual(100);
  });

  it("opportunitySegments: high_balance_no_redemption pega c5", async () => {
    const { useCrmAnalytics } = await importHook();
    const { result } = renderHook(() => useCrmAnalytics(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const highBalance = result.current.opportunitySegments.find(
      (s) => s.key === "high_balance_no_redemption",
    );
    expect(highBalance).toBeDefined();
    expect(highBalance!.customers.map((c) => c.id)).toContain("c5");
  });

  it("highFrequency: c1 (5 earnings) está na lista", async () => {
    const { useCrmAnalytics } = await importHook();
    const { result } = renderHook(() => useCrmAnalytics(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.highFrequency.map((c) => c.id)).toContain("c1");
  });

  it("retorno tem identidade estável entre re-renders com mesma data (memoização F5.2)", async () => {
    const { useCrmAnalytics } = await importHook();
    const { result, rerender } = renderHook(() => useCrmAnalytics(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const firstReturn = result.current;
    rerender();
    rerender();
    const secondReturn = result.current;

    // Mesma referência → useMemo está protegendo
    expect(secondReturn).toBe(firstReturn);
    expect(secondReturn.summary).toBe(firstReturn.summary);
    expect(secondReturn.opportunitySegments).toBe(firstReturn.opportunitySegments);
  });

  it("journeyStages categoriza corretamente", async () => {
    const { useCrmAnalytics } = await importHook();
    const { result } = renderHook(() => useCrmAnalytics(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const totalInStages =
      result.current.journeyStages.new.length +
      result.current.journeyStages.engaging.length +
      result.current.journeyStages.loyal.length +
      result.current.journeyStages.at_risk.length +
      result.current.journeyStages.lost.length;

    expect(totalInStages).toBe(result.current.allCustomers.length);
  });
});
