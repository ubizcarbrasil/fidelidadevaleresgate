/**
 * hook_regras_resgate_cidade — hierarquia de regras de resgate.
 *
 * Bug aqui = cliente ganha desconto errado (points_per_real divergente
 * do que admin configurou na cidade). Hierarquia: cidade > marca > padrão.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

import {
  useRegrasResgateCidade,
  REGRAS_RESGATE_PADRAO,
} from "../hook_regras_resgate_cidade";

function chain(maybeSingleResult: { data?: unknown; error?: unknown } = { data: null }) {
  const c: Record<string, unknown> = {};
  ["select", "eq"].forEach((op) => { c[op] = vi.fn(() => c); });
  c.maybeSingle = vi.fn(() => Promise.resolve(maybeSingleResult));
  return c;
}

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

beforeEach(() => {
  mockFrom.mockReset();
});

// ── PADROES ──────────────────────────────────────────────
describe("REGRAS_RESGATE_PADRAO", () => {
  it("default 40 points/real, 100 min, 3/mês, 48h", () => {
    expect(REGRAS_RESGATE_PADRAO).toEqual({
      points_per_real: 40,
      points_per_real_driver: 40,
      points_per_real_customer: 40,
      min_points_to_redeem: 100,
      max_redemptions_per_month: 3,
      approval_deadline_hours: 48,
    });
  });
});

// ── Hierarquia ───────────────────────────────────────────
describe("useRegrasResgateCidade", () => {
  it("brandId null: query disabled", () => {
    const { result } = renderHook(() => useRegrasResgateCidade(null), wrap());
    expect(result.current.isFetching).toBe(false);
  });

  it("sem brand_settings nem branch: usa padrões", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "brands") return chain({ data: { brand_settings_json: null } });
      return chain({ data: null });
    });
    const { result } = renderHook(() => useRegrasResgateCidade("b1"), wrap());
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.points_per_real).toBe(40);
    expect(result.current.data!.min_points_to_redeem).toBe(100);
  });

  it("brand override: usa valores da marca", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "brands") {
        return chain({
          data: {
            brand_settings_json: {
              redemption_rules: {
                points_per_real: 20,
                min_points_to_redeem: 200,
              },
            },
          },
        });
      }
      return chain({ data: null });
    });
    const { result } = renderHook(() => useRegrasResgateCidade("b1"), wrap());
    await waitFor(() => expect(result.current.data?.points_per_real).toBe(20));
    expect(result.current.data!.min_points_to_redeem).toBe(200);
    // Não-overridden mantém padrão
    expect(result.current.data!.max_redemptions_per_month).toBe(3);
  });

  it("cidade sobrescreve marca (cidade vence)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "brands") {
        return chain({
          data: {
            brand_settings_json: {
              redemption_rules: { points_per_real: 20, min_points_to_redeem: 200 },
            },
          },
        });
      }
      if (table === "branches") {
        return chain({
          data: {
            branch_settings_json: {
              redemption_rules: { points_per_real: 10 }, // só ppr; min vem da marca
            },
          },
        });
      }
      return chain({ data: null });
    });
    const { result } = renderHook(
      () => useRegrasResgateCidade("b1", "br1"),
      wrap(),
    );
    await waitFor(() => expect(result.current.data?.points_per_real).toBe(10));
    // min_points vem da marca (cidade não overrideu)
    expect(result.current.data!.min_points_to_redeem).toBe(200);
    // max vem do padrão
    expect(result.current.data!.max_redemptions_per_month).toBe(3);
  });

  it("driver/customer fallback pra points_per_real quando não definidos explicitamente", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "brands") {
        return chain({
          data: {
            brand_settings_json: {
              redemption_rules: { points_per_real: 25 },
            },
          },
        });
      }
      return chain({ data: null });
    });
    const { result } = renderHook(() => useRegrasResgateCidade("b1"), wrap());
    await waitFor(() => expect(result.current.data?.points_per_real).toBe(25));
    // driver e customer caem pro ppr base (25), não pro padrão 40
    expect(result.current.data!.points_per_real_driver).toBe(25);
    expect(result.current.data!.points_per_real_customer).toBe(25);
  });

  it("driver/customer override explícito tem precedência", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "brands") {
        return chain({
          data: {
            brand_settings_json: {
              redemption_rules: {
                points_per_real: 40,
                points_per_real_driver: 30,
                points_per_real_customer: 50,
              },
            },
          },
        });
      }
      return chain({ data: null });
    });
    const { result } = renderHook(() => useRegrasResgateCidade("b1"), wrap());
    await waitFor(() => expect(result.current.data?.points_per_real_driver).toBe(30));
    expect(result.current.data!.points_per_real_customer).toBe(50);
    expect(result.current.data!.points_per_real).toBe(40);
  });

  it("sem branchId: NÃO consulta branches (só brands)", async () => {
    mockFrom.mockReturnValue(chain({ data: { brand_settings_json: null } }));
    renderHook(() => useRegrasResgateCidade("b1"), wrap());
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());
    const tables = mockFrom.mock.calls.map((c) => c[0]);
    expect(tables).toContain("brands");
    expect(tables).not.toContain("branches");
  });

  it("com branchId: consulta brands E branches em paralelo", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "brands") return chain({ data: { brand_settings_json: null } });
      return chain({ data: { branch_settings_json: null } });
    });
    renderHook(() => useRegrasResgateCidade("b1", "br1"), wrap());
    await waitFor(() => {
      const tables = mockFrom.mock.calls.map((c) => c[0]);
      expect(tables).toContain("brands");
      expect(tables).toContain("branches");
    });
  });
});
