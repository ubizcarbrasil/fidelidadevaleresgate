/**
 * usePrefetchRoutes — prefetch agressivo de queries comuns na área
 * do cliente. Bug aqui = navegação lenta entre tabs (Wallet, Ofertas,
 * Resgates) por falta de cache pré-carregado.
 *
 * Cobre:
 *   - Não dispara sem brandId/branchId
 *   - Dispara offers prefetch quando brand+branch presentes
 *   - Dispara redemptions + ledger count prefetch quando customer
 *   - Re-prefetch se brand/branch/customer mudar
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { usePrefetchRoutes } from "../usePrefetchRoutes";

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

// Brand context
const brandState: {
  brand: { id: string } | null;
  selectedBranch: { id: string } | null;
} = { brand: null, selectedBranch: null };
vi.mock("@/contexts/BrandContext", () => ({
  useBrand: () => brandState,
}));

// Customer context
const customerState: { customer: { id: string } | null } = { customer: null };
vi.mock("@/contexts/CustomerContext", () => ({
  useCustomer: () => customerState,
}));

function chain(result: { data?: unknown; count?: number } = { data: [] }) {
  const c: Record<string, unknown> = {};
  ["select", "eq", "order", "range"].forEach((op) => {
    c[op] = vi.fn(() => c);
  });
  c.then = (resolve: (r: unknown) => void) =>
    resolve({ data: result.data ?? [], count: result.count ?? 0 });
  return c;
}

function wrap(qc: QueryClient): { wrapper: (p: { children: ReactNode }) => JSX.Element } {
  return {
    wrapper: ({ children }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  brandState.brand = null;
  brandState.selectedBranch = null;
  customerState.customer = null;
  mockFrom.mockReset().mockReturnValue(chain({ data: [] }));
});

// ── Guards ───────────────────────────────────────────────
describe("usePrefetchRoutes — guards", () => {
  it("sem brand: NÃO faz prefetch", () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "prefetchQuery");
    renderHook(() => usePrefetchRoutes(), wrap(qc));
    expect(spy).not.toHaveBeenCalled();
  });

  it("brand sem branch: NÃO faz prefetch de offers", () => {
    brandState.brand = { id: "b1" };
    brandState.selectedBranch = null;
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "prefetchQuery");
    renderHook(() => usePrefetchRoutes(), wrap(qc));
    expect(spy).not.toHaveBeenCalled();
  });

  it("sem customer: NÃO faz prefetch de redemptions/ledger", () => {
    brandState.brand = { id: "b1" };
    brandState.selectedBranch = { id: "br1" };
    customerState.customer = null;
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "prefetchQuery");
    renderHook(() => usePrefetchRoutes(), wrap(qc));
    // Só prefetch de offers (1 call), não redemptions/ledger
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

// ── Prefetch ─────────────────────────────────────────────
describe("usePrefetchRoutes — prefetch", () => {
  it("brand+branch: dispara prefetch de offers", async () => {
    brandState.brand = { id: "b1" };
    brandState.selectedBranch = { id: "br1" };
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "prefetchQuery");
    renderHook(() => usePrefetchRoutes(), wrap(qc));
    expect(spy).toHaveBeenCalledTimes(1);
    const args = spy.mock.calls[0][0];
    expect(args.queryKey[0]).toBe("offers");
  });

  it("brand+branch+customer: dispara 3 prefetches (offers + redemptions + ledger count)", async () => {
    brandState.brand = { id: "b1" };
    brandState.selectedBranch = { id: "br1" };
    customerState.customer = { id: "c1" };
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "prefetchQuery");
    renderHook(() => usePrefetchRoutes(), wrap(qc));
    expect(spy).toHaveBeenCalledTimes(3);
    const keys = spy.mock.calls.map((c) => c[0].queryKey[0]);
    expect(keys).toContain("offers");
    expect(keys).toContain("customer-redemptions");
    expect(keys).toContain("customer-wallet-count");
  });

  it("queryFn de offers chama supabase com filtros corretos quando executada", async () => {
    brandState.brand = { id: "b1" };
    brandState.selectedBranch = { id: "br1" };

    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "prefetchQuery");
    renderHook(() => usePrefetchRoutes(), wrap(qc));

    // Reset mockFrom + dá uma chain limpa pra ver as calls da queryFn isolada
    mockFrom.mockReset();
    const offersChain = chain({ data: [{ id: "o1" }] });
    mockFrom.mockReturnValue(offersChain);

    const args = spy.mock.calls[0][0];
    await args.queryFn?.({} as never);

    expect(mockFrom).toHaveBeenCalledWith("offers");
    // 4 eqs: branch_id, brand_id, status, is_active
    expect(offersChain.eq).toHaveBeenCalledTimes(4);
  });
});

// ── Re-prefetch ──────────────────────────────────────────
describe("usePrefetchRoutes — dependências", () => {
  it("muda customerId: re-dispara prefetch de customer queries", () => {
    brandState.brand = { id: "b1" };
    brandState.selectedBranch = { id: "br1" };
    customerState.customer = { id: "c1" };

    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "prefetchQuery");
    const { rerender } = renderHook(() => usePrefetchRoutes(), wrap(qc));
    const callsAfterFirst = spy.mock.calls.length;

    // Muda customer + re-renderiza
    customerState.customer = { id: "c-NEW" };
    rerender();

    // Deve disparar offers (sem mudança real, mas effect re-corre via custId)
    // + redemptions/ledger pro novo custId
    expect(spy.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });
});
