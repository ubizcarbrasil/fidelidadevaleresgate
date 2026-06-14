/**
 * offerGovernance — governança de ofertas afiliadas (sync/reports/bulk).
 *
 * Bug aqui:
 *   - KPIs errados (admin vê números de outra brand)
 *   - Bulk actions sem filtro de brand_id (cross-tenant damage)
 *   - Auto-hide threshold quebrado (oferta denunciada não esconde)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockInvoke, mockState } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockInvoke: vi.fn(),
  mockState: { lastInsertedRows: null as unknown },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    functions: { invoke: mockInvoke },
  },
}));

import {
  fetchGovernanceKpis,
  fetchGovernanceDeals,
  bulkUpdateDealStatus,
  bulkArchiveDeals,
  bulkDeactivateDeals,
  fetchOfferReports,
  updateReportStatus,
  syncGroupNow,
  resetGroup,
  cleanupGroupByStatus,
  fetchSyncGroups,
  STATUS_LABELS,
  REPORT_STATUS_LABELS,
  ORIGENS,
} from "../offerGovernance";

beforeEach(() => {
  mockFrom.mockReset();
  mockInvoke.mockReset();
});

/** Chain builder com .select/.eq/.in/.order/.limit/.ilike/.maybeSingle terminal */
function buildChain(terminalResult: { data: unknown; error?: unknown; count?: number } = { data: [] }) {
  const chain: Record<string, unknown> = {};
  const ops = ["select", "eq", "in", "ilike", "order", "limit", "update", "insert"];
  ops.forEach((op) => {
    chain[op] = vi.fn(() => chain);
  });
  chain.maybeSingle = vi.fn(() => Promise.resolve(terminalResult));
  // O caso comum: o método terminal é await direto na chain
  chain.then = (resolve: (r: unknown) => void) => resolve(terminalResult);
  return chain;
}

// ── Constantes exportadas ────────────────────────────────
describe("constantes", () => {
  it("ORIGENS contém dvlinks e divulgador_inteligente", () => {
    expect(ORIGENS.map((o) => o.value)).toEqual([
      "dvlinks",
      "divulgador_inteligente",
    ]);
  });

  it("STATUS_LABELS cobre 7 estados conhecidos", () => {
    expect(Object.keys(STATUS_LABELS)).toEqual([
      "active",
      "suspected_outdated",
      "user_reported",
      "removed_from_source",
      "sync_error",
      "archived",
      "inactive",
    ]);
  });

  it("REPORT_STATUS_LABELS cobre 4 estados conhecidos", () => {
    expect(Object.keys(REPORT_STATUS_LABELS)).toEqual([
      "pending",
      "reviewed",
      "confirmed",
      "dismissed",
    ]);
  });
});

// ── fetchGovernanceKpis ──────────────────────────────────
describe("fetchGovernanceKpis", () => {
  it("conta corretamente: ativas, removidas, denunciadas, arquivadas", async () => {
    const deals = [
      { id: "1", current_status: "active", is_active: true, source_group_id: "g1" },
      { id: "2", current_status: "active", is_active: false, source_group_id: "g1" }, // não ativa (is_active=false)
      { id: "3", current_status: "removed_from_source", is_active: false, source_group_id: "g2" },
      { id: "4", current_status: "user_reported", is_active: true, source_group_id: null },
      { id: "5", current_status: "archived", is_active: false, source_group_id: "g2" },
    ];
    mockFrom.mockReturnValue(buildChain({ data: deals }));

    const kpis = await fetchGovernanceKpis("b1", "dvlinks");

    expect(kpis.totalOfertas).toBe(5);
    expect(kpis.totalAtivas).toBe(1);
    expect(kpis.totalRemovidas).toBe(1);
    expect(kpis.totalDenunciadas).toBe(1);
    expect(kpis.totalArquivadas).toBe(1);
    expect(kpis.totalGrupos).toBe(2); // g1, g2 (null filtrado)
  });

  it("data null: zera tudo sem throw", async () => {
    mockFrom.mockReturnValue(buildChain({ data: null }));
    const kpis = await fetchGovernanceKpis("b1", "dvlinks");
    expect(kpis.totalOfertas).toBe(0);
    expect(kpis.totalGrupos).toBe(0);
  });
});

