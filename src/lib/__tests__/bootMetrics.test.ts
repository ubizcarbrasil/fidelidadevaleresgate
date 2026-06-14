/**
 * bootMetrics — instrumentação Performance API do boot.
 *
 * Bug aqui = perda do sinal de diagnóstico (não dá pra investigar boots
 * lentos), ou marca duplicada poluindo trace.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  // Reseta singleton (seen Set + BOOT_T0)
  vi.resetModules();
  // restoreAllMocks limpa call history + restaura impl original. Sem isso,
  // vi.spyOn reusa o spy do arquivo todo e calls de testes anteriores
  // contaminam asserts.
  vi.restoreAllMocks();
  vi.spyOn(console, "info").mockImplementation(() => {});
});

async function fresh() {
  return import("../bootMetrics");
}

describe("bootMark", () => {
  it("loga primeira chamada pro nome", async () => {
    const infoSpy = vi.spyOn(console, "info");
    const { bootMark } = await fresh();
    bootMark("test:event");
    expect(infoSpy).toHaveBeenCalled();
    const call = infoSpy.mock.calls[0][0] as string;
    expect(call).toContain("test:event");
    expect(call).toMatch(/\+\d+ms/);
  });

  it("não loga segunda chamada pro mesmo nome (dedupe)", async () => {
    const infoSpy = vi.spyOn(console, "info");
    const { bootMark } = await fresh();
    bootMark("dup");
    bootMark("dup");
    expect(infoSpy).toHaveBeenCalledOnce();
  });

  it("nomes diferentes não dedup", async () => {
    const infoSpy = vi.spyOn(console, "info");
    const { bootMark } = await fresh();
    bootMark("a");
    bootMark("b");
    expect(infoSpy).toHaveBeenCalledTimes(2);
  });

  it("chama performance.mark quando disponível", async () => {
    const markSpy = vi.spyOn(performance, "mark").mockImplementation(() => ({} as PerformanceMark));
    const { bootMark } = await fresh();
    bootMark("perf:event");
    expect(markSpy).toHaveBeenCalledWith("boot:perf:event");
  });

  it("performance.mark lança: bootMark NÃO propaga", async () => {
    vi.spyOn(performance, "mark").mockImplementation(() => {
      throw new Error("mark unavailable");
    });
    const { bootMark } = await fresh();
    expect(() => bootMark("safe")).not.toThrow();
  });
});

describe("getBootElapsed", () => {
  it("retorna número não-negativo", async () => {
    const { getBootElapsed } = await fresh();
    expect(getBootElapsed()).toBeGreaterThanOrEqual(0);
  });

  it("monotônico (delta entre 2 chamadas consecutivas >= 0)", async () => {
    const { getBootElapsed } = await fresh();
    const a = getBootElapsed();
    // Espera 1ms real
    await new Promise((r) => setTimeout(r, 1));
    const b = getBootElapsed();
    expect(b).toBeGreaterThanOrEqual(a);
  });
});
