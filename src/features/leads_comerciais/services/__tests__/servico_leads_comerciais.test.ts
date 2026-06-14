/**
 * servico_leads_comerciais — listagem com múltiplos filtros (status,
 * período, empresa, UTM, busca textual). Bug aqui = filtro vazio gera
 * WHERE inválido (timeout query), busca curta vira full-table-scan,
 * status null vaza leads de outros status.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

import { listarLeadsComerciais } from "../servico_leads_comerciais";

interface ChainSpy {
  eqCalls: Array<[string, unknown]>;
  ilikeCalls: Array<[string, string]>;
  orCalls: string[];
  gteCalls: Array<[string, string]>;
  lteCalls: Array<[string, string]>;
}

function makeChain(opts: { data?: unknown[]; error?: unknown } = {}): { chain: unknown; spy: ChainSpy } {
  const spy: ChainSpy = {
    eqCalls: [],
    ilikeCalls: [],
    orCalls: [],
    gteCalls: [],
    lteCalls: [],
  };
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    eq: vi.fn((col: string, val: unknown) => { spy.eqCalls.push([col, val]); return chain; }),
    ilike: vi.fn((col: string, val: string) => { spy.ilikeCalls.push([col, val]); return chain; }),
    or: vi.fn((f: string) => { spy.orCalls.push(f); return chain; }),
    gte: vi.fn((col: string, val: string) => { spy.gteCalls.push([col, val]); return chain; }),
    lte: vi.fn((col: string, val: string) => { spy.lteCalls.push([col, val]); return chain; }),
    then: (resolve: (r: unknown) => void) =>
      resolve({ data: opts.data ?? [], error: opts.error ?? null }),
  };
  return { chain, spy };
}

beforeEach(() => {
  mockFrom.mockReset();
});

describe("listarLeadsComerciais", () => {
  it("sem filtros: só select + order + limit (sem .eq/.ilike)", async () => {
    const { chain, spy } = makeChain({ data: [] });
    mockFrom.mockReturnValue(chain);
    await listarLeadsComerciais({});
    expect(spy.eqCalls).toEqual([]);
    expect(spy.ilikeCalls).toEqual([]);
    expect(spy.orCalls).toEqual([]);
  });

  it("status: aplica .eq('status', X)", async () => {
    const { chain, spy } = makeChain();
    mockFrom.mockReturnValue(chain);
    await listarLeadsComerciais({ status: "convertido" as never });
    expect(spy.eqCalls).toContainEqual(["status", "convertido"]);
  });

  it("productSlug + faixaMotoristas: 2 eq", async () => {
    const { chain, spy } = makeChain();
    mockFrom.mockReturnValue(chain);
    await listarLeadsComerciais({ productSlug: "essential", faixaMotoristas: "50-200" });
    expect(spy.eqCalls).toContainEqual(["product_slug", "essential"]);
    expect(spy.eqCalls).toContainEqual(["company_size", "50-200"]);
  });

  it("cidade: ilike %cidade%", async () => {
    const { chain, spy } = makeChain();
    mockFrom.mockReturnValue(chain);
    await listarLeadsComerciais({ cidade: "São Paulo" });
    expect(spy.ilikeCalls).toContainEqual(["city", "%São Paulo%"]);
  });

  it("periodo: gte + lte", async () => {
    const { chain, spy } = makeChain();
    mockFrom.mockReturnValue(chain);
    await listarLeadsComerciais({ periodoDe: "2026-01-01", periodoAte: "2026-12-31" });
    expect(spy.gteCalls).toContainEqual(["created_at", "2026-01-01"]);
    expect(spy.lteCalls).toContainEqual(["created_at", "2026-12-31"]);
  });

  it("empresa < 2 chars: NÃO filtra (UX guard)", async () => {
    const { chain, spy } = makeChain();
    mockFrom.mockReturnValue(chain);
    await listarLeadsComerciais({ empresa: "x" });
    expect(spy.ilikeCalls).toEqual([]);
  });

  it("empresa >= 2 chars: filtra com trim", async () => {
    const { chain, spy } = makeChain();
    mockFrom.mockReturnValue(chain);
    await listarLeadsComerciais({ empresa: "  Acme  " });
    expect(spy.ilikeCalls).toContainEqual(["company_name", "%Acme%"]);
  });

  it("busca >= 2 chars: .or em 4 colunas", async () => {
    const { chain, spy } = makeChain();
    mockFrom.mockReturnValue(chain);
    await listarLeadsComerciais({ busca: "maria" });
    expect(spy.orCalls).toHaveLength(1);
    expect(spy.orCalls[0]).toContain("full_name.ilike.%maria%");
    expect(spy.orCalls[0]).toContain("work_email.ilike.%maria%");
    expect(spy.orCalls[0]).toContain("company_name.ilike.%maria%");
    expect(spy.orCalls[0]).toContain("phone.ilike.%maria%");
  });

  it("busca < 2 chars: NÃO aplica .or", async () => {
    const { chain, spy } = makeChain();
    mockFrom.mockReturnValue(chain);
    await listarLeadsComerciais({ busca: "a" });
    expect(spy.orCalls).toEqual([]);
  });

  it("produtoTexto >= 2 chars: .or em product_name e product_slug", async () => {
    const { chain, spy } = makeChain();
    mockFrom.mockReturnValue(chain);
    await listarLeadsComerciais({ produtoTexto: "essential" });
    expect(spy.orCalls).toHaveLength(1);
    expect(spy.orCalls[0]).toContain("product_name.ilike.%essential%");
    expect(spy.orCalls[0]).toContain("product_slug.ilike.%essential%");
  });

  it("UTM trio: cada um vira ilike", async () => {
    const { chain, spy } = makeChain();
    mockFrom.mockReturnValue(chain);
    await listarLeadsComerciais({
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "black-friday",
    });
    expect(spy.ilikeCalls).toContainEqual(["utm_source", "%google%"]);
    expect(spy.ilikeCalls).toContainEqual(["utm_medium", "%cpc%"]);
    expect(spy.ilikeCalls).toContainEqual(["utm_campaign", "%black-friday%"]);
  });

  it("error: throw", async () => {
    const { chain } = makeChain({ error: { message: "fail" } });
    mockFrom.mockReturnValue(chain);
    await expect(listarLeadsComerciais({})).rejects.toEqual({ message: "fail" });
  });

  it("data=null: retorna []", async () => {
    const { chain } = makeChain({ data: undefined });
    chain.then = (resolve: (r: unknown) => void) => resolve({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    expect(await listarLeadsComerciais({})).toEqual([]);
  });
});
