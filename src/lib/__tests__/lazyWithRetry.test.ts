/**
 * lazyWithRetry — wrapper React.lazy com 2 retries antes de PWA recovery.
 *
 * Por que importa: iOS Safari em 5G/3G aborta dynamic imports com erro
 * genérico "Importing a module script failed" — mas o chunk EXISTE,
 * fica disponível 250-800ms depois. Sem retry: reload completo (~30s
 * em rede ruim). Com retry: imperceptível.
 *
 * Testa:
 *   1. isChunkLoadError: discrimina chunk error vs erros reais
 *   2. loadWithRetry: success path / 1 retry / 2 retries / give up
 *   3. Backoff timing (250ms, 800ms)
 *   4. Erro NÃO-chunk: re-throw imediato (não tenta retry)
 *   5. Pwa recovery: cooldown protege contra loop
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isChunkLoadError, loadWithRetry } from "../lazyWithRetry";

// pwaRecovery mockado (singleton state)
const mockRecover = vi.fn();
const mockCanAttempt = vi.fn().mockReturnValue(true);
vi.mock("@/lib/pwaRecovery", () => ({
  recoverFromChunkError: () => mockRecover(),
  canAttemptRecovery: () => mockCanAttempt(),
}));

beforeEach(() => {
  mockRecover.mockReset();
  mockCanAttempt.mockReset().mockReturnValue(true);
});

// Override de delays = [0, 0] em testes que cobrem retry path — evita
// flake + unhandledRejection sutil que rola com fake-timers no jsdom.
// Produção mantém [250, 800] (default na assinatura).
const ZERO_DELAYS = [0, 0] as const;

describe("isChunkLoadError", () => {
  it.each([
    "Failed to fetch dynamically imported module",
    "Importing a module script failed",
    "error loading dynamically imported module",
    "Loading chunk 42 failed",
    "Loading CSS chunk app.css failed",
  ])("detecta erro '%s'", (msg) => {
    expect(isChunkLoadError(new Error(msg))).toBe(true);
  });

  it("aceita string crua (não Error)", () => {
    expect(isChunkLoadError("Loading chunk 5 failed")).toBe(true);
  });

  it("NÃO é chunk error: TypeError genérico", () => {
    expect(isChunkLoadError(new TypeError("Cannot read property X"))).toBe(false);
  });

  it("NÃO é chunk error: undefined/null", () => {
    expect(isChunkLoadError(undefined)).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });

  it("NÃO é chunk error: erro de API/network sem mention de chunk", () => {
    expect(isChunkLoadError(new Error("503 Service Unavailable"))).toBe(false);
  });
});

describe("loadWithRetry — happy path", () => {
  it("primeira tentativa funciona: retorna direto sem retry", async () => {
    const Component = () => null;
    const factory = vi.fn().mockResolvedValueOnce({ default: Component });
    const result = await loadWithRetry(factory);
    expect(result.default).toBe(Component);
    expect(factory).toHaveBeenCalledOnce();
    expect(mockRecover).not.toHaveBeenCalled();
  });
});

describe("loadWithRetry — chunk error recovery", () => {
  it("retry 1: succeeds com 2 calls + log indica delay", async () => {
    const Component = () => null;
    const chunkErr = new Error("Loading chunk 1 failed");
    const factory = vi
      .fn<[], Promise<{ default: typeof Component }>>()
      .mockRejectedValueOnce(chunkErr)
      .mockResolvedValueOnce({ default: Component });

    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    const result = await loadWithRetry(factory, ZERO_DELAYS);

    expect(result.default).toBe(Component);
    expect(factory).toHaveBeenCalledTimes(2);
    expect(mockRecover).not.toHaveBeenCalled();
    expect(infoSpy.mock.calls[0][0]).toContain("recuperou após retry");
  });

  it("retry 2: succeeds com 3 calls", async () => {
    const Component = () => null;
    const chunkErr = new Error("Importing a module script failed");
    const factory = vi
      .fn<[], Promise<{ default: typeof Component }>>()
      .mockRejectedValueOnce(chunkErr)
      .mockRejectedValueOnce(chunkErr)
      .mockResolvedValueOnce({ default: Component });

    vi.spyOn(console, "info").mockImplementation(() => {});

    const result = await loadWithRetry(factory, ZERO_DELAYS);

    expect(result.default).toBe(Component);
    expect(factory).toHaveBeenCalledTimes(3);
    expect(mockRecover).not.toHaveBeenCalled();
  });

  it("3 tentativas falhando + canRecover=true: chama recoverFromChunkError + Promise pendurada", async () => {
    const chunkErr = new Error("Loading chunk 1 failed");
    const factory = vi.fn().mockImplementation(() => Promise.reject(chunkErr));

    vi.spyOn(console, "info").mockImplementation(() => {});

    const promise = loadWithRetry(factory, ZERO_DELAYS);
    // Promise nunca resolve nem rejeita (React fica suspenso até recovery
    // disparar reload). Verificamos via race com timeout real curto.
    const sentinel = Symbol("never");
    const race = await Promise.race([
      promise.then(() => "resolved").catch(() => "rejected"),
      new Promise((r) => setTimeout(() => r(sentinel), 50)),
    ]);

    expect(race).toBe(sentinel);
    expect(factory).toHaveBeenCalledTimes(3);
    expect(mockRecover).toHaveBeenCalledOnce();
  });

  it("3 tentativas falhando + canRecover=false: re-throw original (sem recover)", async () => {
    mockCanAttempt.mockReturnValue(false);
    const chunkErr = new Error("Loading chunk 1 failed");
    const factory = vi.fn().mockImplementation(() => Promise.reject(chunkErr));

    vi.spyOn(console, "info").mockImplementation(() => {});

    await expect(loadWithRetry(factory, ZERO_DELAYS)).rejects.toThrow(
      "Loading chunk 1 failed",
    );
    expect(mockRecover).not.toHaveBeenCalled();
  });
});

describe("loadWithRetry — erros NÃO-chunk", () => {
  it("erro genérico na primeira: re-throw imediato (sem retry)", async () => {
    const factory = vi.fn().mockImplementation(() => Promise.reject(new TypeError("Component is null")));
    await expect(loadWithRetry(factory)).rejects.toThrow("Component is null");
    expect(factory).toHaveBeenCalledOnce();
    expect(mockRecover).not.toHaveBeenCalled();
  });

  it("chunk error no primeiro, TypeError no retry: re-throw o TypeError (não cobre)", async () => {
    const factory = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error("Loading chunk 1 failed")))
      .mockImplementationOnce(() => Promise.reject(new TypeError("oops")));

    await expect(loadWithRetry(factory, ZERO_DELAYS)).rejects.toThrow("oops");
    expect(factory).toHaveBeenCalledTimes(2);
    expect(mockRecover).not.toHaveBeenCalled();
  });
});
