/**
 * hook_plan_business_models — matriz Plano × Modelo de Negócio.
 *
 * Bug aqui = cliente assina plano X mas vê módulo do plano Y, ou
 * vice-versa (cobrança/feature mismatch). Audit trail falhando deixa
 * lacuna em forensics.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { mockFrom, mockGetUser, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    auth: { getUser: mockGetUser },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

import {
  usePlanBusinessModelsMatrix,
  useTogglePlanBusinessModel,
  useBulkSetPlan,
} from "../hook_plan_business_models";

function selectChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.select = vi.fn(() => c);
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function upsertChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.upsert = vi.fn(() => c);
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function insertChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.insert = vi.fn(() => c);
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function wrap(): { wrapper: (p: { children: ReactNode }) => JSX.Element; qc: QueryClient } {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    qc,
    wrapper: ({ children }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  mockFrom.mockReset();
  mockGetUser.mockClear().mockResolvedValue({ data: { user: { id: "u1" } } });
  mockToastSuccess.mockReset();
  mockToastError.mockReset();
});

// ── usePlanBusinessModelsMatrix ──────────────────────────
describe("usePlanBusinessModelsMatrix", () => {
  it("monta Map<'plan::model', row> a partir das rows do select", async () => {
    mockFrom.mockReturnValue(
      selectChain({
        data: [
          { plan_key: "free", business_model_id: "m1", is_included: true },
          { plan_key: "starter", business_model_id: "m1", is_included: false },
        ],
        error: null,
      }),
    );

    const { result } = renderHook(() => usePlanBusinessModelsMatrix(), wrap());
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data?.get("free::m1")?.is_included).toBe(true);
    expect(result.current.data?.get("starter::m1")?.is_included).toBe(false);
    expect(result.current.data?.size).toBe(2);
  });

  it("data null: Map vazio", async () => {
    mockFrom.mockReturnValue(selectChain({ data: null, error: null }));
    const { result } = renderHook(() => usePlanBusinessModelsMatrix(), wrap());
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.size).toBe(0);
  });

  it("erro: marca isError", async () => {
    mockFrom.mockReturnValue(selectChain({ data: null, error: new Error("RLS") }));
    const { result } = renderHook(() => usePlanBusinessModelsMatrix(), wrap());
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ── useTogglePlanBusinessModel ───────────────────────────
describe("useTogglePlanBusinessModel", () => {
  it("upsert com onConflict + audit write + invalidate", async () => {
    let auditPayload: Record<string, unknown> | null = null;
    let upsertPayload: unknown = null;
    let upsertOpts: unknown = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "plan_business_models") {
        const c = upsertChain({ data: null, error: null });
        const orig = c.upsert as (...args: unknown[]) => unknown;
        c.upsert = vi.fn((row: unknown, opts: unknown) => {
          upsertPayload = row;
          upsertOpts = opts;
          return orig(row, opts);
        });
        return c;
      }
      if (table === "audit_logs") {
        const c = insertChain({ data: null, error: null });
        c.insert = vi.fn((p: Record<string, unknown>) => {
          auditPayload = p;
          return c;
        });
        return c;
      }
      return selectChain({ data: null });
    });

    const { wrapper, qc } = wrap();
    const invSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useTogglePlanBusinessModel(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        plan_key: "starter",
        business_model_id: "m1",
        is_included: true,
      });
    });

    expect(upsertPayload).toMatchObject({
      plan_key: "starter",
      business_model_id: "m1",
      is_included: true,
    });
    expect(upsertOpts).toMatchObject({
      onConflict: "plan_key,business_model_id",
    });
    expect(auditPayload).toMatchObject({
      action: "plan_included",
      entity_type: "plan_business_model",
      actor_user_id: "u1",
    });
    expect(invSpy).toHaveBeenCalledWith({
      queryKey: ["plan-business-models-matrix"],
    });
  });

  it("is_included=false: audit action='plan_excluded'", async () => {
    let auditPayload: Record<string, unknown> | null = null;
    mockFrom.mockImplementation((table: string) => {
      if (table === "plan_business_models") return upsertChain({ data: null });
      const c = insertChain({ data: null });
      c.insert = vi.fn((p: Record<string, unknown>) => {
        auditPayload = p;
        return c;
      });
      return c;
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useTogglePlanBusinessModel(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        plan_key: "free",
        business_model_id: "m9",
        is_included: false,
      });
    });
    expect(auditPayload).toMatchObject({ action: "plan_excluded" });
  });

  it("audit falha: NÃO bloqueia mutation (swallow)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "plan_business_models") return upsertChain({ data: null });
      // audit lança
      const c: Record<string, unknown> = {};
      c.insert = vi.fn(() => { throw new Error("audit denied"); });
      return c;
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useTogglePlanBusinessModel(), { wrapper });
    await expect(
      result.current.mutateAsync({
        plan_key: "free",
        business_model_id: "m1",
        is_included: true,
      }),
    ).resolves.toBeUndefined();
  });

  it("upsert erro: toast.error + propaga rejection", async () => {
    mockFrom.mockReturnValue(upsertChain({
      data: null,
      error: new Error("rls denied"),
    }));

    const { wrapper } = wrap();
    const { result } = renderHook(() => useTogglePlanBusinessModel(), { wrapper });
    await expect(
      result.current.mutateAsync({
        plan_key: "free",
        business_model_id: "m1",
        is_included: true,
      }),
    ).rejects.toThrow("rls denied");

    expect(mockToastError).toHaveBeenCalledWith("rls denied");
  });
});

// ── useBulkSetPlan ───────────────────────────────────────
describe("useBulkSetPlan", () => {
  it("upsert múltiplas rows + audit com count + toast success", async () => {
    let upsertRows: unknown[] | null = null;
    let auditPayload: Record<string, unknown> | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "plan_business_models") {
        const c = upsertChain({ data: null, error: null });
        c.upsert = vi.fn((rows: unknown[]) => {
          upsertRows = rows;
          c.then = (resolve: (r: unknown) => void) => resolve({ error: null });
          return c;
        });
        return c;
      }
      const c = insertChain({ data: null });
      c.insert = vi.fn((p: Record<string, unknown>) => {
        auditPayload = p;
        return c;
      });
      return c;
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useBulkSetPlan(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        plan_key: "enterprise",
        business_model_ids: ["m1", "m2", "m3"],
        is_included: true,
      });
    });

    expect(upsertRows).toHaveLength(3);
    expect((upsertRows as Array<{ plan_key: string }>)[0]).toMatchObject({
      plan_key: "enterprise",
      business_model_id: "m1",
      is_included: true,
    });
    expect(auditPayload).toMatchObject({
      action: "plan_bulk_included",
      changes_json: { plan_key: "enterprise", count: 3 },
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("Plano atualizado");
  });

  it("is_included=false: audit action 'plan_bulk_excluded'", async () => {
    let auditPayload: Record<string, unknown> | null = null;
    mockFrom.mockImplementation((table: string) => {
      if (table === "plan_business_models") return upsertChain({ data: null });
      const c = insertChain({ data: null });
      c.insert = vi.fn((p: Record<string, unknown>) => {
        auditPayload = p;
        return c;
      });
      return c;
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useBulkSetPlan(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        plan_key: "free",
        business_model_ids: ["m1"],
        is_included: false,
      });
    });
    expect(auditPayload).toMatchObject({ action: "plan_bulk_excluded" });
  });

  it("ids vazios: rows=[], audit count=0, ainda chama upsert", async () => {
    let upsertRows: unknown[] | null = null;
    mockFrom.mockImplementation((table: string) => {
      if (table === "plan_business_models") {
        const c = upsertChain({ data: null });
        c.upsert = vi.fn((rows: unknown[]) => {
          upsertRows = rows;
          c.then = (resolve: (r: unknown) => void) => resolve({ error: null });
          return c;
        });
        return c;
      }
      return insertChain({ data: null });
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useBulkSetPlan(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        plan_key: "starter",
        business_model_ids: [],
        is_included: true,
      });
    });
    expect(upsertRows).toEqual([]);
  });
});
