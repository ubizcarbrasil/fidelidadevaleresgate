/**
 * mirrorSync — API de sync de mirror sources (DVLinks, Divulgador Inteligente).
 *
 * Bug aqui:
 *   - Conector criado sem brand_id (orphan record)
 *   - Delete sem archiveDeals deixa deals fantasma (origin sem connector)
 *   - upsert duplica em vez de update (config repetido)
 *   - duplicateDealToCategory leva campos imutáveis (id/created_at)
 *     pro insert e gera conflict
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockInvoke } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockInvoke: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom, functions: { invoke: mockInvoke } },
}));

import {
  fetchSourceCatalog,
  updateSourceCatalogEntry,
  triggerMirrorSync,
  runMirrorDiagnose,
  fetchSyncLogs,
  fetchSyncConfig,
  fetchAllSyncConfigs,
  fetchConnectorById,
  createConnector,
  updateConnector,
  deleteConnector,
  upsertSyncConfig,
  fetchMirroredDeals,
  updateDealField,
  batchUpdateDeals,
  fetchCategories,
  duplicateDealToCategory,
} from "../mirrorSync";

beforeEach(() => {
  mockFrom.mockReset();
  mockInvoke.mockReset();
});

/** Chain builder genérico — terminal via await direto OU .maybeSingle/.single */
function chain(terminal: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  const obj: Record<string, unknown> = {};
  const ops = ["select", "insert", "update", "delete", "eq", "in", "ilike", "order", "limit"];
  ops.forEach((op) => { obj[op] = vi.fn(() => obj); });
  obj.maybeSingle = vi.fn(() => Promise.resolve(terminal));
  obj.single = vi.fn(() => Promise.resolve(terminal));
  obj.then = (resolve: (r: unknown) => void) => resolve(terminal);
  return obj;
}

// ── Source Catalog ───────────────────────────────────────
describe("fetchSourceCatalog", () => {
  it("retorna data ou array vazio", async () => {
    mockFrom.mockReturnValue(chain({ data: [{ id: "s1" }, { id: "s2" }] }));
    const r = await fetchSourceCatalog();
    expect(r).toHaveLength(2);
  });

  it("onlyEnabled=true: adiciona eq is_enabled", async () => {
    const c = chain({ data: [] });
    mockFrom.mockReturnValue(c);
    await fetchSourceCatalog({ onlyEnabled: true });
    expect(c.eq).toHaveBeenCalledWith("is_enabled", true);
  });

  it("erro propagado", async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: new Error("x") }));
    await expect(fetchSourceCatalog()).rejects.toThrow("x");
  });
});

describe("updateSourceCatalogEntry", () => {
  it("update com patch + updated_at, eq id", async () => {
    const c = chain({ data: null, error: null });
    mockFrom.mockReturnValue(c);
    await updateSourceCatalogEntry("s1", { display_name: "Novo" });
    expect(c.update).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: "Novo" }),
    );
    expect(c.eq).toHaveBeenCalledWith("id", "s1");
  });
});

// ── Edge function calls ──────────────────────────────────
describe("triggerMirrorSync", () => {
  it("body inclui brand_id + source_type + config_id (opcional)", async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });
    await triggerMirrorSync("b1", "dvlinks", "cfg-1");
    expect(mockInvoke).toHaveBeenCalledWith("mirror-sync", {
      body: { brand_id: "b1", source_type: "dvlinks", config_id: "cfg-1" },
    });
  });

  it("source_type default 'divulgador_inteligente'", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null });
    await triggerMirrorSync("b1");
    expect(mockInvoke.mock.calls[0][1].body.source_type).toBe("divulgador_inteligente");
  });

  it("erro: wrap em Error", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: "down" } });
    await expect(triggerMirrorSync("b1")).rejects.toThrow("down");
  });
});

describe("runMirrorDiagnose", () => {
  it("body inclui mode='diagnose'", async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });
    await runMirrorDiagnose("b1", "dvlinks");
    expect(mockInvoke.mock.calls[0][1].body).toMatchObject({
      brand_id: "b1",
      mode: "diagnose",
      source_type: "dvlinks",
    });
  });

  it("erro: wrap em Error", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: "down" } });
    await expect(runMirrorDiagnose("b1")).rejects.toThrow("down");
  });
});

// ── Sync logs + config ───────────────────────────────────
describe("fetchSyncLogs", () => {
  it("retorna data", async () => {
    mockFrom.mockReturnValue(chain({ data: [{ id: "l1" }] }));
    const r = await fetchSyncLogs("b1");
    expect(r).toEqual([{ id: "l1" }]);
  });

  it("limit default 20, customizável", async () => {
    const c = chain({ data: [] });
    mockFrom.mockReturnValue(c);
    await fetchSyncLogs("b1", 100);
    expect(c.limit).toHaveBeenCalledWith(100);
  });
});

