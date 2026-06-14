/**
 * useAutoSeedDemo — auto-seed de demo stores no primeiro acesso do
 * customer se brand não tem taxonomy linked. Bug aqui = seed dispara
 * sempre (waste), ou não dispara nunca (UX vazia em demo), ou flag
 * não persiste (re-seed em todo boot).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const { mockFrom, mockGetSession, mockInvoke } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetSession: vi.fn(),
  mockInvoke: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    auth: { getSession: mockGetSession },
    functions: { invoke: mockInvoke },
  },
}));

const mockBrand: { brand: { brand_settings_json?: Record<string, unknown> } | null } = {
  brand: null,
};
vi.mock("@/contexts/BrandContext", () => ({
  useBrand: () => mockBrand,
}));

import { useAutoSeedDemo } from "../useAutoSeedDemo";

function chain(result: { data?: unknown; count?: number; error?: unknown }) {
  const c: Record<string, unknown> = {};
  ["select", "eq", "not", "update"].forEach((op) => { c[op] = vi.fn(() => c); });
  c.single = vi.fn(() => Promise.resolve(result));
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

beforeEach(() => {
  mockFrom.mockReset();
  mockGetSession.mockReset().mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
  mockInvoke.mockReset().mockResolvedValue({ data: null, error: null });
  mockBrand.brand = null;
});

describe("useAutoSeedDemo — guards", () => {
  it("brandId undefined: no-op", () => {
    renderHook(() => useAutoSeedDemo(undefined, "br1"));
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it("branchId undefined: no-op", () => {
    renderHook(() => useAutoSeedDemo("b1", undefined));
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("auto_seed_done já true no contexto: skip sem requests", () => {
    mockBrand.brand = {
      brand_settings_json: { auto_seed_done: true },
    };
    renderHook(() => useAutoSeedDemo("b1", "br1"));
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockGetSession).not.toHaveBeenCalled();
  });
});

describe("useAutoSeedDemo — fluxo completo", () => {
  it("sem sessão: aborta antes de consultar brands", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    renderHook(() => useAutoSeedDemo("b1", "br1"));
    await waitFor(() => expect(mockGetSession).toHaveBeenCalled());
    // brands.select NÃO chamado
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("auto_seed_done=true no DB: skip", async () => {
    mockFrom.mockReturnValue(chain({
      data: { brand_settings_json: { auto_seed_done: true } },
    }));
    renderHook(() => useAutoSeedDemo("b1", "br1"));
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());
    // Não invoca edge function
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("totalStores=0: skip (nada pra taxonomizar)", async () => {
    let callIdx = 0;
    mockFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) {
        // brands select: settings sem flag
        return chain({ data: { brand_settings_json: {} } });
      }
      // stores count: 0
      return chain({ count: 0 });
    });
    renderHook(() => useAutoSeedDemo("b1", "br1"));
    await waitFor(() => expect(callIdx).toBeGreaterThanOrEqual(2));
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("withTaxonomy > 50%: marca como done SEM invocar seed", async () => {
    let callIdx = 0;
    let updateMarked = false;
    mockFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return chain({ data: { brand_settings_json: {} } });
      if (callIdx === 2) return chain({ count: 10 }); // totalStores
      if (callIdx === 3) return chain({ count: 7 }); // withTaxonomy > 50%
      // brands update
      const c = chain({ error: null });
      c.update = vi.fn(() => { updateMarked = true; return c; });
      return c;
    });
    renderHook(() => useAutoSeedDemo("b1", "br1"));
    await waitFor(() => expect(updateMarked).toBe(true));
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("withTaxonomy <= 50%: invoca seed-demo-stores + marca done", async () => {
    let callIdx = 0;
    let updateCount = 0;
    mockFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return chain({ data: { brand_settings_json: {} } });
      if (callIdx === 2) return chain({ count: 10 });
      if (callIdx === 3) return chain({ count: 3 }); // < 50%
      // brands update após seed
      const c = chain({ error: null });
      c.update = vi.fn(() => { updateCount++; return c; });
      return c;
    });

    renderHook(() => useAutoSeedDemo("b1", "br1"));
    await waitFor(() => expect(mockInvoke).toHaveBeenCalled());

    expect(mockInvoke).toHaveBeenCalledWith("seed-demo-stores", {
      body: { brand_id: "b1", branch_id: "br1" },
    });
    expect(updateCount).toBe(1);
  });

  it("seed-demo-stores lança: NÃO marca done (retry no próximo visit)", async () => {
    let callIdx = 0;
    let updateCount = 0;
    mockFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return chain({ data: { brand_settings_json: {} } });
      if (callIdx === 2) return chain({ count: 10 });
      if (callIdx === 3) return chain({ count: 3 });
      const c = chain({ error: null });
      c.update = vi.fn(() => { updateCount++; return c; });
      return c;
    });
    mockInvoke.mockRejectedValue(new Error("seed failed"));

    renderHook(() => useAutoSeedDemo("b1", "br1"));
    await waitFor(() => expect(mockInvoke).toHaveBeenCalled());
    // Pequeno yield extra
    await new Promise((r) => setTimeout(r, 30));

    expect(updateCount).toBe(0); // não persistiu done
  });
});
