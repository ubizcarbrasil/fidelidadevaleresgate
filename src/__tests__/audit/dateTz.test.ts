import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  DEFAULT_TZ,
  todayStartISO,
  todayEndISO,
  dayBoundaryISO,
  yearMonthInTz,
  dateOnlyInTz,
  dateRangeISO,
} from "@/lib/dateTz";

// F1 — timezone helpers (Brasil UTC-3, sem horário de verão).
// Audita o fix do bug em billing/limits que usava new Date().toISOString().

describe("F1 — dateTz", () => {
  describe("DEFAULT_TZ", () => {
    it("default é America/Sao_Paulo (UTC-3)", () => {
      expect(DEFAULT_TZ).toBe("America/Sao_Paulo");
    });
  });

  describe("yearMonthInTz", () => {
    it("retorna mês corrente em formato YYYY-MM", () => {
      const result = yearMonthInTz(new Date("2026-05-15T12:00:00Z"));
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });

    it("31/05 23:30 Brasil retorna 2026-05 (não 2026-06 do UTC)", () => {
      // 31/05 23:30 BR = 01/06 02:30 UTC. Bug antigo retornaria "2026-06".
      const brMidnight = new Date("2026-06-01T02:30:00.000Z");
      expect(yearMonthInTz(brMidnight, "America/Sao_Paulo")).toBe("2026-05");
    });

    it("01/06 03:30 Brasil já retorna 2026-06", () => {
      const brAfterMidnight = new Date("2026-06-01T06:30:00.000Z");
      expect(yearMonthInTz(brAfterMidnight, "America/Sao_Paulo")).toBe("2026-06");
    });

    it("respeita timezone explícita Tóquio (UTC+9)", () => {
      // 01/06 00:00 UTC = 09:00 Tóquio
      const utc = new Date("2026-06-01T00:00:00.000Z");
      expect(yearMonthInTz(utc, "Asia/Tokyo")).toBe("2026-06");
      // 31/05 16:00 UTC = 01/06 01:00 Tóquio → ainda junho
      const utcLate = new Date("2026-05-31T16:00:00.000Z");
      expect(yearMonthInTz(utcLate, "Asia/Tokyo")).toBe("2026-06");
    });
  });

  describe("dateOnlyInTz", () => {
    it("retorna YYYY-MM-DD na timezone Brasil", () => {
      // 31/05 23:00 BR = 01/06 02:00 UTC
      const brNight = new Date("2026-06-01T02:00:00.000Z");
      expect(dateOnlyInTz(brNight, "America/Sao_Paulo")).toBe("2026-05-31");
    });
  });

  describe("dayBoundaryISO", () => {
    it("start retorna ISO < end pra mesmo dia", () => {
      const ref = new Date("2026-05-15T12:00:00Z");
      const start = dayBoundaryISO(ref, "America/Sao_Paulo", "start");
      const end = dayBoundaryISO(ref, "America/Sao_Paulo", "end");
      expect(start < end).toBe(true);
    });

    it("start é 03:00 UTC (= 00:00 Brasil)", () => {
      const ref = new Date("2026-05-15T18:00:00Z"); // 15h BR
      const start = dayBoundaryISO(ref, "America/Sao_Paulo", "start");
      expect(start).toContain("2026-05-15T03:00:00");
    });
  });

  describe("todayStartISO / todayEndISO", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("todayStartISO retorna 03:00 UTC (= 00:00 BR) do dia corrente", () => {
      vi.setSystemTime(new Date("2026-05-15T18:00:00Z")); // 15h BR
      const start = todayStartISO();
      expect(start).toContain("2026-05-15T03:00:00");
    });

    it("todayEndISO retorna 02:59:59 UTC do dia seguinte (= 23:59 BR)", () => {
      vi.setSystemTime(new Date("2026-05-15T18:00:00Z"));
      const end = todayEndISO();
      expect(end).toContain("2026-05-16T02:59:59");
    });

    it("23h BR Brasil ainda conta como dia corrente, não dia seguinte", () => {
      // 15/05 23:30 BR = 16/05 02:30 UTC. Bug antigo trataria como 16/05.
      vi.setSystemTime(new Date("2026-05-16T02:30:00Z"));
      const start = todayStartISO();
      // Início do dia BR = 15/05 03:00 UTC
      expect(start).toContain("2026-05-15T03:00:00");
    });
  });

  describe("dateRangeISO", () => {
    it("converte range de input HTML date pra ISO UTC respeitando TZ Brasil", () => {
      const { fromISO, toISO } = dateRangeISO("2026-05-01", "2026-05-31");
      // "2026-05-01" no input = 01/05 00:00 BR = 01/05 03:00 UTC
      expect(fromISO).toContain("2026-05-01T03:00:00");
      // "2026-05-31" fim = 31/05 23:59:59 BR = 01/06 02:59:59 UTC
      expect(toISO).toContain("2026-06-01T02:59:59");
    });

    it("from < to", () => {
      const { fromISO, toISO } = dateRangeISO("2026-05-01", "2026-05-31");
      expect(fromISO < toISO).toBe(true);
    });
  });
});
