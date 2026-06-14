/**
 * CustomerContext — resolve customer record do user atual no brand+branch,
 * suporta impersonation (admin via ?customerId), auto-link de orphan de
 * motorista (criado pelo webhook sem user_id), move customer entre branches,
 * auto-create se não existe.
 *
 * Bug aqui = customer vaza entre brands, admin perde isolamento ao
 * impersonar, motorista órfão duplica record, isDriver detecção quebra
 * por regex case.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { mockUseAuth, mockUseBrand, mockFrom } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseBrand: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("../AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../BrandContext", () => ({
  useBrand: () => mockUseBrand(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

import { CustomerProvider, useCustomer } from "../CustomerContext";

const USER = { id: "u1", email: "maria@test.com", user_metadata: { full_name: "Maria", phone: "11999" } };
const BRAND = { id: "b1" };
const BRANCH_A = { id: "branch-a" };
const BRANCH_B = { id: "branch-b" };

function Probe({ onCtx }: { onCtx: (ctx: ReturnType<typeof useCustomer>) => void }) {
  const ctx = useCustomer();
  React.useEffect(() => { onCtx(ctx); }, [ctx, onCtx]);
  return null;
}

function renderWithCustomer() {
  const captured: { current: ReturnType<typeof useCustomer> | null } = { current: null };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <CustomerProvider>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </CustomerProvider>
    </QueryClientProvider>,
  );
  return { ...utils, captured };
}

function setSearch(search: string) {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { search, pathname: "/", hostname: "x" },
  });
}

beforeEach(() => {
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue({ user: null, roles: [] });
  mockUseBrand.mockReset();
  mockUseBrand.mockReturnValue({ brand: null, selectedBranch: null });
  mockFrom.mockReset();
  setSearch("");
});

// ────────────────────────────────────────────────────────
// Guards (disabled query)
// ────────────────────────────────────────────────────────
describe("CustomerProvider — guards", () => {
  it("sem user: customer=null, loading=false, sem fetch", async () => {
    const { captured } = renderWithCustomer();
    await waitFor(() => expect(captured.current?.loading).toBe(false));
    expect(captured.current?.customer).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("user mas brand=null: sem fetch", async () => {
    mockUseAuth.mockReturnValue({ user: USER, roles: [] });
    const { captured } = renderWithCustomer();
    await waitFor(() => expect(captured.current?.loading).toBe(false));
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("user + brand mas sem branch + sem impersonation: sem fetch", async () => {
    mockUseAuth.mockReturnValue({ user: USER, roles: [] });
    mockUseBrand.mockReturnValue({ brand: BRAND, selectedBranch: null });
    const { captured } = renderWithCustomer();
    await waitFor(() => expect(captured.current?.loading).toBe(false));
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────
// isImpersonating (admin via ?customerId)
// ────────────────────────────────────────────────────────
describe("isImpersonating", () => {
  it("?customerId + admin role: fetcha customer específico", async () => {
    setSearch("?customerId=cust-target");
    mockUseAuth.mockReturnValue({
      user: USER,
      roles: [{ role: "root_admin", brand_id: null }],
    });
    mockUseBrand.mockReturnValue({ brand: BRAND, selectedBranch: BRANCH_A });

    const targetCustomer = { id: "cust-target", name: "Target Customer", brand_id: "b1", branch_id: "branch-a" };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: targetCustomer }),
    });

    const { captured } = renderWithCustomer();
    await waitFor(() => expect(captured.current?.customer?.id).toBe("cust-target"));
    expect(captured.current?.isImpersonating).toBe(true);
  });

  it("?customerId mas user NÃO é admin: canImpersonate=false, query disabled (sem branch)", async () => {
    setSearch("?customerId=cust-target");
    mockUseAuth.mockReturnValue({
      user: USER,
      roles: [{ role: "customer", brand_id: "b1" }],
    });
    mockUseBrand.mockReturnValue({ brand: BRAND, selectedBranch: null });

    const { captured } = renderWithCustomer();
    await waitFor(() => expect(captured.current?.loading).toBe(false));
    expect(captured.current?.isImpersonating).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────
// Fluxo normal (sem impersonation)
// ────────────────────────────────────────────────────────
describe("CustomerProvider — fluxo normal", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: USER, roles: [] });
    mockUseBrand.mockReturnValue({ brand: BRAND, selectedBranch: BRANCH_A });
  });

  it("já tem customer na branch A: retorna direto", async () => {
    const cust = { id: "c1", name: "Maria", brand_id: "b1", branch_id: "branch-a", points_balance: 100 };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [cust] }),
    });

    const { captured } = renderWithCustomer();
    await waitFor(() => expect(captured.current?.customer?.id).toBe("c1"));
  });

  it("customer existe em OUTRA branch: move pra branch atual via update", async () => {
    const existing = { id: "c1", name: "Maria", brand_id: "b1", branch_id: "branch-other", points_balance: 100 };
    const moved = { ...existing, branch_id: "branch-a" };
    let updateCalled = false;
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [existing] }),
      update: vi.fn((patch: Record<string, unknown>) => {
        updateCalled = true;
        expect(patch).toEqual({ branch_id: "branch-a" });
        return {
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: moved }),
        };
      }),
    }));

    const { captured } = renderWithCustomer();
    await waitFor(() => expect(captured.current?.customer?.branch_id).toBe("branch-a"));
    expect(updateCalled).toBe(true);
  });

  it("isDriver: detecta tag [MOTORISTA] no nome (case insensitive)", async () => {
    const driver = { id: "d1", name: "João Motorista [MOTORISTA]", brand_id: "b1", branch_id: "branch-a" };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [driver] }),
    });
    const { captured } = renderWithCustomer();
    await waitFor(() => expect(captured.current?.customer?.id).toBe("d1"));
    expect(captured.current?.isDriver).toBe(true);
  });

  it("isDriver false pra customer comum sem tag", async () => {
    const cust = { id: "c1", name: "Maria Cliente", brand_id: "b1", branch_id: "branch-a" };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [cust] }),
    });
    const { captured } = renderWithCustomer();
    await waitFor(() => expect(captured.current?.customer?.id).toBe("c1"));
    expect(captured.current?.isDriver).toBe(false);
  });
});

// ────────────────────────────────────────────────────────
// useCustomer orphan
// ────────────────────────────────────────────────────────
describe("useCustomer orphan", () => {
  it("fora do Provider: throw com mensagem clara", () => {
    function Orphan() {
      useCustomer();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<Orphan />)).toThrow(/useCustomer must be used within CustomerProvider/);
    } finally {
      spy.mockRestore();
    }
  });
});
