/**
 * tierUtils — classificação de tier por contagem de corridas.
 * Bug aqui = boundary errado (10 vai pra PRATA em vez de BRONZE),
 * tier desconhecido sem fallback (crash em label), threshold mismatch
 * com Supabase RPC.
 */
import { describe, it, expect } from "vitest";
import { getTierFromRideCount, getTierInfo, TIERS, CRM_SYNC_LABELS } from "../tierUtils";

describe("getTierFromRideCount — boundaries", () => {
  it("0 → INICIANTE (sem corrida)", () => {
    expect(getTierFromRideCount(0)).toBe("INICIANTE");
  });

  it("1 → BRONZE (primeira corrida)", () => {
    expect(getTierFromRideCount(1)).toBe("BRONZE");
  });

  it("10 → BRONZE (boundary superior)", () => {
    expect(getTierFromRideCount(10)).toBe("BRONZE");
  });

  it("11 → PRATA (entra na faixa)", () => {
    expect(getTierFromRideCount(11)).toBe("PRATA");
  });

  it("30 → PRATA (boundary superior)", () => {
    expect(getTierFromRideCount(30)).toBe("PRATA");
  });

  it("31 → OURO", () => {
    expect(getTierFromRideCount(31)).toBe("OURO");
  });

  it("50 → OURO (boundary)", () => {
    expect(getTierFromRideCount(50)).toBe("OURO");
  });

  it("51 → DIAMANTE", () => {
    expect(getTierFromRideCount(51)).toBe("DIAMANTE");
  });

  it("100 → DIAMANTE (boundary)", () => {
    expect(getTierFromRideCount(100)).toBe("DIAMANTE");
  });

  it("101 → LENDARIO", () => {
    expect(getTierFromRideCount(101)).toBe("LENDARIO");
  });

  it("500 → LENDARIO (boundary)", () => {
    expect(getTierFromRideCount(500)).toBe("LENDARIO");
  });

  it("501 → GALATICO (topo)", () => {
    expect(getTierFromRideCount(501)).toBe("GALATICO");
  });

  it("9999 → GALATICO (sem limite superior)", () => {
    expect(getTierFromRideCount(9999)).toBe("GALATICO");
  });
});

describe("getTierInfo", () => {
  it("key válida: retorna o tier com label + color", () => {
    const info = getTierInfo("OURO");
    expect(info.key).toBe("OURO");
    expect(info.label).toBe("Ouro");
    expect(info.color).toContain("amber");
  });

  it("key desconhecida: fallback pro último tier (INICIANTE — gracioso)", () => {
    const info = getTierInfo("DESCONHECIDO");
    expect(info.key).toBe("INICIANTE");
  });

  it("todos os 7 tiers existem em TIERS", () => {
    const keys = TIERS.map((t) => t.key);
    expect(keys).toEqual(["GALATICO", "LENDARIO", "DIAMANTE", "OURO", "PRATA", "BRONZE", "INICIANTE"]);
  });

  it("boundaries não sobrepõem nem deixam gaps", () => {
    const sorted = [...TIERS].sort((a, b) => a.min - b.min);
    for (let i = 0; i < sorted.length - 1; i++) {
      const cur = sorted[i];
      const nxt = sorted[i + 1];
      expect(cur.max + 1).toBe(nxt.min);
    }
  });
});

describe("CRM_SYNC_LABELS", () => {
  it("SYNCED: label 'CRM' + verde", () => {
    expect(CRM_SYNC_LABELS.SYNCED.label).toBe("CRM");
    expect(CRM_SYNC_LABELS.SYNCED.color).toContain("green");
  });

  it("PENDING: label 'Pendente CRM' + amarelo", () => {
    expect(CRM_SYNC_LABELS.PENDING.label).toMatch(/Pendente/);
    expect(CRM_SYNC_LABELS.PENDING.color).toContain("yellow");
  });

  it("NONE: label vazia (não renderiza badge)", () => {
    expect(CRM_SYNC_LABELS.NONE.label).toBe("");
  });
});
