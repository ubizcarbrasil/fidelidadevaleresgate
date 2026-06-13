/**
 * bootContext — fast-path de boot que dispara `get_boot_context` RPC
 * ANTES de React montar. Contexts (Auth, Brand) consomem o resultado
 * em vez de fazer 5-7 queries paralelas (iOS Safari aborta em 5G).
 *
 * Bug aqui = boot lento. Foi exatamente o sintoma reportado em
 * iPhone PWA ("Carregando aplicativo" 30s). Se a RPC trava sem
 * timeout, app fica preso. Se idempotency quebra, RPC roda 2x
 * desperdiçando network.
 *
 * Testa:
 *   - Idempotency (chamadas múltiplas reusam a mesma promise)
 *   - Hostname extraído de window.location
 *   - brandIdHint forwarded pro RPC
 *   - Sucesso → retorna data
 *   - Erro → retorna null + warn (não throw)
 *   - Timeout 6s → retorna null
 *   - Exception em fetch → retorna null + warn
 *   - getBootContext sem prefetch → null
 *   - resetBootContext limpa singleton
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockRpc = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

vi.mock("@/lib/bootMetrics", () => ({
  bootMark: vi.fn(),
}));

// Re-importa o módulo a cada teste pra resetar bootPromise singleton
async function freshImport() {
  vi.resetModules();
  return import("../bootContext");
}

beforeEach(() => {
  mockRpc.mockReset();
  // Restaura spies (incluindo console.warn) — sem isso, calls vazam entre testes
  vi.restoreAllMocks();
  vi.stubGlobal("window", {
    location: { hostname: "test.example.com" },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("startBootPrefetch", () => {
  it("dispara RPC get_boot_context com hostname + brandIdHint", async () => {
    mockRpc.mockResolvedValueOnce({ data: { user_id: "u1", roles: [] }, error: null });
    const { startBootPrefetch } = await freshImport();
    await startBootPrefetch("brand-X");
    expect(mockRpc).toHaveBeenCalledOnce();
    const [name, args] = mockRpc.mock.calls[0];
    expect(name).toBe("get_boot_context");
    expect(args).toEqual({ p_hostname: "test.example.com", p_brand_id: "brand-X" });
  });

  it("sem brandIdHint: p_brand_id fica undefined", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });
    const { startBootPrefetch } = await freshImport();
    await startBootPrefetch();
    expect(mockRpc.mock.calls[0][1]).toEqual({
      p_hostname: "test.example.com",
      p_brand_id: undefined,
    });
  });

  it("sem window definido: p_hostname undefined (SSR-safe)", async () => {
    vi.stubGlobal("window", undefined);
    mockRpc.mockResolvedValueOnce({ data: null, error: null });
    const { startBootPrefetch } = await freshImport();
    await startBootPrefetch();
    expect(mockRpc.mock.calls[0][1].p_hostname).toBeUndefined();
  });

  it("retorna data da RPC em sucesso", async () => {
    const payload = {
      user_id: "u1",
      brand_id: "b1",
      brand: { id: "b1", name: "Test", slug: "test" },
      roles: [{ id: "r1", role: "brand_admin", tenant_id: null, brand_id: "b1", branch_id: null }],
      profile: null,
      branches: [],
      server_time: "2026-01-01T00:00:00Z",
    };
    mockRpc.mockResolvedValueOnce({ data: payload, error: null });
    const { startBootPrefetch } = await freshImport();
    const result = await startBootPrefetch();
    expect(result).toEqual(payload);
  });

  it("retorna null + warn quando RPC retorna error", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "permission denied" },
    });
    const { startBootPrefetch } = await freshImport();
    const result = await startBootPrefetch();
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0][0]).toContain("RPC falhou");
  });

  it("retorna null + warn quando supabase.rpc lança exceção", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockRpc.mockRejectedValueOnce(new Error("network down"));
    const { startBootPrefetch } = await freshImport();
    const result = await startBootPrefetch();
    expect(result).toBeNull();
    expect(warnSpy.mock.calls[0][0]).toContain("exceção");
  });

  it("idempotente: 2 chamadas paralelas retornam a mesma promise", async () => {
    mockRpc.mockResolvedValueOnce({ data: { x: 1 }, error: null });
    const { startBootPrefetch } = await freshImport();
    const p1 = startBootPrefetch();
    const p2 = startBootPrefetch();
    expect(p1).toBe(p2);
    await Promise.all([p1, p2]);
    expect(mockRpc).toHaveBeenCalledOnce();
  });

  it("idempotente: 2 chamadas sequenciais reusam (RPC roda 1x)", async () => {
    mockRpc.mockResolvedValueOnce({ data: { x: 1 }, error: null });
    const { startBootPrefetch } = await freshImport();
    await startBootPrefetch();
    await startBootPrefetch();
    expect(mockRpc).toHaveBeenCalledOnce();
  });
});

describe("timeout de 6s", () => {
  it("RPC pendurada → resolve null após 6s (não trava boot)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.useFakeTimers();
    // RPC nunca resolve
    mockRpc.mockReturnValue(new Promise(() => {}));
    const { startBootPrefetch } = await freshImport();
    const promise = startBootPrefetch();
    vi.advanceTimersByTime(6000);
    const result = await promise;
    expect(result).toBeNull();
    expect(warnSpy.mock.calls[0][0]).toContain("RPC falhou");
    expect(warnSpy.mock.calls[0][1]).toContain("boot_rpc_timeout_6s");
  });

  it("RPC volta em <6s: usa o resultado, não o timeout", async () => {
    vi.useFakeTimers();
    let resolveRpc!: (v: unknown) => void;
    mockRpc.mockReturnValue(new Promise((r) => { resolveRpc = r; }));
    const { startBootPrefetch } = await freshImport();
    const promise = startBootPrefetch();
    // Avança 5s, ainda dentro da janela
    vi.advanceTimersByTime(5000);
    resolveRpc({ data: { x: 42 }, error: null });
    const result = await promise;
    expect(result).toEqual({ x: 42 });
  });
});

describe("getBootContext", () => {
  it("retorna null se prefetch nunca foi chamado", async () => {
    const { getBootContext } = await freshImport();
    expect(await getBootContext()).toBeNull();
  });

  it("retorna o resultado do prefetch quando já iniciado", async () => {
    mockRpc.mockResolvedValueOnce({ data: { x: "ok" }, error: null });
    const { startBootPrefetch, getBootContext } = await freshImport();
    startBootPrefetch();
    const result = await getBootContext();
    expect(result).toEqual({ x: "ok" });
  });

  it("múltiplos consumers compartilham o mesmo resultado (sem refetch)", async () => {
    mockRpc.mockResolvedValueOnce({ data: { v: 1 }, error: null });
    const { startBootPrefetch, getBootContext } = await freshImport();
    startBootPrefetch();
    const [a, b, c] = await Promise.all([
      getBootContext(),
      getBootContext(),
      getBootContext(),
    ]);
    expect(a).toEqual({ v: 1 });
    expect(b).toEqual({ v: 1 });
    expect(c).toEqual({ v: 1 });
    expect(mockRpc).toHaveBeenCalledOnce();
  });
});

describe("resetBootContext", () => {
  it("após reset, nova chamada dispara RPC novamente", async () => {
    mockRpc
      .mockResolvedValueOnce({ data: { v: 1 }, error: null })
      .mockResolvedValueOnce({ data: { v: 2 }, error: null });
    const { startBootPrefetch, resetBootContext } = await freshImport();
    const first = await startBootPrefetch();
    expect(first).toEqual({ v: 1 });

    resetBootContext();

    const second = await startBootPrefetch();
    expect(second).toEqual({ v: 2 });
    expect(mockRpc).toHaveBeenCalledTimes(2);
  });

  it("após reset, getBootContext volta a retornar null", async () => {
    mockRpc.mockResolvedValueOnce({ data: { v: 1 }, error: null });
    const { startBootPrefetch, getBootContext, resetBootContext } = await freshImport();
    startBootPrefetch();
    expect(await getBootContext()).toEqual({ v: 1 });
    resetBootContext();
    expect(await getBootContext()).toBeNull();
  });
});
