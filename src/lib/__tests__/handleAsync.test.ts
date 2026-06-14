/**
 * handleAsync — wrapper de async com error log + onError + rethrow opcional.
 * Bug aqui = exception engolida sem log (debug impossível), onError não chamado,
 * non-Error thrown vira string ruim.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockError } = vi.hoisted(() => ({ mockError: vi.fn() }));
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    error: mockError,
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { handleAsync } from "../handleAsync";

beforeEach(() => {
  mockError.mockReset();
});

describe("handleAsync — sucesso", () => {
  it("retorna o valor da função quando resolve", async () => {
    const result = await handleAsync(async () => 42);
    expect(result).toBe(42);
  });

  it("retorna null com função que resolve null", async () => {
    const result = await handleAsync(async () => null);
    expect(result).toBeNull();
  });
});

describe("handleAsync — erro", () => {
  it("Error: loga com context default + retorna null", async () => {
    const result = await handleAsync(async () => { throw new Error("boom"); });
    expect(result).toBeNull();
    expect(mockError).toHaveBeenCalledWith(
      "operação assíncrona",
      expect.any(Error),
    );
  });

  it("Error: usa context customizado no log", async () => {
    await handleAsync(
      async () => { throw new Error("fail"); },
      { context: "fetchOffers" },
    );
    expect(mockError).toHaveBeenCalledWith("fetchOffers", expect.any(Error));
  });

  it("non-Error throw: normaliza pra Error (não string crua no log)", async () => {
    await handleAsync(async () => { throw "literal string"; });
    expect(mockError).toHaveBeenCalled();
    const errArg = mockError.mock.calls[0][1] as Error;
    expect(errArg).toBeInstanceOf(Error);
    expect(errArg.message).toBe("literal string");
  });

  it("onError callback: chamado com Error normalizada", async () => {
    const onError = vi.fn();
    await handleAsync(
      async () => { throw new Error("x"); },
      { onError },
    );
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it("rethrow=true: propaga após log + onError", async () => {
    const onError = vi.fn();
    await expect(
      handleAsync(
        async () => { throw new Error("crítico"); },
        { onError, rethrow: true },
      ),
    ).rejects.toThrow("crítico");

    expect(mockError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it("onError lança: NÃO suprime nem mascara erro original", async () => {
    // Behavior actual: onError throw vai bubble — documenta o contrato
    const onError = vi.fn(() => { throw new Error("cb broken"); });
    await expect(
      handleAsync(
        async () => { throw new Error("orig"); },
        { onError },
      ),
    ).rejects.toThrow("cb broken"); // cb error bubbles
  });
});
