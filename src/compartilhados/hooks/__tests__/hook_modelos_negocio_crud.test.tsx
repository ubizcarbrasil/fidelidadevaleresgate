/**
 * hook_modelos_negocio_crud — CRUD do catálogo de business_models +
 * vínculos N-N com módulos técnicos. Bug aqui = modelo criado sem
 * audience válido (orphan), vínculo módulo-modelo perdido (UI sem
 * badges), ou ordenação errada (UX confusa).
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
  useBusinessModelsCatalog,
  useCreateBusinessModel,
  useUpdateBusinessModel,
  useToggleBusinessModelActive,
  useBusinessModelModules,
  useSetBusinessModelModule,
  useModulesGroupedByModel,
} from "../hook_modelos_negocio_crud";

function selectChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  ["select", "eq", "order"].forEach((op) => { c[op] = vi.fn(() => c); });
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function insertChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.insert = vi.fn(() => c);
  c.select = vi.fn(() => c);
  c.single = vi.fn(() => Promise.resolve(result));
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function updateChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.update = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.select = vi.fn(() => c);
  c.single = vi.fn(() => Promise.resolve(result));
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function deleteChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.delete = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function upsertChain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.upsert = vi.fn(() => c);
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

// ── useBusinessModelsCatalog ─────────────────────────────
describe("useBusinessModelsCatalog", () => {
  it("ordena por audience asc + sort_order asc", async () => {
    const c = selectChain({ data: [], error: null });
    mockFrom.mockReturnValue(c);
    renderHook(() => useBusinessModelsCatalog(), wrap());
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());
    expect(c.order).toHaveBeenCalledWith("audience", { ascending: true });
    expect(c.order).toHaveBeenCalledWith("sort_order", { ascending: true });
  });

  it("retorna data como array", async () => {
    mockFrom.mockReturnValue(selectChain({
      data: [{ id: "m1", key: "k", name: "Test" }],
      error: null,
    }));
    const { result } = renderHook(() => useBusinessModelsCatalog(), wrap());
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });
});

// ── useCreateBusinessModel ───────────────────────────────
describe("useCreateBusinessModel", () => {
  it("INSERT com defaults nulos + audit 'created' + invalidate", async () => {
    let insertPayload: Record<string, unknown> | null = null;
    let auditAction: string | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "business_models") {
        const c = insertChain({ data: { id: "new-uuid", key: "k1" }, error: null });
        c.insert = vi.fn((p: Record<string, unknown>) => {
          insertPayload = p;
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
    const { result } = renderHook(() => useCreateBusinessModel(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        key: "loyalty",
        name: "Fidelidade",
        audience: "cliente",
        pricing_model: "included",
      });
    });

    expect(insertPayload).toMatchObject({
      key: "loyalty",
      name: "Fidelidade",
      audience: "cliente",
      pricing_model: "included",
      description: null,
      icon: null,
      color: null,
      sort_order: 0, // default
    });
    expect(auditAction).toBe("created");
    expect(invSpy.mock.calls.length).toBeGreaterThanOrEqual(4); // catalog + 3 predicates
    expect(mockToastSuccess).toHaveBeenCalledWith("Modelo criado");
  });

  it("erro: toast.error + propaga", async () => {
    mockFrom.mockReturnValue(insertChain({
      data: null,
      error: new Error("UNIQUE violation"),
    }));
    const { wrapper } = wrap();
    const { result } = renderHook(() => useCreateBusinessModel(), { wrapper });
    await expect(
      result.current.mutateAsync({
        key: "dup",
        name: "X",
        audience: "cliente",
        pricing_model: "included",
      }),
    ).rejects.toThrow("UNIQUE violation");
    expect(mockToastError).toHaveBeenCalled();
  });
});

// ── useUpdateBusinessModel ───────────────────────────────
describe("useUpdateBusinessModel", () => {
  it("UPDATE com input + eq(id) + audit 'updated'", async () => {
    let updatePayload: Record<string, unknown> | null = null;
    let auditAction: string | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "business_models") {
        const c = updateChain({ data: { id: "m1" }, error: null });
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

    const { wrapper } = wrap();
    const { result } = renderHook(() => useUpdateBusinessModel(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "m1",
        input: { name: "Novo Nome", sort_order: 5 },
      });
    });

    expect(updatePayload).toEqual({ name: "Novo Nome", sort_order: 5 });
    expect(auditAction).toBe("updated");
    expect(mockToastSuccess).toHaveBeenCalledWith("Modelo atualizado");
  });
});

// ── useToggleBusinessModelActive ─────────────────────────
describe("useToggleBusinessModelActive", () => {
  it("UPDATE is_active + audit 'toggled_active'", async () => {
    let updatePayload: Record<string, unknown> | null = null;
    let auditChanges: Record<string, unknown> | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "business_models") {
        const c = updateChain({ data: null, error: null });
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

    const { wrapper } = wrap();
    const { result } = renderHook(() => useToggleBusinessModelActive(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: "m1", is_active: false });
    });

    expect(updatePayload).toEqual({ is_active: false });
    expect(auditChanges).toEqual({ is_active: false });
  });
});

// ── useBusinessModelModules ──────────────────────────────
describe("useBusinessModelModules", () => {
  it("modelId null: query disabled", () => {
    const { result } = renderHook(() => useBusinessModelModules(null), wrap());
    expect(result.current.isFetching).toBe(false);
  });

  it("filtra por business_model_id", async () => {
    mockFrom.mockReturnValue(selectChain({
      data: [{ business_model_id: "m1", module_definition_id: "md1", is_required: true }],
      error: null,
    }));
    const { result } = renderHook(() => useBusinessModelModules("m1"), wrap());
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });
});

// ── useSetBusinessModelModule ────────────────────────────
describe("useSetBusinessModelModule", () => {
  it("linked=true: UPSERT com onConflict + audit 'module_linked'", async () => {
    let upsertPayload: unknown = null;
    let upsertOpts: unknown = null;
    let auditAction: string | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "business_model_modules") {
        const c = upsertChain({ data: null, error: null });
        c.upsert = vi.fn((row: unknown, opts: unknown) => {
          upsertPayload = row;
          upsertOpts = opts;
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

    const { wrapper } = wrap();
    const { result } = renderHook(() => useSetBusinessModelModule(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        business_model_id: "m1",
        module_definition_id: "md1",
        linked: true,
        is_required: true,
      });
    });

    expect(upsertPayload).toMatchObject({
      business_model_id: "m1",
      module_definition_id: "md1",
      is_required: true,
    });
    expect(upsertOpts).toMatchObject({
      onConflict: "business_model_id,module_definition_id",
    });
    expect(auditAction).toBe("module_linked");
  });

  it("linked=false: DELETE eq(both) + audit 'module_unlinked'", async () => {
    let auditAction: string | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === "business_model_modules") return deleteChain({ data: null, error: null });
      const c = insertChain({ data: null });
      c.insert = vi.fn((p: Record<string, unknown>) => {
        auditAction = p.action as string;
        return c;
      });
      return c;
    });

    const { wrapper } = wrap();
    const { result } = renderHook(() => useSetBusinessModelModule(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        business_model_id: "m1",
        module_definition_id: "md1",
        linked: false,
        is_required: false,
      });
    });

    expect(auditAction).toBe("module_unlinked");
  });
});

// ── useModulesGroupedByModel ─────────────────────────────
describe("useModulesGroupedByModel", () => {
  it("agrupa links por module_id com info do modelo", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "business_model_modules") {
        return selectChain({
          data: [
            { business_model_id: "m1", module_definition_id: "md-A", is_required: true },
            { business_model_id: "m2", module_definition_id: "md-A", is_required: false },
            { business_model_id: "m1", module_definition_id: "md-B", is_required: false },
          ],
          error: null,
        });
      }
      // business_models
      return selectChain({
        data: [
          { id: "m1", key: "loyalty", name: "Fidelidade", color: "#fff" },
          { id: "m2", key: "campeonato", name: "Campeonato", color: "#000" },
        ],
        error: null,
      });
    });

    const { result } = renderHook(() => useModulesGroupedByModel(), wrap());
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(Object.keys(result.current.data!)).toEqual(["md-A", "md-B"]);
    expect(result.current.data!["md-A"]).toHaveLength(2);
    expect(result.current.data!["md-B"]).toHaveLength(1);
  });

  it("ordena cada grupo: required=true primeiro, depois alfabética pt-BR", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "business_model_modules") {
        return selectChain({
          data: [
            { business_model_id: "m1", module_definition_id: "md-X", is_required: false },
            { business_model_id: "m2", module_definition_id: "md-X", is_required: true },
            { business_model_id: "m3", module_definition_id: "md-X", is_required: false },
          ],
          error: null,
        });
      }
      return selectChain({
        data: [
          { id: "m1", key: "k1", name: "Beta", color: null },
          { id: "m2", key: "k2", name: "Gamma", color: null },
          { id: "m3", key: "k3", name: "Alfa", color: null },
        ],
        error: null,
      });
    });

    const { result } = renderHook(() => useModulesGroupedByModel(), wrap());
    await waitFor(() => expect(result.current.data).toBeDefined());

    const links = result.current.data!["md-X"];
    expect(links[0].is_required).toBe(true); // Gamma required vem primeiro
    expect(links[0].model_name).toBe("Gamma");
    expect(links[1].model_name).toBe("Alfa"); // depois alfa-beta
    expect(links[2].model_name).toBe("Beta");
  });

  it("modelo inativo: link pulado (não aparece no resultado)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "business_model_modules") {
        return selectChain({
          data: [
            { business_model_id: "active-m", module_definition_id: "md1", is_required: true },
            { business_model_id: "inactive-m", module_definition_id: "md1", is_required: true },
          ],
          error: null,
        });
      }
      // só active-m vem do query is_active=true
      return selectChain({
        data: [{ id: "active-m", key: "k", name: "Active", color: null }],
        error: null,
      });
    });

    const { result } = renderHook(() => useModulesGroupedByModel(), wrap());
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!["md1"]).toHaveLength(1); // só active-m
    expect(result.current.data!["md1"][0].model_id).toBe("active-m");
  });
});
