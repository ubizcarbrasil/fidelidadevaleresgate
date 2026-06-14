/**
 * hook_city_business_model_overrides — CRUD de overrides por cidade
 * sobre Business Models.
 *
 * Bug aqui = cidade não consegue ligar/desligar modelo (UX quebrada),
 * "voltar ao herdado" não funciona (delete preso), clear-all não
 * conta deleted corretamente (UX confusa).
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
  supabase: { from: mockFrom, auth: { getUser: mockGetUser } },
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

import {
  useCityBusinessModelOverrides,
  useSetCityBusinessModelOverride,
  useDeleteCityBusinessModelOverride,
  useClearAllCityBusinessModelOverrides,
} from "../hook_city_business_model_overrides";

function selectChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.select = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function updateChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.update = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function insertChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.insert = vi.fn(() => c);
  c.select = vi.fn(() => c);
  c.maybeSingle = vi.fn(() => Promise.resolve(result));
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function deleteChain(result: { data?: unknown; error?: unknown; count?: number }) {
  const c: Record<string, unknown> = {};
  c.delete = vi.fn(() => c);
  c.eq = vi.fn(() => c);
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

// ── useCityBusinessModelOverrides ────────────────────────
describe("useCityBusinessModelOverrides", () => {
  it("sem brandId OU branchId: query disabled", () => {
    const { result: r1 } = renderHook(() => useCityBusinessModelOverrides(null, "br1"), wrap());
    const { result: r2 } = renderHook(() => useCityBusinessModelOverrides("b1", null), wrap());
    expect(r1.current.isFetching).toBe(false);
    expect(r2.current.isFetching).toBe(false);
  });

  it("retorna lista filtrada por brand+branch", async () => {
    const c = selectChain({
      data: [{ id: "ov1", brand_id: "b1", branch_id: "br1", is_enabled: false }],
      error: null,
    });
    mockFrom.mockReturnValue(c);
    const { result } = renderHook(() => useCityBusinessModelOverrides("b1", "br1"), wrap());
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    // 2 eq calls (brand_id + branch_id)
    expect(c.eq).toHaveBeenCalledTimes(2);
  });
});

// ── useSetCityBusinessModelOverride ──────────────────────
describe("useSetCityBusinessModelOverride — UPDATE", () => {
  it("com existingRowId: UPDATE is_enabled + audit 'override_enabled' + 2 invalidates", async () => {
    let updatePayload: Record<string, unknown> | null = null;
    let auditAction: string | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "city_business_model_overrides") {
        const c = updateChain({ data: null, error: null });
        c.update = vi.fn((p: Record<string, unknown>) => {
          updatePayload = p;
          return c;
        });
        return c;
      }
      const c = insertChain({ data: null });
      c.insert = vi.fn((p: Record<string, unknown>) => {
        auditAction = p.action as string;
        return c;
      });
      return c;
    });

    const { wrapper, qc } = wrap();
    const invSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useSetCityBusinessModelOverride(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        brandId: "b1",
        branchId: "br1",
        businessModelId: "m1",
        modelKey: "campeonato",
        enabled: true,
        existingRowId: "ov-99",
      });
    });

    expect(updatePayload).toEqual({ is_enabled: true });
    expect(auditAction).toBe("override_enabled");
    expect(invSpy).toHaveBeenCalledTimes(2); // overrides + resolved-business-models
    expect(mockToastSuccess.mock.calls[0][0]).toContain("religado");
  });

  it("enabled=false: audit 'override_disabled' + toast 'desligado'", async () => {
    let auditAction: string | null = null;
    mockFrom.mockImplementation((table: string) => {
      if (table === "city_business_model_overrides") return updateChain({ data: null });
      const c = insertChain({ data: null });
      c.insert = vi.fn((p: Record<string, unknown>) => {
        auditAction = p.action as string;
        return c;
      });
      return c;
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useSetCityBusinessModelOverride(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        brandId: "b1",
        branchId: "br1",
        businessModelId: "m1",
        modelKey: "x",
        enabled: false,
        existingRowId: "ov-1",
      });
    });

    expect(auditAction).toBe("override_disabled");
    expect(mockToastSuccess.mock.calls[0][0]).toContain("desligado");
  });
});

describe("useSetCityBusinessModelOverride — INSERT", () => {
  it("sem existingRowId: INSERT + returning id + audit usa o id", async () => {
    let insertPayload: Record<string, unknown> | null = null;
    let auditEntityId: string | null | undefined = undefined;

    mockFrom.mockImplementation((table: string) => {
      if (table === "city_business_model_overrides") {
        const c = insertChain({ data: { id: "new-ov-uuid" }, error: null });
        c.insert = vi.fn((p: Record<string, unknown>) => {
          insertPayload = p;
          return c;
        });
        return c;
      }
      const c = insertChain({ data: null });
      c.insert = vi.fn((p: Record<string, unknown>) => {
        auditEntityId = (p as { entity_id?: string }).entity_id;
        return c;
      });
      return c;
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useSetCityBusinessModelOverride(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        brandId: "b1",
        branchId: "br1",
        businessModelId: "m1",
        modelKey: "x",
        enabled: true,
      });
    });

    expect(insertPayload).toMatchObject({
      brand_id: "b1",
      branch_id: "br1",
      business_model_id: "m1",
      is_enabled: true,
    });
    expect(auditEntityId).toBe("new-ov-uuid");
  });

  it("erro INSERT: toast + propaga", async () => {
    mockFrom.mockReturnValue(insertChain({
      data: null,
      error: new Error("rls denied"),
    }));
    const { wrapper } = wrap();
    const { result } = renderHook(() => useSetCityBusinessModelOverride(), { wrapper });
    await expect(
      result.current.mutateAsync({
        brandId: "b1",
        branchId: "br1",
        businessModelId: "m1",
        modelKey: "x",
        enabled: true,
      }),
    ).rejects.toThrow("rls denied");
    expect(mockToastError).toHaveBeenCalled();
  });
});

// ── useDeleteCityBusinessModelOverride ───────────────────
describe("useDeleteCityBusinessModelOverride", () => {
  it("DELETE eq(id) + audit 'override_removed' + 2 invalidates + toast", async () => {
    let auditPayload: Record<string, unknown> | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "city_business_model_overrides") return deleteChain({ error: null });
      const c = insertChain({ data: null });
      c.insert = vi.fn((p: Record<string, unknown>) => {
        auditPayload = p;
        return c;
      });
      return c;
    });

    const { wrapper, qc } = wrap();
    const invSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useDeleteCityBusinessModelOverride(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        rowId: "ov-1",
        brandId: "b1",
        branchId: "br1",
        businessModelId: "m1",
        modelKey: "x",
        previousIsEnabled: true,
      });
    });

    expect(auditPayload).toMatchObject({
      action: "override_removed",
      entity_id: "ov-1",
      changes_json: expect.objectContaining({
        brand_id: "b1",
        branch_id: "br1",
        model_key: "x",
        previous_is_enabled: true,
      }),
    });
    expect(invSpy).toHaveBeenCalledTimes(2);
    expect(mockToastSuccess.mock.calls[0][0]).toContain("herdado");
  });

  it("erro: toast + propaga", async () => {
    mockFrom.mockReturnValue(deleteChain({ error: new Error("denied") }));
    const { wrapper } = wrap();
    const { result } = renderHook(() => useDeleteCityBusinessModelOverride(), { wrapper });
    await expect(
      result.current.mutateAsync({
        rowId: "ov-1",
        brandId: "b1",
        branchId: "br1",
        businessModelId: "m1",
        modelKey: "x",
        previousIsEnabled: true,
      }),
    ).rejects.toThrow("denied");
  });
});

// ── useClearAllCityBusinessModelOverrides ────────────────
describe("useClearAllCityBusinessModelOverrides", () => {
  it("DELETE com count + audit deleted_count + toast com numero", async () => {
    let auditChanges: Record<string, unknown> | null = null;
    let deleteOpts: unknown = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "city_business_model_overrides") {
        const c: Record<string, unknown> = {};
        c.delete = vi.fn((opts: unknown) => {
          deleteOpts = opts;
          return c;
        });
        c.eq = vi.fn(() => c);
        c.then = (resolve: (r: unknown) => void) =>
          resolve({ error: null, count: 5 });
        return c;
      }
      const c = insertChain({ data: null });
      c.insert = vi.fn((p: Record<string, unknown>) => {
        auditChanges = (p as { changes_json: Record<string, unknown> }).changes_json;
        return c;
      });
      return c;
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useClearAllCityBusinessModelOverrides(), { wrapper });

    await act(async () => {
      const r = await result.current.mutateAsync({
        brandId: "b1",
        branchId: "br1",
      });
      expect(r).toBe(5);
    });

    expect(deleteOpts).toEqual({ count: "exact" });
    expect(auditChanges).toMatchObject({
      brand_id: "b1",
      branch_id: "br1",
      deleted_count: 5,
    });
    expect(mockToastSuccess.mock.calls[0][0]).toContain("5");
  });

  it("count null: deleted=0", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "city_business_model_overrides") {
        const c: Record<string, unknown> = {};
        c.delete = vi.fn(() => c);
        c.eq = vi.fn(() => c);
        c.then = (resolve: (r: unknown) => void) => resolve({ error: null, count: null });
        return c;
      }
      return insertChain({ data: null });
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useClearAllCityBusinessModelOverrides(), { wrapper });
    await act(async () => {
      const r = await result.current.mutateAsync({
        brandId: "b1",
        branchId: "br1",
      });
      expect(r).toBe(0);
    });
    expect(mockToastSuccess.mock.calls[0][0]).toContain("0");
  });
});
