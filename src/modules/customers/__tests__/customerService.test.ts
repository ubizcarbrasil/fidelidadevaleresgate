/**
 * customerService — data access pra customers (list/create/update/findOrCreate).
 * Bug aqui = update sem WHERE brand_id permite edição cross-tenant (RLS é
 * defense-in-depth), search escape errado vira SQL injection, findOrCreate
 * cria duplicata sem reusar entre branches.
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

import {
  listCustomers,
  createCustomer,
  updateCustomer,
  findOrCreateCustomer,
} from "../services/customerService";

beforeEach(() => {
  mockFrom.mockReset();
});

// ────────────────────────────────────────────────────────
// listCustomers
// ────────────────────────────────────────────────────────
describe("listCustomers", () => {
  it("sem search: lista paginada (1ª página)", async () => {
    const items = [{ id: "c1", name: "Maria" }, { id: "c2", name: "João" }];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: items, count: 2, error: null }),
    });
    const result = await listCustomers();
    expect(result.items).toEqual(items);
    expect(result.total).toBe(2);
  });

  it("com search: aplica .or em name + phone", async () => {
    let receivedOr = "";
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or: vi.fn((filter: string) => {
        receivedOr = filter;
        return {
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
        };
      }),
    });
    await listCustomers({ search: "maria" });
    expect(receivedOr).toContain("name.ilike.%maria%");
    expect(receivedOr).toContain("phone.ilike.%maria%");
  });

  it("paginação: page=3, pageSize=10 → range(20, 29)", async () => {
    let receivedRange: number[] = [];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn((from: number, to: number) => {
        receivedRange = [from, to];
        return Promise.resolve({ data: [], count: 0, error: null });
      }),
    });
    await listCustomers({ page: 3, pageSize: 10 });
    expect(receivedRange).toEqual([20, 29]);
  });

  it("error: throw (consumer trata)", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: null, count: 0, error: { message: "fail" } }),
    });
    await expect(listCustomers()).rejects.toEqual({ message: "fail" });
  });
});

// ────────────────────────────────────────────────────────
// createCustomer
// ────────────────────────────────────────────────────────
describe("createCustomer", () => {
  it("happy path: insert com phone preservado", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: insertSpy });
    await createCustomer({
      name: "Ana",
      phone: "11999",
      brand_id: "b1",
      branch_id: "br1",
    } as never);
    expect(insertSpy).toHaveBeenCalledWith({
      name: "Ana",
      phone: "11999",
      brand_id: "b1",
      branch_id: "br1",
    });
  });

  it("phone vazio: vira null no DB (não string vazia)", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: insertSpy });
    await createCustomer({ name: "X", phone: "", brand_id: "b1", branch_id: "br1" } as never);
    expect(insertSpy.mock.calls[0][0].phone).toBeNull();
  });

  it("error: throw", async () => {
    mockFrom.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: { message: "dup" } }) });
    await expect(createCustomer({ name: "X", phone: null, brand_id: "b1", branch_id: "br1" } as never))
      .rejects.toEqual({ message: "dup" });
  });
});

// ────────────────────────────────────────────────────────
// updateCustomer
// ────────────────────────────────────────────────────────
describe("updateCustomer", () => {
  it("força brand_id no WHERE (defense-in-depth contra RLS bypass)", async () => {
    const eqCalls: Array<[string, string]> = [];
    const eqMock = vi.fn((col: string, val: string) => {
      eqCalls.push([col, val]);
      return { eq: eqMock, then: undefined };
    });
    // Last call must resolve
    const finalEq = vi.fn((col: string, val: string) => {
      eqCalls.push([col, val]);
      return Promise.resolve({ error: null });
    });
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: (col: string, val: string) => {
          eqCalls.push([col, val]);
          return { eq: finalEq };
        },
      }),
    });
    await updateCustomer("c1", { name: "X", phone: null, brand_id: "b1", branch_id: "br1" } as never);
    // Verifica que WHERE incluiu tanto id quanto brand_id
    expect(eqCalls).toContainEqual(["id", "c1"]);
    expect(eqCalls).toContainEqual(["brand_id", "b1"]);
  });

  it("error: throw", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "fail" } }),
        }),
      }),
    });
    await expect(updateCustomer("c1", { name: "X", phone: null, brand_id: "b1", branch_id: "br1" } as never))
      .rejects.toEqual({ message: "fail" });
  });
});

// ────────────────────────────────────────────────────────
// findOrCreateCustomer
// ────────────────────────────────────────────────────────
describe("findOrCreateCustomer", () => {
  function makeFromChain(handlers: {
    inBranch?: unknown;
    inBrand?: unknown;
    moved?: unknown;
    created?: unknown;
    createError?: unknown;
  }) {
    let calls = 0;
    return () => {
      calls++;
      if (calls === 1) {
        // Lookup na branch atual
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: handlers.inBranch ?? null }),
          update: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
        };
      }
      if (calls === 2) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: handlers.inBrand ?? null }),
        };
      }
      if (calls === 3) {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: handlers.moved ?? null }),
          insert: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: handlers.created ?? null, error: handlers.createError ?? null }),
        };
      }
      return {} as never;
    };
  }

  it("já existe na branch atual: retorna sem update/insert", async () => {
    const existing = { id: "c1", branch_id: "br1" };
    mockFrom.mockImplementation(makeFromChain({ inBranch: existing }));
    const result = await findOrCreateCustomer("u1", "b1", "br1", "Maria", null);
    expect(result).toEqual(existing);
  });

  it("existe em outra branch: move pra branch atual via UPDATE", async () => {
    const inOther = { id: "c1", branch_id: "br-other" };
    const moved = { id: "c1", branch_id: "br1" };
    mockFrom.mockImplementation(makeFromChain({ inBrand: inOther, moved }));
    const result = await findOrCreateCustomer("u1", "b1", "br1", "X", null);
    expect(result).toEqual(moved);
  });

  it("não existe: auto-create", async () => {
    const created = { id: "c-new", name: "Ana", brand_id: "b1", branch_id: "br1" };
    mockFrom.mockImplementation(makeFromChain({ created }));
    const result = await findOrCreateCustomer("u1", "b1", "br1", "Ana", "11999");
    expect(result).toEqual(created);
  });

  it("auto-create falha: retorna null (não throw — fluxo silencioso)", async () => {
    mockFrom.mockImplementation(makeFromChain({ createError: { message: "dup" } }));
    const result = await findOrCreateCustomer("u1", "b1", "br1", "X", null);
    expect(result).toBeNull();
  });
});
