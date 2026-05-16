/**
 * Relatório de erros/estágios por rota.
 *
 * Cada rota crítica chama `trackStage(route, stage, status, detail?)` em
 * pontos-chave (auth, brand, driver, loader, render). Os eventos ficam em
 * memória e podem ser inspecionados via `window.__routeReport()` no console
 * — útil para descobrir rapidamente em qual provider/loader uma rota
 * (ex.: /motorista/campeonato) está travando ou falhando.
 */

export type RouteStageStatus = "start" | "ok" | "error" | "skip";

export interface RouteStageEvent {
  ts: number;
  route: string;
  stage: string;
  status: RouteStageStatus;
  detail?: string;
}

const MAX_EVENTS = 100;
const events: RouteStageEvent[] = [];

function pushEvent(ev: RouteStageEvent) {
  events.push(ev);
  if (events.length > MAX_EVENTS) events.shift();
}

export function trackStage(
  route: string,
  stage: string,
  status: RouteStageStatus,
  detail?: string,
) {
  const ev: RouteStageEvent = { ts: Date.now(), route, stage, status, detail };
  pushEvent(ev);
  const tag = `[route:${route}] ${stage}=${status}`;
  if (status === "error") {
    console.error(tag, detail ?? "");
  } else if (import.meta.env?.DEV) {
    console.info(tag, detail ?? "");
  }
}

export function getRouteEvents(route?: string): RouteStageEvent[] {
  return route ? events.filter((e) => e.route === route) : events.slice();
}

export function printRouteReport(route?: string): RouteStageEvent[] {
  const list = getRouteEvents(route);
  if (list.length === 0) {
    console.info("[routeReport] sem eventos registrados", route ? `para ${route}` : "");
    return list;
  }
  const t0 = list[0].ts;
  // eslint-disable-next-line no-console
  console.table(
    list.map((e) => ({
      "+ms": e.ts - t0,
      route: e.route,
      stage: e.stage,
      status: e.status,
      detail: e.detail ?? "",
    })),
  );
  return list;
}

export function installRouteDiagnostics() {
  if (typeof window === "undefined") return;
  (window as any).__routeReport = printRouteReport;
  (window as any).__routeEvents = getRouteEvents;
}
