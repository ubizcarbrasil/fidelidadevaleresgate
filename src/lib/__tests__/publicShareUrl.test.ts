/**
 * publicShareUrl — resolução de origin canônico + builders de URLs públicas.
 *
 * Bug aqui:
 *   - Links de motorista quebrados (compartilhamento por WhatsApp)
 *   - Cache stale (admin muda domain mas link continua antigo)
 *   - URL com double slash ou querystring malformada
 *
 * Cobre todas as funções públicas:
 *   - getPublicOrigin (async com fallbacks)
 *   - getPublicOriginSync (cache lookup)
 *   - resolveCanonicalOriginFromSettings (mixed: settings + supabase)
 *   - buildDriverUrl / buildDriverShortUrl / buildWebviewWrapperUrl (pure)
 *
 * shareDriverUrl NÃO é testado aqui — navigator.share + clipboard são
 * APIs flaky em jsdom. Vale unit test separado se houver demanda.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockMaybeSingle, mockFrom, mockToast } = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const limit = vi.fn(() => ({ maybeSingle }));
  const eq = vi.fn();
  const select = vi.fn();
  const from = vi.fn();
  return {
    mockMaybeSingle: maybeSingle,
    mockLimit: limit,
    mockEq: eq,
    mockSelect: select,
    mockFrom: from,
    mockToast: vi.fn(),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: mockToast,
}));

beforeEach(() => {
  mockMaybeSingle.mockReset();
  mockFrom.mockReset();
  mockToast.mockReset();
  // Reset module pra limpar o cachedBaseUrls singleton entre testes
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Helper: fresh import + setup chained builder pra qualquer tabela
async function freshImport() {
  return import("../publicShareUrl");
}

function mockChain(maybeSingleResult: unknown) {
  // Chain: from(table).select(cols).eq(...).eq(...).limit(...).maybeSingle()
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.maybeSingle = vi.fn().mockResolvedValue(maybeSingleResult);
  return chain as { select: (...a: unknown[]) => unknown; maybeSingle: () => Promise<unknown> };
}

// ── buildDriverUrl (puro) ─────────────────────────────────
describe("buildDriverUrl", () => {
  it("URL básica: origin/driver?brandId=X", async () => {
    const { buildDriverUrl } = await freshImport();
    expect(buildDriverUrl("https://acme.com", "brand-1")).toBe(
      "https://acme.com/driver?brandId=brand-1",
    );
  });

  it("com dealId: anexa &dealId=", async () => {
    const { buildDriverUrl } = await freshImport();
    expect(buildDriverUrl("https://acme.com", "b1", { dealId: "d1" })).toBe(
      "https://acme.com/driver?brandId=b1&dealId=d1",
    );
  });

  it("com categoryId: anexa &categoryId=", async () => {
    const { buildDriverUrl } = await freshImport();
    expect(buildDriverUrl("https://acme.com", "b1", { categoryId: "c1" })).toBe(
      "https://acme.com/driver?brandId=b1&categoryId=c1",
    );
  });

  it("dealId tem precedência sobre categoryId quando ambos passados", async () => {
    const { buildDriverUrl } = await freshImport();
    expect(
      buildDriverUrl("https://acme.com", "b1", { dealId: "d1", categoryId: "c1" }),
    ).toBe("https://acme.com/driver?brandId=b1&dealId=d1");
  });
});

// ── buildDriverShortUrl (puro) ────────────────────────────
describe("buildDriverShortUrl", () => {
  it("URL curta sem params: origin/d/brandId", async () => {
    const { buildDriverShortUrl } = await freshImport();
    expect(buildDriverShortUrl("https://acme.com", "brand-1")).toBe(
      "https://acme.com/d/brand-1",
    );
  });

  it("com dealId: anexa ?dealId=", async () => {
    const { buildDriverShortUrl } = await freshImport();
    expect(buildDriverShortUrl("https://acme.com", "b1", { dealId: "d1" })).toBe(
      "https://acme.com/d/b1?dealId=d1",
    );
  });

  it("com categoryId: anexa ?categoryId=", async () => {
    const { buildDriverShortUrl } = await freshImport();
    expect(buildDriverShortUrl("https://acme.com", "b1", { categoryId: "c1" })).toBe(
      "https://acme.com/d/b1?categoryId=c1",
    );
  });

  it("ambos: junta com & (URLSearchParams encoding)", async () => {
    const { buildDriverShortUrl } = await freshImport();
    expect(
      buildDriverShortUrl("https://acme.com", "b1", { dealId: "d1", categoryId: "c1" }),
    ).toMatch(/^https:\/\/acme\.com\/d\/b1\?/);
    // Ordem dos params não importa
    const result = buildDriverShortUrl("https://acme.com", "b1", {
      dealId: "d1",
      categoryId: "c1",
    });
    expect(result).toContain("dealId=d1");
    expect(result).toContain("categoryId=c1");
  });

  it("escapa chars especiais via URLSearchParams", async () => {
    const { buildDriverShortUrl } = await freshImport();
    const r = buildDriverShortUrl("https://acme.com", "b1", { dealId: "a b/c" });
    expect(r).toContain("dealId=a+b%2Fc");
  });
});

// ── buildWebviewWrapperUrl (puro) ─────────────────────────
describe("buildWebviewWrapperUrl", () => {
  it("inclui url, title, header, back, share", async () => {
    const { buildWebviewWrapperUrl } = await freshImport();
    const r = buildWebviewWrapperUrl(
      "https://acme.com",
      "https://external.com/offer/123",
      "Pizza Promo",
    );
    expect(r).toMatch(/^https:\/\/acme\.com\/webview\?/);
    expect(r).toContain("url=https%3A%2F%2Fexternal.com%2Foffer%2F123");
    expect(r).toContain("title=Pizza+Promo");
    expect(r).toContain("header=1");
    expect(r).toContain("back=1");
    expect(r).toContain("share=1");
  });

  it("title default 'Ofertas' quando ausente", async () => {
    const { buildWebviewWrapperUrl } = await freshImport();
    const r = buildWebviewWrapperUrl("https://x.com", "https://y.com");
    expect(r).toContain("title=Ofertas");
  });
});

// ── getPublicOriginSync (cache lookup) ────────────────────
describe("getPublicOriginSync", () => {
  it("sem cache: retorna PUBLISHED_ORIGIN", async () => {
    const { getPublicOriginSync } = await freshImport();
    expect(getPublicOriginSync("brand-virgin")).toBe(
      "https://fidelidadevaleresgate.lovable.app",
    );
  });

  it("com cache populado por getPublicOrigin: retorna cache", async () => {
    mockFrom.mockReturnValue(
      mockChain({ data: { brand_settings_json: { driver_public_base_url: "https://cached.com" } } }),
    );
    const { getPublicOrigin, getPublicOriginSync } = await freshImport();
    await getPublicOrigin("brand-cached");
    expect(getPublicOriginSync("brand-cached")).toBe("https://cached.com");
  });
});

// ── getPublicOrigin (async com fallbacks) ─────────────────
describe("getPublicOrigin", () => {
  it("usa driver_public_base_url quando configurado", async () => {
    mockFrom.mockReturnValue(
      mockChain({
        data: {
          brand_settings_json: {
            driver_public_base_url: "https://custom.brand.com/",
          },
        },
      }),
    );
    const { getPublicOrigin } = await freshImport();
    const r = await getPublicOrigin("brand-1");
    // Trim + remove trailing slash
    expect(r).toBe("https://custom.brand.com");
  });

  it("cache hit em segunda chamada: 0 queries", async () => {
    const chain = mockChain({
      data: {
        brand_settings_json: { driver_public_base_url: "https://once.com" },
      },
    });
    mockFrom.mockReturnValue(chain);
    const { getPublicOrigin } = await freshImport();
    await getPublicOrigin("brand-cache-hit");
    await getPublicOrigin("brand-cache-hit");
    // from chamado 1x (primeira call), não 2
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("sem driver_public_base_url: cai pra brand_domains", async () => {
    let call = 0;
    mockFrom.mockImplementation((table: string) => {
      call++;
      if (table === "public_brands_safe") {
        return mockChain({ data: { brand_settings_json: null } });
      }
      if (table === "brand_domains") {
        return mockChain({ data: { domain: "minha-loja.com.br" } });
      }
      return mockChain({ data: null });
    });
    const { getPublicOrigin } = await freshImport();
    const r = await getPublicOrigin("brand-domain");
    expect(r).toBe("https://minha-loja.com.br");
    expect(call).toBe(2);
  });

  it("brand_domains com prefixo https://: normaliza pra evitar double", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "public_brands_safe") return mockChain({ data: null });
      return mockChain({ data: { domain: "https://x.com/" } });
    });
    const { getPublicOrigin } = await freshImport();
    expect(await getPublicOrigin("brand-strip")).toBe("https://x.com");
  });

  it("sem nada → PUBLISHED_ORIGIN", async () => {
    mockFrom.mockReturnValue(mockChain({ data: null }));
    const { getPublicOrigin } = await freshImport();
    expect(await getPublicOrigin("brand-none")).toBe(
      "https://fidelidadevaleresgate.lovable.app",
    );
  });

  it("query lança exceção: cai pra PUBLISHED_ORIGIN graceful", async () => {
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.reject(new Error("boom")) }) }),
    });
    const { getPublicOrigin } = await freshImport();
    expect(await getPublicOrigin("brand-boom")).toBe(
      "https://fidelidadevaleresgate.lovable.app",
    );
  });
});

// ── resolveCanonicalOriginFromSettings ────────────────────
describe("resolveCanonicalOriginFromSettings", () => {
  it("usa settings.driver_public_base_url quando passado", async () => {
    const { resolveCanonicalOriginFromSettings } = await freshImport();
    const r = await resolveCanonicalOriginFromSettings("b1", {
      driver_public_base_url: "https://fast.com/",
    });
    expect(r).toBe("https://fast.com");
  });

  it("settings nulos: consulta brand_domains", async () => {
    mockFrom.mockReturnValue(mockChain({ data: { domain: "loja.com" } }));
    const { resolveCanonicalOriginFromSettings } = await freshImport();
    const r = await resolveCanonicalOriginFromSettings("b1", null);
    expect(r).toBe("https://loja.com");
  });

  it("sem nada: PUBLISHED_ORIGIN", async () => {
    mockFrom.mockReturnValue(mockChain({ data: null }));
    const { resolveCanonicalOriginFromSettings } = await freshImport();
    const r = await resolveCanonicalOriginFromSettings("b1", {});
    expect(r).toBe("https://fidelidadevaleresgate.lovable.app");
  });

  it("cache hit: settings.driver_public_base_url ignorado se cache já tem", async () => {
    mockFrom.mockReturnValue(
      mockChain({
        data: {
          brand_settings_json: { driver_public_base_url: "https://cached.com" },
        },
      }),
    );
    const { getPublicOrigin, resolveCanonicalOriginFromSettings } = await freshImport();
    // Primeira chamada popula cache
    await getPublicOrigin("brand-c");
    // Segunda via resolve ignora settings, devolve cache
    const r = await resolveCanonicalOriginFromSettings("brand-c", {
      driver_public_base_url: "https://other.com",
    });
    expect(r).toBe("https://cached.com");
  });
});
