/**
 * dateTz — TZ-aware ISO conversions pra billing mensal + queries de range
 * por data local. Bug aqui = billing event no mês errado às 23h dia 31
 * (UTC vira mês seguinte), report query pega 21-23h do dia anterior.
 */
import { describe, it, expect } from "vitest";
import {
  DEFAULT_TZ,
  todayStartISO,
  todayEndISO,
  dayBoundaryISO,
  yearMonthInTz,
  dateOnlyInTz,
  dateRangeISO,
} from "../dateTz";

describe("DEFAULT_TZ", () => {
  it("é America/Sao_Paulo (UTC-3, sem horário de verão)", () => {
    expect(DEFAULT_TZ).toBe("America/Sao_Paulo");
  });
});

describe("yearMonthInTz", () => {
  it("01/01 00:00 UTC em SP (= 21h dia 31/12 BR): retorna mês anterior", () => {
    // 2026-01-01T00:00Z = 2026-12-31T21:00 em SP (UTC-3)
    const ref = new Date("2026-01-01T00:00:00Z");
    expect(yearMonthInTz(ref, "America/Sao_Paulo")).toBe("2025-12");
  });

  it("31/05 23:00 UTC em SP (= 20h dia 31/05 BR): mês = 05", () => {
    const ref = new Date("2026-05-31T23:00:00Z");
    expect(yearMonthInTz(ref, "America/Sao_Paulo")).toBe("2026-05");
  });

  it("01/06 03:30 UTC = 00:30 BR 01/06: mês = 06", () => {
    const ref = new Date("2026-06-01T03:30:00Z");
    expect(yearMonthInTz(ref, "America/Sao_Paulo")).toBe("2026-06");
  });

  it("UTC tz: dia/mês cru sem offset", () => {
    const ref = new Date("2026-05-31T23:00:00Z");
    expect(yearMonthInTz(ref, "UTC")).toBe("2026-05");
  });
});

describe("dateOnlyInTz", () => {
  it("31/12 23:00 UTC em SP: ainda 31/12 (não vira 01/01)", () => {
    const ref = new Date("2026-12-31T23:00:00Z");
    expect(dateOnlyInTz(ref, "America/Sao_Paulo")).toBe("2026-12-31");
  });

  it("01/06 02:30 UTC em SP (= 23:30 dia 31/05 BR): retorna 31/05", () => {
    const ref = new Date("2026-06-01T02:30:00Z");
    expect(dateOnlyInTz(ref, "America/Sao_Paulo")).toBe("2026-05-31");
  });

  it("01/06 03:30 UTC em SP (= 00:30 BR 01/06): retorna 01/06", () => {
    const ref = new Date("2026-06-01T03:30:00Z");
    expect(dateOnlyInTz(ref, "America/Sao_Paulo")).toBe("2026-06-01");
  });
});

describe("dayBoundaryISO", () => {
  it("start em SP: midnight BR convertida pra UTC = 03:00 do mesmo dia", () => {
    const ref = new Date("2026-05-31T15:00:00Z"); // 12h BR 31/05
    const startISO = dayBoundaryISO(ref, "America/Sao_Paulo", "start");
    expect(startISO).toBe("2026-05-31T03:00:00.000Z");
  });

  it("end em SP: 23:59:59.999 BR = 02:59:59.999 do dia seguinte em UTC", () => {
    const ref = new Date("2026-05-31T15:00:00Z");
    const endISO = dayBoundaryISO(ref, "America/Sao_Paulo", "end");
    expect(endISO).toBe("2026-06-01T02:59:59.999Z");
  });

  it("default boundary é 'start'", () => {
    const ref = new Date("2026-05-31T15:00:00Z");
    expect(dayBoundaryISO(ref, "America/Sao_Paulo")).toBe(
      dayBoundaryISO(ref, "America/Sao_Paulo", "start"),
    );
  });
});

describe("dateRangeISO (HTML inputs type=date)", () => {
  it("range mesmo dia em SP: fromISO=00h BR, toISO=23:59:59 BR (em UTC)", () => {
    const { fromISO, toISO } = dateRangeISO("2026-05-31", "2026-05-31", "America/Sao_Paulo");
    expect(fromISO).toBe("2026-05-31T03:00:00.000Z");
    expect(toISO).toBe("2026-06-01T02:59:59.999Z");
  });

  it("range multi-dia: from < to em UTC", () => {
    const { fromISO, toISO } = dateRangeISO("2026-05-01", "2026-05-31", "America/Sao_Paulo");
    expect(new Date(fromISO).getTime()).toBeLessThan(new Date(toISO).getTime());
    expect(fromISO.startsWith("2026-05-01T03:00")).toBe(true);
    expect(toISO.startsWith("2026-06-01T02:59")).toBe(true);
  });
});

describe("todayStartISO / todayEndISO", () => {
  it("start < end (mesmo dia local)", () => {
    const startISO = todayStartISO();
    const endISO = todayEndISO();
    expect(new Date(startISO).getTime()).toBeLessThan(new Date(endISO).getTime());
  });

  it("usa DEFAULT_TZ por padrão (sem arg)", () => {
    const startISO = todayStartISO();
    const explicitISO = dayBoundaryISO(new Date(startISO), DEFAULT_TZ, "start");
    // ambos devem produzir o mesmo "today start" (modulo cross-second drift)
    expect(Math.abs(new Date(startISO).getTime() - new Date(explicitISO).getTime())).toBeLessThan(2000);
  });
});