// ── fetchGovernanceDeals ─────────────────────────────────
describe("fetchGovernanceDeals", () => {
  it("filtros básicos sem extras: 2 eq calls", async () => {
    const chain = buildChain({ data: [{ id: "x" }] });
    mockFrom.mockReturnValue(chain);
    await fetchGovernanceDeals({ brandId: "b1", origin: "dvlinks" });
    // brandId + origin = 2 eq
    expect(chain.eq).toHaveBeenCalledTimes(2);
  });

  it("filtros opcionais (status/groupId/marketplace/search) somam eqs", async () => {
    const chain = buildChain({ data: [] });
    mockFrom.mockReturnValue(chain);
    await fetchGovernanceDeals({
      brandId: "b1",
      origin: "dvlinks",
      status: "active",
      groupId: "g1",
      marketplace: "amazon",
      search: "pizza",
    });
    // 2 base + 3 opcionais = 5 eqs; search vai pra ilike (1)
    expect(chain.eq).toHaveBeenCalledTimes(5);
    expect(chain.ilike).toHaveBeenCalledTimes(1);
  });

  it("erro do Supabase é propagado (throw)", async () => {
    const chain = buildChain({ data: null, error: new Error("RLS denied") });
    mockFrom.mockReturnValue(chain);
    await expect(
      fetchGovernanceDeals({ brandId: "b1", origin: "dvlinks" }),
    ).rejects.toThrow("RLS denied");
  });
});

// ── Bulk actions ─────────────────────────────────────────
describe("bulkUpdateDealStatus", () => {
  it("update + in(ids) com payload status/is_active/updated_at", async () => {
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await bulkUpdateDealStatus(["a", "b", "c"], "archived", false);
    expect(mockFrom).toHaveBeenCalledWith("affiliate_deals");
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        current_status: "archived",
        is_active: false,
      }),
    );
    expect(chain.in).toHaveBeenCalledWith("id", ["a", "b", "c"]);
  });

  it("erro: propaga", async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: new Error("oops") }));
    await expect(
      bulkUpdateDealStatus(["a"], "archived", false),
    ).rejects.toThrow("oops");
  });
});

describe("bulkArchiveDeals", () => {
  it("é alias de bulkUpdateDealStatus(ids, 'archived', false)", async () => {
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await bulkArchiveDeals(["a"]);
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ current_status: "archived", is_active: false }),
    );
  });
});

describe("bulkDeactivateDeals", () => {
  it("é alias de bulkUpdateDealStatus(ids, 'inactive', false)", async () => {
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await bulkDeactivateDeals(["a"]);
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ current_status: "inactive", is_active: false }),
    );
  });
});

// ── Reports ──────────────────────────────────────────────
describe("fetchOfferReports", () => {
  it("retorna data ou array vazio", async () => {
    mockFrom.mockReturnValue(buildChain({ data: [{ id: "r1" }, { id: "r2" }] }));
    const r = await fetchOfferReports("b1");
    expect(r).toHaveLength(2);
  });

  it("erro propagado", async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: new Error("x") }));
    await expect(fetchOfferReports("b1")).rejects.toThrow("x");
  });
});

