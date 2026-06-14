/**
 * storeService — data access pra parceiros (fetch/fetchById/updateApproval).
 * Bug aqui = filtro brand_id ignorado vaza stores de outro tenant,
 * search escape errado, approval status sem validação ainda chega ao DB.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { fetchStores, fetchStoreById, updateStoreApproval } from "../services/storeService";

beforeEach(() => {
  mockFrom.mockReset();
});

// ────────────────────────────────────────────────────────
// fetchStores
// ────────────────────────────────────────────────────────
describe("fetchStores", () => {
  function makeChain(opts: { data?: unknown[]; count?: number; error?: unknown } = {}) {
    const eqCalls: Array<[string, unknown]> = [];
    let orFilter = "";
    let rangeArgs: number[] = [];
    const chain: Record<string, unknown> = {
      select: vi.fn(() => chain),
      order: vi.fn(() => chain),
      eq: vi.fn((col: string, val: unknown) => {
        eqCalls.push([col, val]);
        return chain;
      }),
      or: vi.fn((f: string) => {
        orFilter = f;
        return chain;
      }),
      range: vi.fn((from: number, to: number) => {
        rangeArgs = [from, to];
        return Promise.resolve({
          data: opts.data ?? [],
          count: opts.count ?? 0,
          error: opts.error ?? null,
        });
      }),
      _eqCalls: eqCalls,
      _orFilter: () => orFilter,
      _rangeArgs: () => rangeArgs,
    };
    return chain;
  }

  it("sem filtros: select + order + range default (page 0, 50)", async () => {
    const chain = makeChain({ data: [], count: 0 });
    mockFrom.mockReturnValue(chain);
    const result = await fetchStores({});
    expect(result).toEqual({ stores: [], total: 0 });
    expect((chain as never as { _rangeArgs: () => number[] })._rangeArgs()).toEqual([0, 49]);
  });

  it("brandId filtro: aplica .eq('brand_id', X)", async () => {
    const chain = makeChain();
    mockFrom.mockReturnValue(chain);
    await fetchStores({ brandId: "b1" });
    expect((chain as never as { _eqCalls: Array<[string, unknown]> })._eqCalls)
      .toContainEqual(["brand_id", "b1"]);
  });

  it("branchId + isActive: aplica os 2 filtros", async () => {
    const chain = makeChain();
    mockFrom.mockReturnValue(chain);
    await fetchStores({ branchId: "br1", isActive: true });
    const eqs = (chain as never as { _eqCalls: Array<[string, unknown]> })._eqCalls;
    expect(eqs).toContainEqual(["branch_id", "br1"]);
    expect(eqs).toContainEqual(["is_active", true]);
  });

  it("isActive=false: filtra explicitamente por inativos", async () => {
    const chain = makeChain();
    mockFrom.mockReturnValue(chain);
    await fetchStores({ isActive: false });
    expect((chain as never as { _eqCalls: Array<[string, unknown]> })._eqCalls)
      .toContainEqual(["is_active", false]);
  });

  it("search: .or em name + segment", async () => {
    const chain = makeChain();
    mockFrom.mockReturnValue(chain);
    await fetchStores({ search: "pizza" });
    const orFilter = (chain as never as { _orFilter: () => string })._orFilter();
    expect(orFilter).toContain("name.ilike.%pizza%");
    expect(orFilter).toContain("segment.ilike.%pizza%");
  });

  it("paginação: page=2, pageSize=20 → range(40, 59)", async () => {
    const chain = makeChain();
    mockFrom.mockReturnValue(chain);
    await fetchStores({ page: 2, pageSize: 20 });
    expect((chain as never as { _rangeArgs: () => number[] })._rangeArgs()).toEqual([40, 59]);
  });

  it("error: throw", async () => {
    const chain = makeChain({ error: { message: "fail" } });
    mockFrom.mockReturnValue(chain);
    await expect(fetchStores({})).rejects.toEqual({ message: "fail" });
  });
});

// ────────────────────────────────────────────────────────
// fetchStoreById
// ────────────────────────────────────────────────────────
describe("fetchStoreById", () => {
  it("found: retorna o store", async () => {
    const store = { id: "s1", name: "Padaria" };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: store, error: null }),
    });
    const result = await fetchStoreById("s1");
    expect(result).toEqual(store);
  });

  it("not found: retorna null (não throw)", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    expect(await fetchStoreById("ghost")).toBeNull();
  });

  it("error: throw (consumer trata)", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: "fail" } }),
    });
    await expect(fetchStoreById("s1")).rejects.toEqual({ message: "fail" });
  });
});

// ────────────────────────────────────────────────────────
// updateStoreApproval
// ────────────────────────────────────────────────────────
describe("updateStoreApproval", () => {
  it("APPROVED: update approval_status=APPROVED + eq id", async () => {
    let receivedPatch: Record<string, unknown> | null = null;
    let receivedEq: Array<unknown> | null = null;
    mockFrom.mockReturnValue({
      update: vi.fn((patch: Record<string, unknown>) => {
        receivedPatch = patch;
        return {
          eq: vi.fn((col: string, val: unknown) => {
            receivedEq = [col, val];
            return Promise.resolve({ error: null });
          }),
        };
      }),
    });
    await updateStoreApproval("s1", "APPROVED");
    expect(receivedPatch).toEqual({ approval_status: "APPROVED" });
    expect(receivedEq).toEqual(["id", "s1"]);
  });

  it("REJECTED: update approval_status=REJECTED", async () => {
    let receivedPatch: Record<string, unknown> | null = null;
    mockFrom.mockReturnValue({
      update: vi.fn((patch: Record<string, unknown>) => {
        receivedPatch = patch;
        return { eq: vi.fn().mockResolvedValue({ error: null }) };
      }),
    });
    await updateStoreApproval("s1", "REJECTED");
    expect(receivedPatch).toEqual({ approval_status: "REJECTED" });
  });

  it("error: throw", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "fail" } }),
      }),
    });
    await expect(updateStoreApproval("s1", "APPROVED")).rejects.toEqual({ message: "fail" });
  });
});
