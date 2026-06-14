/**
 * servico_ofertas_publicas — busca marca / oferta pública por hostname ou
 * brand_id. Espelha resolveBrandByDomain do BrandContext.
 *
 * Bug aqui = hostname com 'www.' tenta primeiro o errado (perde primeira
 * tentativa), subdomain 'app' acaba batendo errado, oferta sem
 * visible_driver vaza pra portal público.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

import {
  buscarMarcaPorId,
  buscarBrandIdPorHostname,
  buscarOfertasAtivas,
  buscarCategoriasAtivas,
} from "../servico_ofertas_publicas";

beforeEach(() => {
  mockFrom.mockReset();
});

// ────────────────────────────────────────────────────────
// buscarMarcaPorId
// ────────────────────────────────────────────────────────
describe("buscarMarcaPorId", () => {
  it("found ativo: retorna marca", async () => {
    const brand = { id: "b1", name: "Pizza Vale", brand_settings_json: null };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: brand }),
    });
    expect(await buscarMarcaPorId("b1")).toEqual(brand);
  });

  it("not found / inativo: null", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    });
    expect(await buscarMarcaPorId("ghost")).toBeNull();
  });
});

// ────────────────────────────────────────────────────────
// buscarBrandIdPorHostname — caminho subdomain
// ────────────────────────────────────────────────────────
describe("buscarBrandIdPorHostname", () => {
  function setupChain(handlers: {
    bySubdomain?: { brand_id: string } | null;
    byDomain?: Record<string, { brand_id: string } | null>;
  }) {
    const domainsTried: string[] = [];
    const subdomainsTried: string[] = [];
    // Cada call a from() retorna um chain novo (closure por chamada)
    mockFrom.mockImplementation(() => {
      let mode: "subdomain" | "domain" | null = null;
      let captured: string | null = null;
      const chain: Record<string, unknown> = {
        select: vi.fn(() => chain),
        eq: vi.fn((col: string, val: unknown) => {
          if (col === "subdomain") { mode = "subdomain"; captured = val as string; subdomainsTried.push(val as string); }
          if (col === "domain") { mode = "domain"; captured = val as string; domainsTried.push(val as string); }
          return chain;
        }),
        maybeSingle: vi.fn(async () => {
          if (mode === "subdomain") return { data: handlers.bySubdomain ?? null };
          if (mode === "domain" && captured) return { data: handlers.byDomain?.[captured] ?? null };
          return { data: null };
        }),
      };
      return chain;
    });
    return { subdomainsTried: () => subdomainsTried, domainsTried: () => domainsTried };
  }

  it("subdomain encontrado em brand_domains: retorna brand_id", async () => {
    setupChain({ bySubdomain: { brand_id: "b-pizza" } });
    expect(await buscarBrandIdPorHostname("pizza.valeresgate.com.br")).toBe("b-pizza");
  });

  it("hostname='localhost': pula subdomain query (skip list)", async () => {
    const ctx = setupChain({ bySubdomain: null });
    await buscarBrandIdPorHostname("localhost");
    expect(ctx.subdomainsTried()).toEqual([]);
  });

  it("hostname='app.valeresgate...': pula subdomain (skip list)", async () => {
    const ctx = setupChain({ bySubdomain: null });
    await buscarBrandIdPorHostname("app.valeresgate.com.br");
    expect(ctx.subdomainsTried()).toEqual([]);
  });

  it("normaliza hostname: https://x.com/ → x.com (regex lowercase only)", async () => {
    const ctx = setupChain({});
    await buscarBrandIdPorHostname("https://Pizza.COM/");
    // hostname normalizado vira "pizza.com" — só 2 parts, subdomain='pizza'
    expect(ctx.subdomainsTried()).toContain("pizza");
  });

  it("sem subdomain match: tenta domínio completo + www variant", async () => {
    const ctx = setupChain({ byDomain: {} });
    await buscarBrandIdPorHostname("test.com");
    expect(ctx.domainsTried()).toEqual(["test.com", "www.test.com"]);
  });

  it("hostname com www: tenta também sem www", async () => {
    const ctx = setupChain({ byDomain: {} });
    await buscarBrandIdPorHostname("www.test.com");
    expect(ctx.domainsTried()).toEqual(["www.test.com", "test.com"]);
  });

  it("match no domínio completo: retorna brand_id", async () => {
    setupChain({ byDomain: { "test.com": { brand_id: "b-test" } } });
    expect(await buscarBrandIdPorHostname("test.com")).toBe("b-test");
  });

  it("nada encontrado: retorna null", async () => {
    setupChain({ byDomain: {} });
    expect(await buscarBrandIdPorHostname("desconhecido.com")).toBeNull();
  });
});

// ────────────────────────────────────────────────────────
// buscarOfertasAtivas
// ────────────────────────────────────────────────────────
describe("buscarOfertasAtivas", () => {
  it("retorna apenas ofertas ativas + visible_driver, ordenadas por featured", async () => {
    const ofertas = [{ id: "o1" }, { id: "o2" }];
    const eqCalls: Array<[string, unknown]> = [];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(function (this: never, col: string, val: unknown) {
        eqCalls.push([col, val]);
        return this;
      }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: ofertas }),
    });
    const result = await buscarOfertasAtivas("b1");
    expect(result).toEqual(ofertas);
    expect(eqCalls).toContainEqual(["brand_id", "b1"]);
    expect(eqCalls).toContainEqual(["is_active", true]);
    expect(eqCalls).toContainEqual(["visible_driver", true]);
  });

  it("data null: array vazio", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null }),
    });
    expect(await buscarOfertasAtivas("b1")).toEqual([]);
  });
});

// ────────────────────────────────────────────────────────
// buscarCategoriasAtivas
// ────────────────────────────────────────────────────────
describe("buscarCategoriasAtivas", () => {
  it("retorna categorias ativas do brand ordenadas", async () => {
    const cats = [{ id: "c1" }, { id: "c2" }];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: cats }),
    });
    expect(await buscarCategoriasAtivas("b1")).toEqual(cats);
  });

  it("data null: array vazio", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null }),
    });
    expect(await buscarCategoriasAtivas("b1")).toEqual([]);
  });
});
