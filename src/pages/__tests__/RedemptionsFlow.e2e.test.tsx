/**
 * E2E Integration Tests — Redemptions Flow
 * Tests: list redemptions, search, pagination, status display
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
// @ts-expect-error — test-only imports resolved by vitest
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RedemptionsPage from "../RedemptionsPage";

// ── Mock Data ────────────────────────────────────────────
const MOCK_REDEMPTIONS = [
  {
    id: "red-1", brand_id: "brand-1", branch_id: "branch-1",
    customer_id: "cust-1", offer_id: "offer-1",
    token: "123456AB", status: "PENDING",
    purchase_value: 50, created_at: "2026-03-15T14:30:00Z",
    expires_at: "2026-03-16T14:30:00Z", used_at: null,
    customer_cpf: "123.456.789-00", qr_data: "qr123",
    credit_value_applied: 10, offer_snapshot_json: {},
    offers: { title: "Pizza 2x1" },
    customers: { name: "Maria Silva" },
    branches: { name: "São Paulo" },
  },
  {
    id: "red-2", brand_id: "brand-1", branch_id: "branch-1",
    customer_id: "cust-2", offer_id: "offer-1",
    token: "ABCDEF12", status: "USED",
    purchase_value: 80, created_at: "2026-03-14T10:00:00Z",
    expires_at: "2026-03-15T10:00:00Z", used_at: "2026-03-14T12:00:00Z",
    customer_cpf: null, qr_data: null,
    credit_value_applied: 10, offer_snapshot_json: {},
    offers: { title: "Desconto 20%" },
    customers: { name: "João Costa" },
    branches: { name: "São Paulo" },
  },
];

function createChainedBuilder(resolvedValue: any) {
  const builder: any = {};
  ["select", "eq", "neq", "ilike", "order", "range", "single"].forEach((m) => {
    builder[m] = vi.fn().mockReturnValue(builder);
  });
  const p = Promise.resolve(resolvedValue);
  builder.then = p.then.bind(p);
  builder.catch = p.catch.bind(p);
  return builder;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() =>
      createChainedBuilder({ data: MOCK_REDEMPTIONS, error: null, count: 2 })
    ),
  },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/hooks/useBrandGuard", () => ({
  useBrandGuard: () => ({ currentBrandId: "brand-1", isRootAdmin: false }),
}));

function renderRedemptions() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <RedemptionsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Redemptions Flow E2E", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders redemption list with correct data", async () => {
    renderRedemptions();
    await waitFor(() => {
      expect(screen.getByText("Pizza 2x1")).toBeInTheDocument();
      expect(screen.getByText("Maria Silva")).toBeInTheDocument();
      expect(screen.getByText("Desconto 20%")).toBeInTheDocument();
      expect(screen.getByText("João Costa")).toBeInTheDocument();
    });
  });

  it("displays status badges", async () => {
    renderRedemptions();
    await waitFor(() => {
      expect(screen.getByText("PENDING")).toBeInTheDocument();
      expect(screen.getByText("USED")).toBeInTheDocument();
    });
  });

  it("shows masked token (first 8 chars)", async () => {
    renderRedemptions();
    await waitFor(() => {
      expect(screen.getByText("123456AB…")).toBeInTheDocument();
      expect(screen.getByText("ABCDEF12…")).toBeInTheDocument();
    });
  });

  it("displays formatted purchase values", async () => {
    renderRedemptions();
    await waitFor(() => {
      expect(screen.getByText("R$ 50.00")).toBeInTheDocument();
      expect(screen.getByText("R$ 80.00")).toBeInTheDocument();
    });
  });

  it("has search input for token filtering", () => {
    renderRedemptions();
    expect(screen.getByPlaceholderText(/buscar por token/i)).toBeInTheDocument();
  });

  it("renders page title and description", () => {
    renderRedemptions();
    expect(screen.getByText("Resgates")).toBeInTheDocument();
    expect(screen.getByText(/histórico de resgates/i)).toBeInTheDocument();
  });
});
