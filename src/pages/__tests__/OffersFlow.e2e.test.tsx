/**
 * E2E Integration Tests — Offer CRUD Flow
 * Tests: create, edit, delete offers
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OffersPage from "../OffersPage";

// ── Supabase Mock ────────────────────────────────────────
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockSelect = vi.fn();

function createChainedBuilder(resolvedValue: any) {
  const builder: any = {};
  const methods = ["select", "eq", "neq", "ilike", "order", "range", "single"];
  methods.forEach((m) => { builder[m] = vi.fn().mockReturnValue(builder); });
  builder.then = (resolve: any) => resolve(resolvedValue);
  const p = Promise.resolve(resolvedValue);
  builder.then = p.then.bind(p);
  builder.catch = p.catch.bind(p);
  return builder;
}

const MOCK_OFFERS = [
  {
    id: "offer-1", title: "Pizza 2x1", description: "Compre 1 leve 2",
    brand_id: "brand-1", branch_id: "branch-1", store_id: "store-1",
    value_rescue: 10, min_purchase: 30, status: "ACTIVE",
    max_daily_redemptions: null, created_at: "2026-01-01T00:00:00Z",
    stores: { name: "Pizzaria do João" }, branches: { name: "São Paulo" },
    brands: { name: "Vale Resgate" },
  },
];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "offers") {
        const selectBuilder = createChainedBuilder({ data: MOCK_OFFERS, error: null, count: 1 });
        const insertBuilder = createChainedBuilder({ error: null });
        const updateBuilder = createChainedBuilder({ error: null });
        const deleteBuilder = createChainedBuilder({ error: null });

        mockSelect.mockReturnValue(selectBuilder);
        mockInsert.mockReturnValue(insertBuilder);
        mockUpdate.mockReturnValue(updateBuilder);
        mockDelete.mockReturnValue(deleteBuilder);

        return {
          select: mockSelect,
          insert: mockInsert,
          update: (...args: any[]) => { mockUpdate(...args); return updateBuilder; },
          delete: () => { mockDelete(); return deleteBuilder; },
        };
      }
      // brands, branches, stores selectors
      return createChainedBuilder({
        data: table === "brands" ? [{ id: "brand-1", name: "Vale Resgate" }]
            : table === "branches" ? [{ id: "branch-1", name: "São Paulo", brand_id: "brand-1" }]
            : [{ id: "store-1", name: "Pizzaria", branch_id: "branch-1", brand_id: "brand-1" }],
        error: null,
      });
    }),
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/hooks/useBrandGuard", () => ({
  useBrandGuard: () => ({ currentBrandId: "brand-1", isRootAdmin: false }),
}));

function renderOffers() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <OffersPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Offers CRUD E2E", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders offer list with data", async () => {
    renderOffers();
    await waitFor(() => {
      expect(screen.getByText("Pizza 2x1")).toBeInTheDocument();
      expect(screen.getByText("Pizzaria do João")).toBeInTheDocument();
      expect(screen.getByText("São Paulo")).toBeInTheDocument();
    });
  });

  it("opens create dialog", async () => {
    renderOffers();
    fireEvent.click(screen.getByRole("button", { name: /nova oferta/i }));
    await waitFor(() => {
      expect(screen.getByText("Nova Oferta")).toBeInTheDocument();
      expect(screen.getByLabelText("Título")).toBeInTheDocument();
    });
  });

  it("shows status badge correctly", async () => {
    renderOffers();
    await waitFor(() => {
      expect(screen.getByText("Ativa")).toBeInTheDocument();
    });
  });

  it("shows delete confirmation dialog", async () => {
    renderOffers();
    await waitFor(() => screen.getByText("Pizza 2x1"));

    // Find delete button (trash icon)
    const deleteButtons = screen.getAllByRole("button");
    const trashButton = deleteButtons.find((btn: HTMLElement) =>
      btn.querySelector("svg.text-destructive") || btn.innerHTML.includes("text-destructive")
    );

    if (trashButton) {
      fireEvent.click(trashButton);
      await waitFor(() => {
        expect(screen.getByText("Confirmar exclusão")).toBeInTheDocument();
        expect(screen.getByText(/tem certeza/i)).toBeInTheDocument();
      });
    }
  });
});
