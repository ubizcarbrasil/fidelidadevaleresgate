/**
 * hook_brand_business_models — CRUD do empreendedor sobre seus
 * Modelos de Negócio. Bug aqui = modelo ativado/desativado não
 * reflete, ou margem GG salva no row errado (cobrança quebrada).
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
  useBrandBusinessModels,
  useToggleBrandBusinessModel,
  useUpdateGanhaGanhaMargin,
} from "../hook_brand_business_models";

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

// ── useBrandBusinessModels ───────────────────────────────
describe("useBrandBusinessModels", () => {
  it("brandId null: query disabled", () => {
    const { result } = renderHook(() => useBrandBusinessModels(null), wrap());
    expect(result.current.isFetching).toBe(false);
  });

  it("retorna lista de vínculos por brand", async () => {
    mockFrom.mockReturnValue(selectChain({
      data: [
        { id: "1", brand_id: "b1", business_model_id: "m1", is_enabled: true },
      ],
      error: null,
    }));
    const { result } = renderHook(() => useBrandBusinessModels("b1"), wrap());
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toHaveLength(1);
  });

  it("erro: marca isError", async () => {
    mockFrom.mockReturnValue(selectChain({ data: null, error: new Error("RLS") }));
    const { result } = renderHook(() => useBrandBusinessModels("b1"), wrap());
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ── useToggleBrandBusinessModel ──────────────────────────
describe("useToggleBrandBusinessModel — com existingRowId (UPDATE)", () => {
  it("UPDATE row existente + audit 'model_activated' + invalidate", async () => {
    let updatePayload: Record<string, unknown> | null = null;
    let auditPayload: Record<string, unknown> | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_business_models") {
        const c = updateChain({ data: null, error: null });
        c.update = vi.fn((p: Record<string, unknown>) => {
          updatePayload = p;
          return c;
        });
        return c;
      }
      const c = insertChain({ data: null, error: null });
      c.insert = vi.fn((p: Record<string, unknown>) => {
        auditPayload = p;
        return c;
      });
      return c;
    });

    const { wrapper, qc } = wrap();
    const invSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useToggleBrandBusinessModel(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        brandId: "b1",
        businessModelId: "m1",
        modelKey: "campeonato",
        enabled: true,
        existingRowId: "row-99",
      });
    });

    expect(updatePayload).toMatchObject({ is_enabled: true });
    expect(updatePayload?.activated_at).toBeTypeOf("string");
    expect(auditPayload).toMatchObject({
      action: "model_activated",
      changes_json: expect.objectContaining({
        brand_id: "b1",
        model_key: "campeonato",
        from: false,
        to: true,
      }),
    });
    expect(invSpy).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalledWith("Modelo ativado");
  });

  it("enabled=false com existingRowId: activated_at=null + audit 'model_deactivated'", async () => {
    let updatePayload: Record<string, unknown> | null = null;
    let auditPayload: Record<string, unknown> | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_business_models") {
        const c = updateChain({ data: null });
        c.update = vi.fn((p: Record<string, unknown>) => {
          updatePayload = p;
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
    const { result } = renderHook(() => useToggleBrandBusinessModel(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        brandId: "b1",
        businessModelId: "m1",
        modelKey: "x",
        enabled: false,
        existingRowId: "row-1",
      });
    });

    expect(updatePayload?.is_enabled).toBe(false);
    expect(updatePayload?.activated_at).toBeNull();
    expect(auditPayload?.action).toBe("model_deactivated");
    expect(mockToastSuccess).toHaveBeenCalledWith("Modelo desativado");
  });
});

describe("useToggleBrandBusinessModel — sem existingRowId (INSERT)", () => {
  it("INSERT nova row + returning id + audit", async () => {
    let insertPayload: Record<string, unknown> | null = null;
    let auditEntityId: string | null | undefined = undefined;

    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_business_models") {
        const c = insertChain({ data: { id: "new-row-uuid" }, error: null });
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
    const { result } = renderHook(() => useToggleBrandBusinessModel(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        brandId: "b1",
        businessModelId: "m1",
        modelKey: "x",
        enabled: true,
      });
    });

    expect(insertPayload).toMatchObject({
      brand_id: "b1",
      business_model_id: "m1",
      is_enabled: true,
    });
    expect(insertPayload?.activated_at).toBeTypeOf("string");
    expect(auditEntityId).toBe("new-row-uuid");
  });
});

describe("useToggleBrandBusinessModel — erros", () => {
  it("update erro: toast + propaga", async () => {
    mockFrom.mockReturnValue(updateChain({
      data: null,
      error: new Error("rls denied"),
    }));
    const { wrapper } = wrap();
    const { result } = renderHook(() => useToggleBrandBusinessModel(), { wrapper });
    await expect(
      result.current.mutateAsync({
        brandId: "b1",
        businessModelId: "m1",
        modelKey: "x",
        enabled: true,
        existingRowId: "r1",
      }),
    ).rejects.toThrow("rls denied");
    expect(mockToastError).toHaveBeenCalled();
  });
});

// ── useUpdateGanhaGanhaMargin ────────────────────────────
describe("useUpdateGanhaGanhaMargin", () => {
  it("com existingRowId: UPDATE só margem + audit com from/to", async () => {
    let updatePayload: Record<string, unknown> | null = null;
    let auditChanges: Record<string, unknown> | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_business_models") {
        const c = updateChain({ data: null });
        c.update = vi.fn((p: Record<string, unknown>) => {
          updatePayload = p;
          return c;
        });
        return c;
      }
      const c = insertChain({ data: null });
      c.insert = vi.fn((p: Record<string, unknown>) => {
        auditChanges = (p as { changes_json: Record<string, unknown> }).changes_json;
        return c;
      });
      return c;
    });

    const { wrapper, qc } = wrap();
    const invSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useUpdateGanhaGanhaMargin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        brandId: "b1",
        businessModelId: "m1",
        marginPct: 12.5,
        previousMarginPct: 10,
        existingRowId: "r1",
      });
    });

    expect(updatePayload).toEqual({ ganha_ganha_margin_pct: 12.5 });
    expect(auditChanges).toMatchObject({
      brand_id: "b1",
      from: 10,
      to: 12.5,
    });
    expect(invSpy).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalledWith("Margem atualizada");
  });

  it("sem existingRowId: INSERT com is_enabled=true + activated_at", async () => {
    let insertPayload: Record<string, unknown> | null = null;
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_business_models") {
        const c = insertChain({ data: { id: "r-new" }, error: null });
        c.insert = vi.fn((p: Record<string, unknown>) => {
          insertPayload = p;
          return c;
        });
        return c;
      }
      return insertChain({ data: null });
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useUpdateGanhaGanhaMargin(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        brandId: "b1",
        businessModelId: "m1",
        marginPct: 15,
        previousMarginPct: null,
      });
    });

    expect(insertPayload).toMatchObject({
      brand_id: "b1",
      business_model_id: "m1",
      is_enabled: true,
      ganha_ganha_margin_pct: 15,
    });
    expect(insertPayload?.activated_at).toBeTypeOf("string");
  });

  it("erro: toast + propaga", async () => {
    mockFrom.mockReturnValue(updateChain({
      data: null,
      error: new Error("bad margin"),
    }));
    const { wrapper } = wrap();
    const { result } = renderHook(() => useUpdateGanhaGanhaMargin(), { wrapper });
    await expect(
      result.current.mutateAsync({
        brandId: "b1",
        businessModelId: "m1",
        marginPct: 5,
        previousMarginPct: 10,
        existingRowId: "r1",
      }),
    ).rejects.toThrow("bad margin");
    expect(mockToastError).toHaveBeenCalled();
  });
});