describe("updateReportStatus + auto-hide threshold", () => {
  it("status != 'confirmed': só atualiza, NÃO consulta threshold", async () => {
    const reportChain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(reportChain);
    await updateReportStatus("r1", "dismissed");
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("status='confirmed' sem offerId: NÃO consulta threshold", async () => {
    const reportChain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(reportChain);
    await updateReportStatus("r1", "confirmed");
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("status='confirmed' com offerId, count<3: NÃO esconde oferta", async () => {
    // Primeira chamada: update do report
    // Segunda: select count com count<3 → não dispara hide
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) return buildChain({ data: null, error: null });
      if (call === 2) return buildChain({ data: null, error: null, count: 2 });
      throw new Error("unexpected from() call #" + call);
    });
    await updateReportStatus("r1", "confirmed", "offer-X");
    expect(call).toBe(2); // só report.update + count, sem hide
  });

  it("status='confirmed' com count>=3: esconde oferta (suspected_outdated + is_active=false)", async () => {
    let call = 0;
    let hideUpdate: Record<string, unknown> | null = null;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) return buildChain({ data: null, error: null });
      if (call === 2) return buildChain({ data: null, error: null, count: 5 });
      if (call === 3) {
        const chain = buildChain({ data: null, error: null });
        chain.update = vi.fn((payload: Record<string, unknown>) => {
          hideUpdate = payload;
          return chain;
        });
        return chain;
      }
      throw new Error("unexpected from() call #" + call);
    });
    await updateReportStatus("r1", "confirmed", "offer-X");
    expect(call).toBe(3); // report.update + count + deals.update(hide)
    expect(hideUpdate).toMatchObject({
      current_status: "suspected_outdated",
      is_active: false,
    });
  });
});

// ── Group actions ────────────────────────────────────────
describe("syncGroupNow", () => {
  it("chama supabase.functions.invoke('mirror-sync', body)", async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });
    const r = await syncGroupNow("b1", "dvlinks");
    expect(mockInvoke).toHaveBeenCalledWith("mirror-sync", {
      body: { brand_id: "b1", source_type: "dvlinks" },
    });
    expect(r).toEqual({ ok: true });
  });

  it("erro propagado", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error("function down") });
    await expect(syncGroupNow("b1", "dvlinks")).rejects.toThrow("function down");
  });
});

describe("resetGroup", () => {
  it("archive todos do grupo + incrementa sync_version do grupo", async () => {
    let call = 0;
    let updateCall = 0;
    const updatePayloads: Array<Record<string, unknown>> = [];
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        // affiliate_deals: archive
        const chain = buildChain({ data: null, error: null });
        chain.update = vi.fn((p: Record<string, unknown>) => {
          updatePayloads.push(p);
          return chain;
        });
        return chain;
      }
      if (call === 2) {
        // offer_sync_groups: select sync_version
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.maybeSingle = vi.fn().mockResolvedValue({
          data: { id: "g-uuid", sync_version: 4 },
        });
        return chain;
      }
      if (call === 3) {
        // offer_sync_groups: update sync_version
        const chain = buildChain({ data: null, error: null });
        chain.update = vi.fn((p: Record<string, unknown>) => {
          updateCall++;
          updatePayloads.push(p);
          return chain;
        });
        return chain;
      }
      throw new Error("unexpected from() call #" + call);
    });

    await resetGroup("b1", "dvlinks", "g-source-id");
    expect(call).toBe(3);
    expect(updatePayloads[0]).toMatchObject({
      current_status: "archived",
      is_active: false,
    });
    expect(updatePayloads[1]).toMatchObject({ sync_version: 5 }); // 4 + 1
  });

  it("grupo não encontrado: NÃO faz update de sync_version", async () => {
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) return buildChain({ data: null, error: null }); // archive
      if (call === 2) {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.maybeSingle = vi.fn().mockResolvedValue({ data: null });
        return chain;
      }
      throw new Error("unexpected from() call #" + call);
    });

    await resetGroup("b1", "dvlinks", "g-source-id");
    expect(call).toBe(2); // só archive + select; sem update group
  });
});

describe("cleanupGroupByStatus", () => {
  it("archive deals com status filter especifico", async () => {
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await cleanupGroupByStatus("b1", "dvlinks", "removed_from_source");
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        current_status: "archived",
        is_active: false,
      }),
    );
    // 3 eqs: brand_id, origin, current_status
    expect(chain.eq).toHaveBeenCalledTimes(3);
  });
});

// ── Sync groups ──────────────────────────────────────────
describe("fetchSyncGroups", () => {
  it("retorna data ou []", async () => {
    mockFrom.mockReturnValue(buildChain({ data: [{ id: "g1" }] }));
    const r = await fetchSyncGroups("b1", "dvlinks");
    expect(r).toHaveLength(1);
  });

  it("erro propagado", async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: new Error("z") }));
    await expect(fetchSyncGroups("b1", "dvlinks")).rejects.toThrow("z");
  });
});
