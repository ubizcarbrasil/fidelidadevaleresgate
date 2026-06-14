/**
 * logger — logging centralizado com ring buffer, métricas e alertas.
 *
 * Bug aqui:
 *   - Logs perdidos (debug em prod silenciado por engano)
 *   - Métricas erradas (errorCount/warnCount inflados ou subcontados)
 *   - Alert callback cascade (erro no callback derruba o log)
 *   - Ring buffer overflow não evicta (memory leak)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  // Silencia console pra não poluir output
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "debug").mockImplementation(() => {});
  localStorage.clear();
});

async function fresh() {
  return import("../logger");
}

// ── Nível mínimo de log ──────────────────────────────────
describe("LOG_LEVEL via localStorage", () => {
  it("LOG_LEVEL=error: só error passa", async () => {
    localStorage.setItem("LOG_LEVEL", "error");
    const { createLogger, getRecentLogs } = await fresh();
    const log = createLogger("mod");
    log.info("i");
    log.warn("w");
    log.error("e");
    expect(getRecentLogs().map((l) => l.level)).toEqual(["error"]);
  });

  it("LOG_LEVEL inválido: ignora, usa default", async () => {
    localStorage.setItem("LOG_LEVEL", "INVALID_LEVEL");
    const { createLogger, getRecentLogs } = await fresh();
    const log = createLogger("mod");
    log.warn("w");
    log.error("e");
    // Default em DEV (env de teste) é debug → tudo passa
    expect(getRecentLogs().length).toBeGreaterThan(0);
  });
});

// ── log.debug/info/warn/error ────────────────────────────
describe("log methods + ring buffer", () => {
  beforeEach(() => {
    localStorage.setItem("LOG_LEVEL", "debug");
  });

  it("log inclui timestamp ISO + module + level + message + data", async () => {
    const { createLogger, getRecentLogs } = await fresh();
    const log = createLogger("crm");
    log.info("Created", { id: "c1" });
    const entry = getRecentLogs("crm").pop();
    expect(entry).toBeDefined();
    expect(entry!.timestamp).toMatch(/^\d{4}-/);
    expect(entry!.module).toBe("crm");
    expect(entry!.level).toBe("info");
    expect(entry!.message).toBe("Created");
    expect(entry!.data).toEqual({ id: "c1" });
  });

  it("getRecentLogs filtra por module", async () => {
    const { createLogger, getRecentLogs } = await fresh();
    createLogger("a").info("x");
    createLogger("b").info("y");
    expect(getRecentLogs("a").map((l) => l.message)).toEqual(["x"]);
    expect(getRecentLogs("b").map((l) => l.message)).toEqual(["y"]);
  });

  it("getRecentLogs filtra por level (limite inferior)", async () => {
    const { createLogger, getRecentLogs } = await fresh();
    const log = createLogger("m");
    log.debug("d");
    log.warn("w");
    log.error("e");
    // level="warn" → warn + error (não debug)
    expect(
      getRecentLogs(undefined, "warn").map((l) => l.level),
    ).toEqual(["warn", "error"]);
  });

  it("ring buffer evicta após 200 entradas (FIFO)", async () => {
    const { createLogger, getRecentLogs } = await fresh();
    const log = createLogger("m");
    for (let i = 0; i < 220; i++) log.info(`msg-${i}`);
    const logs = getRecentLogs("m");
    expect(logs.length).toBe(200);
    // Primeiro item é msg-20 (shift removeu 0..19)
    expect(logs[0].message).toBe("msg-20");
    expect(logs[199].message).toBe("msg-219");
  });

  it("console.error chamado pra log.error", async () => {
    const spy = vi.spyOn(console, "error");
    const { createLogger } = await fresh();
    createLogger("m").error("boom", { err: 1 });
    expect(spy).toHaveBeenCalledWith("[m]", "boom", { err: 1 });
  });

  it("console.info usado pra info (não console.log)", async () => {
    const spy = vi.spyOn(console, "info");
    const { createLogger } = await fresh();
    createLogger("m").info("hi");
    expect(spy).toHaveBeenCalled();
  });
});

// ── Métricas ─────────────────────────────────────────────
describe("getAllMetrics", () => {
  beforeEach(() => {
    localStorage.setItem("LOG_LEVEL", "debug");
  });

  it("conta errors + warns por module", async () => {
    const { createLogger, getAllMetrics } = await fresh();
    const a = createLogger("mod-a");
    a.error("x");
    a.error("y");
    a.warn("w");
    const m = getAllMetrics();
    expect(m["mod-a"].errorCount).toBe(2);
    expect(m["mod-a"].warnCount).toBe(1);
  });

  it("info NÃO incrementa contador de error/warn", async () => {
    const { createLogger, getAllMetrics } = await fresh();
    createLogger("m").info("ok");
    const m = getAllMetrics();
    expect(m["m"]?.errorCount ?? 0).toBe(0);
    expect(m["m"]?.warnCount ?? 0).toBe(0);
  });

  it("módulos separados não compartilham contadores", async () => {
    const { createLogger, getAllMetrics } = await fresh();
    createLogger("a").error("x");
    createLogger("b").error("y");
    const m = getAllMetrics();
    expect(m["a"].errorCount).toBe(1);
    expect(m["b"].errorCount).toBe(1);
  });
});

// ── time / timeEnd ───────────────────────────────────────
describe("log.time / log.timeEnd", () => {
  beforeEach(() => {
    localStorage.setItem("LOG_LEVEL", "debug");
  });

  it("timeEnd registra duração em métricas (totalMs + count)", async () => {
    const { createLogger, getAllMetrics } = await fresh();
    const log = createLogger("m");
    log.time("fetch");
    // Aguarda um tick real pra ter duração > 0
    await new Promise((r) => setTimeout(r, 1));
    log.timeEnd("fetch");
    const m = getAllMetrics();
    expect(m["m"].timers.fetch.count).toBe(1);
    expect(m["m"].timers.fetch.totalMs).toBeGreaterThan(0);
  });

  it("timeEnd sem time prévio: warn + no-op", async () => {
    const { createLogger } = await fresh();
    const log = createLogger("m");
    const warnSpy = vi.spyOn(console, "warn");
    log.timeEnd("never-started");
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0][1]).toContain("not found");
  });

  it("múltiplos time/timeEnd do mesmo label somam totalMs e count", async () => {
    const { createLogger, getAllMetrics } = await fresh();
    const log = createLogger("m");
    log.time("t");
    await new Promise((r) => setTimeout(r, 1));
    log.timeEnd("t");
    log.time("t");
    await new Promise((r) => setTimeout(r, 1));
    log.timeEnd("t");
    expect(getAllMetrics()["m"].timers.t.count).toBe(2);
  });
});

// ── Alert callback ───────────────────────────────────────
describe("setAlertCallback", () => {
  beforeEach(() => {
    localStorage.setItem("LOG_LEVEL", "debug");
  });

  it("error dispara callback registrado", async () => {
    const { createLogger, setAlertCallback } = await fresh();
    const cb = vi.fn();
    setAlertCallback(cb);
    createLogger("m").error("oops", { code: 1 });
    expect(cb).toHaveBeenCalledOnce();
    expect(cb.mock.calls[0][0]).toMatchObject({ level: "error", message: "oops" });
  });

  it("warn/info NÃO disparam callback", async () => {
    const { createLogger, setAlertCallback } = await fresh();
    const cb = vi.fn();
    setAlertCallback(cb);
    createLogger("m").warn("w");
    createLogger("m").info("i");
    expect(cb).not.toHaveBeenCalled();
  });

  it("callback que lança NÃO derruba o log (cascata-proof)", async () => {
    const { createLogger, setAlertCallback, getRecentLogs } = await fresh();
    setAlertCallback(() => { throw new Error("cb broken"); });
    createLogger("m").error("e");
    // Log foi gravado no buffer mesmo com cb quebrado
    expect(getRecentLogs("m").length).toBe(1);
  });

  it("setAlertCallback(null) desativa", async () => {
    const { createLogger, setAlertCallback } = await fresh();
    const cb = vi.fn();
    setAlertCallback(cb);
    setAlertCallback(null);
    createLogger("m").error("e");
    expect(cb).not.toHaveBeenCalled();
  });
});
