import { describe, it, expect } from "vitest";
import {
  formatBRL,
  formatBRLOrNull,
  formatCPF,
  formatCPFDisplay,
  isCPFFormatValid,
  formatPhone,
} from "../formatters";

describe("formatBRL", () => {
  it("formats positive value with comma decimal + R$ prefix", () => {
    expect(formatBRL(99.9)).toMatch(/R\$\s*99,90/);
  });
  it("formats zero as R$ 0,00", () => {
    expect(formatBRL(0)).toMatch(/R\$\s*0,00/);
  });
  it("treats null/undefined as zero", () => {
    expect(formatBRL(null)).toMatch(/R\$\s*0,00/);
    expect(formatBRL(undefined)).toMatch(/R\$\s*0,00/);
  });
  it("treats NaN as zero", () => {
    expect(formatBRL(NaN)).toMatch(/R\$\s*0,00/);
  });
  it("formats thousands with separator", () => {
    expect(formatBRL(1234.56)).toMatch(/R\$\s*1\.234,56/);
  });
  it("handles negative values", () => {
    // Intl: "-R$ 50,00"; fallback: "R$ -50,00". Aceita ambos.
    expect(formatBRL(-50)).toMatch(/-/);
    expect(formatBRL(-50)).toMatch(/50,00/);
  });
});

describe("formatBRLOrNull", () => {
  it("returns formatted string for positive", () => {
    expect(formatBRLOrNull(15.5)).toMatch(/R\$\s*15,50/);
  });
  it("returns null for zero", () => {
    expect(formatBRLOrNull(0)).toBeNull();
  });
  it("returns null for negative", () => {
    expect(formatBRLOrNull(-1)).toBeNull();
  });
  it("returns null for null/undefined", () => {
    expect(formatBRLOrNull(null)).toBeNull();
    expect(formatBRLOrNull(undefined)).toBeNull();
  });
});

describe("formatCPF", () => {
  it("returns empty for empty input", () => {
    expect(formatCPF("")).toBe("");
  });
  it("formats progressively (1-3 digits)", () => {
    expect(formatCPF("1")).toBe("1");
    expect(formatCPF("123")).toBe("123");
  });
  it("inserts first dot after 3 digits (4-6 digits)", () => {
    expect(formatCPF("1234")).toBe("123.4");
    expect(formatCPF("123456")).toBe("123.456");
  });
  it("inserts second dot after 6 digits (7-9 digits)", () => {
    expect(formatCPF("1234567")).toBe("123.456.7");
    expect(formatCPF("123456789")).toBe("123.456.789");
  });
  it("inserts dash after 9 digits (10-11 digits)", () => {
    expect(formatCPF("1234567891")).toBe("123.456.789-1");
    expect(formatCPF("12345678910")).toBe("123.456.789-10");
  });
  it("strips non-digits", () => {
    expect(formatCPF("123.456.789-10")).toBe("123.456.789-10");
    expect(formatCPF("abc12def345")).toBe("123.45");
  });
  it("caps at 11 digits", () => {
    expect(formatCPF("12345678910999")).toBe("123.456.789-10");
  });
});

describe("formatCPFDisplay", () => {
  it("returns fallback for empty/null/undefined", () => {
    expect(formatCPFDisplay("")).toBe("—");
    expect(formatCPFDisplay(null)).toBe("—");
    expect(formatCPFDisplay(undefined)).toBe("—");
  });
  it("uses custom fallback", () => {
    expect(formatCPFDisplay(null, "N/A")).toBe("N/A");
  });
  it("treats whitespace-only as empty", () => {
    expect(formatCPFDisplay("   ")).toBe("—");
  });
  it("formats valid CPF", () => {
    expect(formatCPFDisplay("12345678910")).toBe("123.456.789-10");
  });
});

describe("isCPFFormatValid", () => {
  it("accepts 11 digits", () => {
    expect(isCPFFormatValid("12345678910")).toBe(true);
    expect(isCPFFormatValid("123.456.789-10")).toBe(true);
  });
  it("rejects fewer digits", () => {
    expect(isCPFFormatValid("12345")).toBe(false);
    expect(isCPFFormatValid("")).toBe(false);
  });
  it("rejects more than 11 digits", () => {
    expect(isCPFFormatValid("123456789101")).toBe(false);
  });
  it("does NOT validate check digits", () => {
    // Sanity: any 11 digits should pass format check
    expect(isCPFFormatValid("00000000000")).toBe(true);
    expect(isCPFFormatValid("99999999999")).toBe(true);
  });
});

describe("formatPhone", () => {
  it("returns empty for empty input", () => {
    expect(formatPhone("")).toBe("");
  });
  it("formats 1 digit as (1", () => {
    expect(formatPhone("1")).toBe("(1");
  });
  it("formats 2 digits as (11", () => {
    expect(formatPhone("11")).toBe("(11");
  });
  it("inserts ) after DDD (3-6 digits)", () => {
    expect(formatPhone("113")).toBe("(11) 3");
    expect(formatPhone("113333")).toBe("(11) 3333");
  });
  it("formats landline 10 digits", () => {
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
  });
  it("formats mobile 11 digits with 9", () => {
    expect(formatPhone("11999998888")).toBe("(11) 99999-8888");
  });
  it("strips non-digits", () => {
    expect(formatPhone("(11) 99999-8888")).toBe("(11) 99999-8888");
  });
  it("caps at 11 digits", () => {
    expect(formatPhone("119999988880000")).toBe("(11) 99999-8888");
  });
});