describe("fetchSyncConfig", () => {
  it("filtra brand_id + source_type, maybeSingle", async () => {
    const c = chain({ data: { id: "cfg-1" }, error: null });
    mockFrom.mockReturnValue(c);
    const r = await fetchSyncConfig("b1", "dvlinks");
    expect(r).toEqual({ id: "cfg-1" });
    expect(c.maybeSingle).toHaveBeenCalled();
  });
});

describe("fetchAllSyncConfigs / fetchConnectorById", () => {
  it("fetchAllSyncConfigs ordena por source_type", async () => {
    const c = chain({ data: [{ id: "1" }] });
    mockFrom.mockReturnValue(c);
    const r = await fetchAllSyncConfigs("b1");
    expect(r).toHaveLength(1);
    expect(c.order).toHaveBeenCalledWith("source_type", expect.any(Object));
  });

  it("fetchConnectorById usa maybeSingle", async () => {
    const c = chain({ data: { id: "cfg-1" } });
    mockFrom.mockReturnValue(c);
    await fetchConnectorById("cfg-1");
    expect(c.maybeSingle).toHaveBeenCalled();
  });
});

// ── Connectors CRUD ──────────────────────────────────────
describe("createConnector", () => {
  it("insert com brand_id + source_type + payload, retorna {id}", async () => {
    const c = chain({ data: { id: "new-cfg" }, error: null });
    mockFrom.mockReturnValue(c);
    const r = await createConnector("b1", "dvlinks", { auth_token: "x" });
    expect(c.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        brand_id: "b1",
        source_type: "dvlinks",
        auth_token: "x",
      }),
    );
    expect(r).toEqual({ id: "new-cfg" });
  });

  it("erro propagado", async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: new Error("dup key") }));
    await expect(createConnector("b1", "dvlinks", {})).rejects.toThrow("dup key");
  });
});

describe("updateConnector", () => {
  it("update + eq(id)", async () => {
    const c = chain({ data: null, error: null });
    mockFrom.mockReturnValue(c);
    await updateConnector("cfg-1", { display_name: "Novo" });
    expect(c.update).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: "Novo" }),
    );
    expect(c.eq).toHaveBeenCalledWith("id", "cfg-1");
  });
});

describe("deleteConnector", () => {
  it("sem archiveDeals: só delete do config", async () => {
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      return chain({ data: null, error: null });
    });
    await deleteConnector("cfg-1");
    expect(call).toBe(1);
  });

  it("com archiveDeals + brandId + sourceType: archive deals primeiro, delete depois", async () => {
    let call = 0;
    const tables: string[] = [];
    mockFrom.mockImplementation((table: string) => {
      call++;
      tables.push(table);
      return chain({ data: null, error: null });
    });
    await deleteConnector("cfg-1", {
      archiveDeals: true,
      brandId: "b1",
      sourceType: "dvlinks",
    });
    expect(call).toBe(2);
    expect(tables[0]).toBe("affiliate_deals");
    expect(tables[1]).toBe("mirror_sync_config");
  });

  it("archiveDeals=true mas faltando brandId ou sourceType: NÃO archive", async () => {
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      return chain({ data: null, error: null });
    });
    await deleteConnector("cfg-1", { archiveDeals: true }); // sem brandId/sourceType
    expect(call).toBe(1); // só delete
  });
});

// ── upsertSyncConfig ─────────────────────────────────────
describe("upsertSyncConfig", () => {
  it("config existe: faz UPDATE no id encontrado", async () => {
    let call = 0;
    const tables: string[] = [];
    let updatedPayload: Record<string, unknown> | null = null;
    mockFrom.mockImplementation((table: string) => {
      call++;
      tables.push(table);
      if (call === 1) {
        // select existing
        return chain({ data: { id: "existing-cfg" }, error: null });
      }
      // update
      const c = chain({ data: null, error: null });
      c.update = vi.fn((p: Record<string, unknown>) => {
        updatedPayload = p;
        return c;
      });
      return c;
    });

    await upsertSyncConfig("b1", "dvlinks", { auth_token: "x" });
    expect(call).toBe(2);
    expect(updatedPayload).toMatchObject({ auth_token: "x", source_type: "dvlinks" });
  });

  it("config NÃO existe: faz INSERT com brand_id + source_type", async () => {
    let call = 0;
    let insertedPayload: Record<string, unknown> | null = null;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        return chain({ data: null, error: null }); // nenhum existing
      }
      const c = chain({ data: null, error: null });
      c.insert = vi.fn((p: Record<string, unknown>) => {
        insertedPayload = p;
        return c;
      });
      return c;
    });

    await upsertSyncConfig("b1", "dvlinks", { auth_token: "y" });
    expect(call).toBe(2);
    expect(insertedPayload).toMatchObject({
      brand_id: "b1",
      source_type: "dvlinks",
      auth_token: "y",
    });
  });
});

