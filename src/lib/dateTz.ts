/**
 * Helpers de data com timezone explícito.
 *
 * MOTIVO (auditoria de BI): código usava `new Date().toISOString()` que
 * converte hora LOCAL pra UTC, causando bugs em billing e limits diários:
 *
 *   - Brasil = UTC-3
 *   - 23h Brasil = 02h UTC do dia seguinte
 *   - `new Date().toISOString().slice(0,7)` em 31/05 23h → "2026-06" ❌
 *   - Billing event registrado no mês errado
 *   - Daily limit query .gte("created_at", todayISO) pega dia errado
 *
 * Default timezone: "America/Sao_Paulo" (UTC-3, sem horário de verão).
 * Pode ser sobrescrito por branch.timezone ou store.timezone quando
 * sistema operar em outros fusos.
 */

export const DEFAULT_TZ = "America/Sao_Paulo";

/**
 * Retorna timestamp ISO UTC representando início do dia LOCAL na timezone
 * indicada. Use em queries `.gte("created_at", todayStartISO(tz))`.
 *
 * Ex: chamada às 14h Brasil em 31/05 com tz="America/Sao_Paulo":
 *   → "2026-05-31T03:00:00.000Z" (= 00h Brasil em 31/05)
 *
 * Sem isso, `new Date().setHours(0,0,0,0).toISOString()` retornaria
 * "2026-05-31T00:00:00Z" (= 21h dia anterior Brasil) — query pega
 * eventos do dia errado.
 */
export function todayStartISO(tz: string = DEFAULT_TZ): string {
  return dayBoundaryISO(new Date(), tz, "start");
}

export function todayEndISO(tz: string = DEFAULT_TZ): string {
  return dayBoundaryISO(new Date(), tz, "end");
}

/**
 * Retorna ISO UTC do início ou fim do dia (em timezone) pra um Date qualquer.
 */
export function dayBoundaryISO(
  ref: Date,
  tz: string = DEFAULT_TZ,
  boundary: "start" | "end" = "start",
): string {
  // Obtém componentes Y/M/D na timezone alvo
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ref);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";

  // Monta string ISO local + offset da timezone alvo
  const offset = tzOffsetISO(ref, tz);
  const time = boundary === "start" ? "00:00:00.000" : "23:59:59.999";
  // Constrói data como se fosse local na tz e converte pra UTC
  const localIso = `${y}-${m}-${d}T${time}${offset}`;
  return new Date(localIso).toISOString();
}

/**
 * Retorna "YYYY-MM" (ano-mês) na timezone indicada. Use pra billing
 * mensal (ganhaGanhaBilling) em vez de `new Date().toISOString().slice(0,7)`
 * que computa em UTC.
 *
 * Ex: chamada em 31/05 23:30 Brasil:
 *   - ANTES: "2026-06" (UTC já virou 02:30 de 01/06) ❌
 *   - AGORA: "2026-05" ✓
 */
export function yearMonthInTz(ref: Date = new Date(), tz: string = DEFAULT_TZ): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(ref);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${y}-${m}`;
}

/**
 * Retorna "YYYY-MM-DD" na timezone indicada.
 */
export function dateOnlyInTz(ref: Date = new Date(), tz: string = DEFAULT_TZ): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ref);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

/**
 * Pra inputs HTML type="date" (que retornam "YYYY-MM-DD") — converte
 * um intervalo de datas (from/to inclusivos) em ISO UTC respeitando TZ.
 *
 * Usar em ReportsPage e filtros similares:
 *   const { fromISO, toISO } = dateRangeISO(dateFrom, dateTo);
 *   .gte("created_at", fromISO).lte("created_at", toISO)
 *
 * ANTES (bug):
 *   const from = new Date(dateFrom);  // "2026-05-31" → 00:00 UTC (= 21h BR dia 30)
 *   from.setHours(0,0,0,0);
 *   from.toISOString();  // "2026-05-31T00:00Z" → query pega 21h-23h do dia 30!
 *
 * AGORA: respeita TZ Brasil — "2026-05-31" vira "2026-05-31T03:00Z" (= 00h BR 31).
 */
export function dateRangeISO(
  dateFrom: string,
  dateTo: string,
  tz: string = DEFAULT_TZ,
): { fromISO: string; toISO: string } {
  // dateFrom/dateTo são "YYYY-MM-DD". Adiciona hora "00:00" e "23:59:59.999"
  // como se fossem na TZ alvo.
  const offset = tzOffsetISO(new Date(), tz);
  const fromISO = new Date(`${dateFrom}T00:00:00.000${offset}`).toISOString();
  const toISO = new Date(`${dateTo}T23:59:59.999${offset}`).toISOString();
  return { fromISO, toISO };
}

/**
 * Helper interno: retorna offset da timezone (ex: "-03:00") pra um Date.
 * Funciona sem libs externas (date-fns-tz), usando Intl.
 */
function tzOffsetISO(ref: Date, tz: string): string {
  // Trick: formata o mesmo instante em UTC e na tz alvo, diferença = offset
  const utcDate = new Date(ref.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(ref.toLocaleString("en-US", { timeZone: tz }));
  const offsetMin = (tzDate.getTime() - utcDate.getTime()) / 60000;
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}
