/**
 * brand/utils — fetchBrandById (cache + public_brands_safe + brands),
 * resolveBrandByDomain (subdomain + custom domain), findNearestBranch,
 * withNetworkRetry (transient-only backoff).
 *
 * Bug aqui = brand resolve errado por hostname (vaza tenant), retry roda em
 * erro permanente (timeout multiplicado), branch mais próxima ignora coords
 * inválidos.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockGetBootContext, mockBootMark } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetBootContext: vi.fn(),
  mockBootMark: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

vi.mock("@/lib/bootContext", () => ({
  getBootContext: mockGetBootContext,
}));

vi.mock("@/lib/bootMetrics", () => ({
  bootMark: mockBootMark,
}));

import {
  isTransientNetworkError,
  withNetworkRetry,
  fetchBrandById,
  resolveBrandByDomain,
  findNearestBranch,
  isLocalOrPortalHost,
} from "../utils";

beforeEach(() => {
  mockFrom.mockReset();
  mockGetBootContext.mockReset();
  mockBootMark.mockReset();
});

// ────────────────────────────────────────────────────────
// isTransientNetworkError
// ────────────────────────────────────────────────────────
describe("isTransientNetworkError", () => {
  it("'Load failed' → true (Safari fetch abort)", () => {
    expect(isTransientNetworkError(new Error("Load failed"))).toBe(true);
  });

  it("'Failed to fetch' → true (Chrome network)", () => {
    expect(isTransientNetworkError(new Error("Failed to fetch"))).toBe(true);
  });

  it("'NetworkError' → true (Firefox)", () => {
    expect(isTransientNetworkError(new Error("NetworkError when attempting"))).toBe(true);
  });

  it("erro genérico 'Not found' → false (não retry)", () => {
    expect(isTransientNetworkError(new Error("Not found"))).toBe(false);
  });

  it("null/undefined → false", () => {
    expect(isTransientNetworkError(null)).toBe(false);
    expect(isTransientNetworkError(undefined)).toBe(false);
  });

  it("objeto sem .message → false", () => {
    expect(isTransientNetworkError({ foo: "bar" })).toBe(false);
  });
});

// ────────────────────────────────────────────────────────
// withNetworkRetry
// ────────────────────────────────────────────────────────
describe("withNetworkRetry", () => {
  it("primeira tentativa OK: chama 1x", async () => {
    const fn = vi.fn(async () => "ok");
    const res = await withNetworkRetry(fn);
    expect(res).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("transient + recupera na 2ª: chama 2x", async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls++;
      if (calls === 1) throw new Error("Failed to fetch");
      return "ok";
    });
    const promise = withNetworkRetry(fn);
    // backoff 500ms — pular com fake timers
    await vi.waitFor(() => expect(fn).toHaveBeenCalledTimes(2), { timeout: 2000 });
    expect(await promise).toBe("ok");
  });

  it("erro permanente: não retry, propaga imediatamente", async () => {
    const fn = vi.fn(async () => { throw new Error("Bad data"); });
    await expect(withNetworkRetry(fn)).rejects.toThrow("Bad data");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("transient sempre falhando até maxAttempts=3: 3 chamadas + throw", async () => {
    const fn = vi.fn(async () => { throw new Error("Load failed"); });
    await expect(withNetworkRetry(fn, 3)).rejects.toThrow("Load failed");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

// ────────────────────────────────────────────────────────
// fetchBrandById
// ────────────────────────────────────────────────────────
describe("fetchBrandById", () => {
  function makeChain(result: { data?: unknown; error?: unknown }) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(result),
    };
  }

  it("boot cache hit (mesmo id): retorna direto sem query", async () => {
    mockGetBootContext.mockResolvedValue({ brand: { id: "b1", name: "Cached" } });
    const res = await fetchBrandById("b1");
    expect(res).toEqual({ id: "b1", name: "Cached" });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockBootMark).toHaveBeenCalledWith("brand:from-cache");
  });

  it("boot cache id diferente: NÃO usa, vai pro Supabase", async () => {
    mockGetBootContext.mockResolvedValue({ brand: { id: "other" } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "public_brands_safe") {
        return makeChain({ data: { id: "b1", name: "From View" }, error: null });
      }
      return makeChain({ data: null, error: null });
    });
    const res = await fetchBrandById("b1");
    expect(res).toEqual({ id: "b1", name: "From View" });
    expect(mockBootMark).toHaveBeenCalledWith("brand:from-public-view");
  });

  it("boot cache throw: cai pra Supabase", async () => {
    mockGetBootContext.mockRejectedValue(new Error("idb fail"));
    mockFrom.mockReturnValue(makeChain({ data: { id: "b1" }, error: null }));
    const res = await fetchBrandById("b1");
    expect(res).toEqual({ id: "b1" });
  });

  it("public_brands_safe sem result: fallback pra brands table", async () => {
    mockGetBootContext.mockResolvedValue(null);
    mockFrom.mockImplementation((table: string) => {
      if (table === "public_brands_safe") return makeChain({ data: null, error: null });
      if (table === "brands") return makeChain({ data: { id: "b1", name: "From Brands" }, error: null });
      return makeChain({ data: null, error: null });
    });
    const res = await fetchBrandById("b1");
    expect(res?.name).toBe("From Brands");
    expect(mockBootMark).toHaveBeenCalledWith("brand:from-brands-table");
  });
});

// ────────────────────────────────────────────────────────
// resolveBrandByDomain
// ────────────────────────────────────────────────────────
describe("resolveBrandByDomain", () => {
  function subChain(result: { data: unknown }) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(result),
    };
  }

  function brandsChain(result: { data: unknown }) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ ...result, error: null }),
    };
  }

  it("hostname desconhecido: retorna null", async () => {
    mockGetBootContext.mockResolvedValue(null);
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_domains") return subChain({ data: null });
      return brandsChain({ data: null });
    });
    const res = await resolveBrandByDomain("desconhecido.com");
    expect(res).toBeNull();
  });

  it("subdomain match: brand_id resolvido + fetch brand", async () => {
    mockGetBootContext.mockResolvedValue(null);
    let domainCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_domains") {
        domainCalls++;
        // primeira chamada = subdomain query → match; segunda = domain query → null
        return domainCalls === 1
          ? subChain({ data: { brand_id: "b1" } })
          : subChain({ data: null });
      }
      if (table === "public_brands_safe") return brandsChain({ data: { id: "b1", name: "Pizza Vale" } });
      return brandsChain({ data: null });
    });
    const res = await resolveBrandByDomain("pizza.valeresgate.com.br");
    expect(res?.id).toBe("b1");
  });

  it("hostname=localhost: skip subdomain query (parts[0]='localhost' está em skip)", async () => {
    mockGetBootContext.mockResolvedValue(null);
    mockFrom.mockImplementation(() => subChain({ data: null }));
    const res = await resolveBrandByDomain("localhost");
    expect(res).toBeNull();
  });

  it("normaliza hostname: remove http://, trailing /, lowercase", async () => {
    mockGetBootContext.mockResolvedValue(null);
    const inCalls: string[][] = [];
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_domains") {
        const c = subChain({ data: null });
        c.in = vi.fn((_col: string, vals: string[]) => {
          inCalls.push(vals);
          return c;
        }) as never;
        return c;
      }
      return brandsChain({ data: null });
    });
    await resolveBrandByDomain("HTTPS://Pizza.Vale.COM/");
    // o domain query foi chamado e recebeu valores normalizados (lowercase, sem trailing/)
    expect(inCalls.flat().some((v) => v.includes("pizza.vale.com"))).toBe(true);
  });
});

// ────────────────────────────────────────────────────────
// findNearestBranch
// ────────────────────────────────────────────────────────
describe("findNearestBranch", () => {
  const SP = { latitude: -23.5505, longitude: -46.6333 };
  const RJ = { latitude: -22.9068, longitude: -43.1729 };
  const BSB = { latitude: -15.7942, longitude: -47.8822 };

  it("branches=[]: retorna null", () => {
    expect(findNearestBranch([], SP)).toBeNull();
  });

  it("user em SP, branches SP+RJ: retorna SP", () => {
    const branches = [
      { id: "rj", latitude: RJ.latitude, longitude: RJ.longitude, name: "Rio" } as never,
      { id: "sp", latitude: SP.latitude, longitude: SP.longitude, name: "São Paulo" } as never,
    ];
    expect(findNearestBranch(branches, SP)?.id).toBe("sp");
  });

  it("user em BSB, branches RJ+SP: SP é a mais perto", () => {
    const branches = [
      { id: "rj", latitude: RJ.latitude, longitude: RJ.longitude } as never,
      { id: "sp", latitude: SP.latitude, longitude: SP.longitude } as never,
    ];
    expect(findNearestBranch(branches, BSB)?.id).toBe("sp");
  });
});

// ────────────────────────────────────────────────────────
// isLocalOrPortalHost
// ────────────────────────────────────────────────────────
describe("isLocalOrPortalHost", () => {
  it("localhost → true", () => {
    expect(isLocalOrPortalHost("localhost")).toBe(true);
  });

  it("lovable.app subdomain → true", () => {
    expect(isLocalOrPortalHost("preview-xyz.lovable.app")).toBe(true);
  });

  it("lovableproject.com → true", () => {
    expect(isLocalOrPortalHost("xpto.lovableproject.com")).toBe(true);
  });

  it("root.* prefix → true (multi-tenant admin)", () => {
    expect(isLocalOrPortalHost("root.valeresgate.com.br")).toBe(true);
  });

  it("app.valeresgate.com.br (portal hostname) → true", () => {
    expect(isLocalOrPortalHost("app.valeresgate.com.br")).toBe(true);
  });

  it("brand domain comum → false", () => {
    expect(isLocalOrPortalHost("pizza.valeresgate.com.br")).toBe(false);
  });
});