// ── Mirrored deals ───────────────────────────────────────
describe("fetchMirroredDeals", () => {
  it("filtros default: 2 eq (brand_id + origin)", async () => {
    const c = chain({ data: [] });
    mockFrom.mockReturnValue(c);
    await fetchMirroredDeals("b1");
    expect(c.eq).toHaveBeenCalledTimes(2);
    expect(c.eq).toHaveBeenCalledWith("origin", "divulgador_inteligente");
  });

  it("sourceType custom: usa como origin", async () => {
    const c = chain({ data: [] });
    mockFrom.mockReturnValue(c);
    await fetchMirroredDeals("b1", { sourceType: "dvlinks" });
    expect(c.eq).toHaveBeenCalledWith("origin", "dvlinks");
  });

  it("status='active': eq is_active=true", async () => {
    const c = chain({ data: [] });
    mockFrom.mockReturnValue(c);
    await fetchMirroredDeals("b1", { status: "active" });
    expect(c.eq).toHaveBeenCalledWith("is_active", true);
  });

  it("featured=true + search: 4 eqs + 1 ilike", async () => {
    const c = chain({ data: [] });
    mockFrom.mockReturnValue(c);
    await fetchMirroredDeals("b1", { featured: true, search: "pizza" });
    // base 2 + featured 1 = 3 eqs; search no ilike
    expect(c.eq).toHaveBeenCalledTimes(3);
    expect(c.ilike).toHaveBeenCalledWith("title", "%pizza%");
  });
});

describe("updateDealField / batchUpdateDeals", () => {
  it("updateDealField: eq(id)", async () => {
    const c = chain({ data: null, error: null });
    mockFrom.mockReturnValue(c);
    await updateDealField("d1", { is_featured: true });
    expect(c.update).toHaveBeenCalledWith({ is_featured: true });
    expect(c.eq).toHaveBeenCalledWith("id", "d1");
  });

  it("batchUpdateDeals: in(ids)", async () => {
    const c = chain({ data: null, error: null });
    mockFrom.mockReturnValue(c);
    await batchUpdateDeals(["a", "b"], { visible_driver: false });
    expect(c.in).toHaveBeenCalledWith("id", ["a", "b"]);
  });
});

describe("fetchCategories", () => {
  it("retorna data ordered por order_index", async () => {
    const c = chain({ data: [{ id: "c1" }] });
    mockFrom.mockReturnValue(c);
    const r = await fetchCategories("b1");
    expect(r).toEqual([{ id: "c1" }]);
    expect(c.order).toHaveBeenCalledWith("order_index");
  });
});

// ── duplicateDealToCategory — campo crítico ──────────────
describe("duplicateDealToCategory", () => {
  it("remove id/created_at/updated_at/click_count + force click_count=0 + nova category_id", async () => {
    let call = 0;
    let insertedPayload: Record<string, unknown> | null = null;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        return chain({
          data: {
            id: "orig-id",
            created_at: "2020-01-01",
            updated_at: "2020-02-01",
            click_count: 999,
            title: "Pizza",
            price: 10,
            category_id: "cat-old",
          },
          error: null,
        });
      }
      const c = chain({ data: null, error: null });
      c.insert = vi.fn((p: Record<string, unknown>) => {
        insertedPayload = p;
        return c;
      });
      return c;
    });

    await duplicateDealToCategory("orig-id", "cat-NEW");
    expect(insertedPayload).toMatchObject({
      title: "Pizza",
      price: 10,
      category_id: "cat-NEW", // nova
      click_count: 0, // resetado
    });
    // Campos auto-gerados NÃO devem ir
    expect(insertedPayload).not.toHaveProperty("id");
    expect(insertedPayload).not.toHaveProperty("created_at");
    expect(insertedPayload).not.toHaveProperty("updated_at");
  });

  it("fetch original falha: propaga", async () => {
    mockFrom.mockReturnValue(
      chain({ data: null, error: new Error("not found") }),
    );
    await expect(
      duplicateDealToCategory("orig-id", "cat-NEW"),
    ).rejects.toThrow("not found");
  });
});
