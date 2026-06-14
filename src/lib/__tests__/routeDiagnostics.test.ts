/**
 * routeDiagnostics — telemetria in-memory por rota crítica.
 *
 * Bug aqui = perda de sinal pra diagnosticar boots travados ("/motorista/
 * campeonato fica em branco" sem console error).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "table").mockImplementation(() => {});
});

async function fresh() {
  return import("../routeDiagnostics");
}

describe("trackStage / getRouteEvents", () => {
  it("registra evento com ts + route + stage + status + detail", async () => {
    const { trackStage, getRouteEvents } = await fresh();
    trackStage("/r", "auth", "ok", "user=u1");
    const all = getRouteEvents();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      route: "/r",
      stage: "auth",
      status: "ok",
      detail: "user=u1",
    });
    expect(typeof all[0].ts).toBe("number");
  });

  it("detail é opcional", async () => {
    const { trackStage, getRouteEvents } = await fresh();
    trackStage("/x", "render", "start");
    expect(getRouteEvents()[0].detail).toBeUndefined();
  });

  it("getRouteEvents filtra por route", async () => {
    const { trackStage, getRouteEvents } = await fresh();
    trackStage("/a", "s", "ok");
    trackStage("/b", "s", "ok");
    expect(getRouteEvents("/a").map((e) => e.route)).toEqual(["/a"]);
    expect(getRouteEvents("/b").map((e) => e.route)).toEqual(["/b"]);
  });

  it("getRouteEvents sem arg retorna TODOS (cópia, não referência)", async () => {
    const { trackStage, getRouteEvents } = await fresh();
    trackStage("/a", "s", "ok");
    const a = getRouteEvents();
    a.push({} as never);
    const b = getRouteEvents();
    expect(b).toHaveLength(1); // mutação no array retornado não afeta interno
  });

  it("status='error' usa console.error com tag + detail", async () => {
    const errSpy = vi.spyOn(console, "error");
    const { trackStage } = await fresh();
    trackStage("/r", "loader", "error", "fetch 500");
    expect(errSpy).toHaveBeenCalledWith("[route:/r] loader=error", "fetch 500");
  });

  it("ring buffer evicta após 100 eventos (FIFO)", async () => {
    const { trackStage, getRouteEvents } = await fresh();
    for (let i = 0; i < 110; i++) trackStage("/r", `s-${i}`, "ok");
    const all = getRouteEvents();
    expect(all).toHaveLength(100);
    expect(all[0].stage).toBe("s-10"); // shift removeu 0..9
    expect(all[99].stage).toBe("s-109");
  });
});

describe("printRouteReport", () => {
  it("sem eventos: loga 'sem eventos registrados', retorna []", async () => {
    const infoSpy = vi.spyOn(console, "info");
    const { printRouteReport } = await fresh();
    const r = printRouteReport();
    expect(r).toEqual([]);
    expect(infoSpy.mock.calls[0][0]).toContain("sem eventos");
  });

  it("com eventos: chama console.table com colunas +ms/route/stage/status/detail", async () => {
    const tableSpy = vi.spyOn(console, "table");
    const { trackStage, printRouteReport } = await fresh();
    trackStage("/r", "auth", "ok");
    trackStage("/r", "render", "ok", "ok");
    const result = printRouteReport("/r");
    expect(result).toHaveLength(2);
    expect(tableSpy).toHaveBeenCalledOnce();
    const rows = tableSpy.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows[0]).toHaveProperty("+ms");
    expect(rows[0]).toHaveProperty("route");
    expect(rows[0]).toHaveProperty("stage");
    expect(rows[0]).toHaveProperty("status");
  });

  it("+ms é relativo ao primeiro evento (delta)", async () => {
    const tableSpy = vi.spyOn(console, "table");
    const { trackStage, printRouteReport } = await fresh();
    trackStage("/r", "a", "ok");
    // Avança ts simulando passagem de tempo
    await new Promise((r) => setTimeout(r, 5));
    trackStage("/r", "b", "ok");
    printRouteReport("/r");
    const rows = tableSpy.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows[0]["+ms"]).toBe(0);
    expect(rows[1]["+ms"] as number).toBeGreaterThanOrEqual(0);
  });
});

describe("installRouteDiagnostics", () => {
  it("expoẽ __routeReport + __routeEvents em window", async () => {
    const { installRouteDiagnostics, trackStage } = await fresh();
    installRouteDiagnostics();
    trackStage("/x", "s", "ok");
    const w = window as unknown as Record<string, (route?: string) => unknown[]>;
    expect(typeof w.__routeReport).toBe("function");
    expect(typeof w.__routeEvents).toBe("function");
    const events = w.__routeEvents();
    expect(events).toHaveLength(1);
  });
});
