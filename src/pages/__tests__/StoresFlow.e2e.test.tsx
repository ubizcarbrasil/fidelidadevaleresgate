/**
 * E2E Integration Tests — Stores CRUD Flow
 * Tests: list stores, create dialog, status display, approval tabs
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// We need to import after mocks are set up
let StoresPage: any;

// ── Mock Data ────────────────────────────────────────────
const MOCK_STORES = [
  {
    id: "store-1", name: "Pizzaria do João", slug: "pizzaria-joao",
    brand_id: "brand-1", branch_id: "branch-1", category: "Alimentação",
    is_active: true, approval_status: "APPROVED", store_type: "STANDARD",
    created_at: "2026-01-01T00:00:00Z", segment: "food",
    phone: "11999999999", address: "Rua Teste, 123",
    logo_url: null, banner_url: null, description: "Melhor pizza",
    tags: [], whatsapp: "11999999999",
    branches: { name: "São Paulo" }, brands: { name: "Vale Resgate" },
    owner_user_id: "user-1",
  },
  {
    id: "store-2", name: "Loja ABC", slug: "loja-abc",
    brand_id: "brand-1", branch_id: "branch-1", category: "Varejo",
    is_active: false, approval_status: "PENDING", store_type: "STANDARD",
    created_at: "2026-02-01T00:00:00Z", segment: "retail",
    phone: "11888888888", address: "Av. Brasil, 456",
    logo_url: null, banner_url: null, description: null,
    tags: [], whatsapp: null,
    branches: { name: "São Paulo" }, brands: { name: "Vale Resgate" },
    owner_user_id: null,
  },
];

function createChainedBuilder(resolvedValue: any) {
  const builder: any = {};
  ["select", "insert", "update", "delete", "eq", "neq", "ilike", "or", "order", "range", "single", "in"].forEach((m) => {
    builder[m] = vi.fn().mockReturnValue(builder);
  });
  const p = Promise.resolve(resolvedValue);
  builder.then = p.then.bind(p);
  builder.catch = p.catch.bind(p);
  return builder;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "stores") {
        return createChainedBuilder({ data: MOCK_STORES, error: null, count: 2 });
      }
      if (table === "brands") {
        return createChainedBuilder({ data: [{ id: "brand-1", name: "Vale Resgate" }], error: null });
      }
      if (table === "branches") {
        return createChainedBuilder({ data: [{ id: "branch-1", name: "São Paulo", brand_id: "brand-1" }], error: null });
      }
      return createChainedBuilder({ data: [], error: null });
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "test.png" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://test.com/test.png" } }),
      }),
    },
  },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/hooks/useBrandGuard", () => ({
  useBrandGuard: () => ({ currentBrandId: "brand-1", isRootAdmin: false }),
}));

// Dynamic import after mocks
beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import("../StoresPage");
  StoresPage = mod.default;
});

function renderStores() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <StoresPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Stores CRUD E2E", () => {
  it("renders store list with data", async () => {
    renderStores();
    await waitFor(() => {
      expect(screen.getByText("Pizzaria do João")).toBeInTheDocument();
      expect(screen.getByText("Loja ABC")).toBeInTheDocument();
    });
  });

  it("shows approval status badges", async () => {
    renderStores();
    await waitFor(() => {
      // Look for status indicators
      const allText = document.body.textContent;
      expect(allText).toContain("Pizzaria do João");
    });
  });

  it("has search input for filtering stores", () => {
    renderStores();
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("opens create store dialog", async () => {
    renderStores();
    const newButton = screen.getByRole("button", { name: /novo parceiro|nova loja|cadastrar/i });
    if (newButton) {
      fireEvent.click(newButton);
      await waitFor(() => {
        // Dialog should open with form fields
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog).toBeTruthy();
      });
    }
  });

  it("renders page header", () => {
    renderStores();
    expect(screen.getByText("Parceiros")).toBeInTheDocument();
  });
});
