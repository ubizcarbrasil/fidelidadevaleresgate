/**
 * utilitarios_kpis — calcula KPIs do dashboard de leads comerciais
 * (total mês, convertidos, taxa, top-5 produtos).
 *
 * Bug aqui = taxaConversao com /0 vira NaN, top-5 ordenado errado
 * (alphabetical em vez de count), totalNoMes inclui mês anterior por
 * timezone bug.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { calcularKpis } from "../utilitarios_kpis";

function makeLead(over: Partial<{ status: string; created_at: string; product_name: string | null; product_slug: string | null }>) {
  return {
    id: Math.random().toString(),
    status: "novo",
    created_at: "2026-06-14T10:00:00Z",
    product_name: null,
    product_slug: null,
    ...over,
  } as never;
}

beforeEach(() => {
  // Fixa data atual em 14/06/2026 pra testes determinísticos
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-14T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("calcularKpis", () => {
  it("lista vazia: tudo zero + taxa=0 (sem NaN)", () => {
    const result = calcularKpis([]);
    expect(result).toEqual({
      totalNoMes: 0,
      totalGeral: 0,
      convertidos: 0,
      taxaConversao: 0,
      novos: 0,
      porProduto: [],
    });
  });

  it("totalGeral conta todos os leads", () => {
    const leads = [makeLead({}), makeLead({}), makeLead({})];
    expect(calcularKpis(leads).totalGeral).toBe(3);
  });

  it("totalNoMes: filtra por mês corrente (>= 01/06/2026)", () => {
    const leads = [
      makeLead({ created_at: "2026-06-10T00:00:00Z" }),
      makeLead({ created_at: "2026-06-14T00:00:00Z" }),
      makeLead({ created_at: "2026-05-30T00:00:00Z" }),
    ];
    expect(calcularKpis(leads).totalNoMes).toBe(2);
  });

  it("convertidos: filtra por status='convertido'", () => {
    const leads = [
      makeLead({ status: "convertido" }),
      makeLead({ status: "convertido" }),
      makeLead({ status: "novo" }),
      makeLead({ status: "qualificado" }),
    ];
    expect(calcularKpis(leads).convertidos).toBe(2);
  });

  it("novos: filtra por status='novo'", () => {
    const leads = [
      makeLead({ status: "novo" }),
      makeLead({ status: "novo" }),
      makeLead({ status: "convertido" }),
    ];
    expect(calcularKpis(leads).novos).toBe(2);
  });

  it("taxaConversao = (convertidos / total) * 100", () => {
    const leads = [
      makeLead({ status: "convertido" }),
      makeLead({ status: "convertido" }),
      makeLead({ status: "novo" }),
      makeLead({ status: "novo" }),
    ];
    expect(calcularKpis(leads).taxaConversao).toBe(50);
  });

  it("porProduto: agrupa por product_name, sorted desc, top-5", () => {
    const leads = [
      ...Array(10).fill(0).map(() => makeLead({ product_name: "Cashback" })),
      ...Array(5).fill(0).map(() => makeLead({ product_name: "Lealdade" })),
      ...Array(7).fill(0).map(() => makeLead({ product_name: "Achadinhos" })),
    ];
    const kpis = calcularKpis(leads);
    expect(kpis.porProduto).toEqual([
      { produto: "Cashback", total: 10 },
      { produto: "Achadinhos", total: 7 },
      { produto: "Lealdade", total: 5 },
    ]);
  });

  it("product_name null: usa product_slug como key", () => {
    const leads = [
      makeLead({ product_name: null, product_slug: "essential" }),
      makeLead({ product_name: null, product_slug: "essential" }),
    ];
    expect(calcularKpis(leads).porProduto).toEqual([{ produto: "essential", total: 2 }]);
  });

  it("product_name + slug ambos null: 'Sem produto'", () => {
    const leads = [makeLead({ product_name: null, product_slug: null })];
    expect(calcularKpis(leads).porProduto).toEqual([{ produto: "Sem produto", total: 1 }]);
  });

  it("porProduto: corta em top-5 (6º+ descartado)", () => {
    const leads = [
      ...Array(6).fill(0).map(() => makeLead({ product_name: "A" })),
      ...Array(5).fill(0).map(() => makeLead({ product_name: "B" })),
      ...Array(4).fill(0).map(() => makeLead({ product_name: "C" })),
      ...Array(3).fill(0).map(() => makeLead({ product_name: "D" })),
      ...Array(2).fill(0).map(() => makeLead({ product_name: "E" })),
      ...Array(1).fill(0).map(() => makeLead({ product_name: "F" })),
    ];
    const kpis = calcularKpis(leads);
    expect(kpis.porProduto).toHaveLength(5);
    expect(kpis.porProduto.map((p) => p.produto)).toEqual(["A", "B", "C", "D", "E"]);
  });
});
