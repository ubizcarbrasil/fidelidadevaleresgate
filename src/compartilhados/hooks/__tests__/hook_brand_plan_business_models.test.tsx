/**
 * hook_brand_plan_business_models — combina 5 queries pra resolver
 * estado de cada Business Model (active/available_inactive/locked)
 * por brand+plano + add-ons.
 *
 * Bug aqui = UI mostra módulo como "active" mas usuário não consegue
 * usar (state errado), ou "locked" quando deveria estar disponível
 * pelo add-on (perda de receita).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

import { useBrandPlanBusinessModels } from "../hook_brand_plan_business_models";

function selectChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  ["select", "eq", "order"].forEach((op) => { c[op] = vi.fn(() => c); });
  c.maybeSingle = vi.fn(() => Promise.resolve(result));
  c.then = (resolve: (r: unknown) => void) => resolve(result);
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

// Helpers pra montar resposta de cada tabela
function setupTables(opts: {
  business_models?: unknown[]; // catálogo
  brand_plan?: string;
  plan_business_models?: { business_model_id: string }[];
  brand_business_models?: { business_model_id: string; is_enabled: boolean }[];
  active_addons?: { business_model_id: string; branch_id: string | null }[];
}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === "business_models") {
      return selectChain({ data: opts.business_models ?? [], error: null });
    }
    if (table === "brands") {
      return selectChain({
        data: { subscription_plan: opts.brand_plan ?? "free" },
        error: null,
      });
    }
    if (table === "plan_business_models") {
      return selectChain({ data: opts.plan_business_models ?? [], error: null });
    }
    if (table === "brand_business_models") {
      return selectChain({ data: opts.brand_business_models ?? [], error: null });
    }
    if (table === "brand_business_model_addons") {
      return selectChain({ data: opts.active_addons ?? [], error: null });
    }
    return selectChain({ data: [], error: null });
  });
}

describe("useBrandPlanBusinessModels — state resolution", () => {
  it("brandId null: queries não disparam", () => {
    setupTables({});
    const { result } = renderHook(() => useBrandPlanBusinessModels(null), wrap());
    expect(result.current.isLoading).toBe(true); // plan/brand depend disabled
  });

  it("modelo no plano + brand row is_enabled=true → state='active', source='plan'", async () => {
    setupTables({
      business_models: [
        { id: "m1", key: "loyalty", name: "Fidelidade", audience: "cliente", sort_order: 0 },
      ],
      brand_plan: "starter",
      plan_business_models: [{ business_model_id: "m1" }],
      brand_business_models: [{ business_model_id: "m1", is_enabled: true }],
    });

    const { result } = renderHook(
      () => useBrandPlanBusinessModels("b1"),
      wrap(),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.resolved[0]).toMatchObject({
      state: "active",
      source: "plan",
    });
  });

  it("modelo no plano mas sem brand row → 'available_inactive'", async () => {
    setupTables({
      business_models: [
        { id: "m1", key: "loyalty", audience: "cliente", sort_order: 0 },
      ],
      brand_plan: "starter",
      plan_business_models: [{ business_model_id: "m1" }],
      brand_business_models: [],
    });

    const { result } = renderHook(
      () => useBrandPlanBusinessModels("b1"),
      wrap(),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.resolved[0].state).toBe("available_inactive");
    expect(result.current.resolved[0].source).toBe("plan");
  });

  it("modelo NÃO no plano mas com addon brand: state baseado em is_enabled, source='addon'", async () => {
    setupTables({
      business_models: [
        { id: "m2", key: "campeonato", audience: "motorista", sort_order: 0 },
      ],
      brand_plan: "free",
      plan_business_models: [], // não incluído no plano free
      brand_business_models: [{ business_model_id: "m2", is_enabled: true }],
      active_addons: [{ business_model_id: "m2", branch_id: null }],
    });

    const { result } = renderHook(
      () => useBrandPlanBusinessModels("b1"),
      wrap(),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.resolved[0]).toMatchObject({
      state: "active",
      source: "addon",
    });
  });

  it("addon só de cidade (branch_id != null): source='addon_branch'", async () => {
    setupTables({
      business_models: [
        { id: "m3", key: "x", audience: "b2b", sort_order: 0 },
      ],
      brand_plan: "free",
      plan_business_models: [],
      brand_business_models: [],
      active_addons: [{ business_model_id: "m3", branch_id: "br1" }],
    });

    const { result } = renderHook(
      () => useBrandPlanBusinessModels("b1"),
      wrap(),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.resolved[0]).toMatchObject({
      state: "available_inactive", // sem row enable
      source: "addon_branch",
    });
  });

  it("modelo sem plano e sem addon: state='locked', source=null", async () => {
    setupTables({
      business_models: [
        { id: "m9", key: "premium", audience: "b2b", sort_order: 0 },
      ],
      brand_plan: "free",
      plan_business_models: [],
      brand_business_models: [],
      active_addons: [],
    });

    const { result } = renderHook(
      () => useBrandPlanBusinessModels("b1"),
      wrap(),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.resolved[0]).toMatchObject({
      state: "locked",
      source: null,
    });
  });

  it("precedência: plano vence addon mesmo se ambos presentes", async () => {
    setupTables({
      business_models: [
        { id: "m1", key: "k1", audience: "cliente", sort_order: 0 },
      ],
      brand_plan: "starter",
      plan_business_models: [{ business_model_id: "m1" }],
      brand_business_models: [],
      active_addons: [{ business_model_id: "m1", branch_id: null }],
    });

    const { result } = renderHook(
      () => useBrandPlanBusinessModels("b1"),
      wrap(),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.resolved[0].source).toBe("plan");
  });
});

describe("useBrandPlanBusinessModels — grouped + counts", () => {
  it("grouped separa por audience", async () => {
    setupTables({
      business_models: [
        { id: "m1", key: "k1", audience: "cliente", sort_order: 0 },
        { id: "m2", key: "k2", audience: "motorista", sort_order: 1 },
        { id: "m3", key: "k3", audience: "b2b", sort_order: 2 },
      ],
      brand_plan: "starter",
      plan_business_models: [{ business_model_id: "m1" }],
    });

    const { result } = renderHook(
      () => useBrandPlanBusinessModels("b1"),
      wrap(),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.grouped.cliente).toHaveLength(1);
    expect(result.current.grouped.motorista).toHaveLength(1);
    expect(result.current.grouped.b2b).toHaveLength(1);
  });

  it("counts: active = is_enabled true em estados não-locked; total = não-locked; all = todos", async () => {
    setupTables({
      business_models: [
        { id: "m1", key: "k1", audience: "cliente", sort_order: 0 },
        { id: "m2", key: "k2", audience: "cliente", sort_order: 1 },
        { id: "m3", key: "k3", audience: "cliente", sort_order: 2 }, // locked
      ],
      brand_plan: "starter",
      plan_business_models: [
        { business_model_id: "m1" },
        { business_model_id: "m2" },
      ],
      brand_business_models: [
        { business_model_id: "m1", is_enabled: true },
        // m2 sem row → available_inactive
      ],
    });

    const { result } = renderHook(
      () => useBrandPlanBusinessModels("b1"),
      wrap(),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.counts).toEqual({ active: 1, total: 2, all: 3 });
  });

  it("planKey exposed via planQ.data", async () => {
    setupTables({ brand_plan: "enterprise" });
    const { result } = renderHook(
      () => useBrandPlanBusinessModels("b1"),
      wrap(),
    );
    await waitFor(() => expect(result.current.planKey).toBe("enterprise"));
  });
});
