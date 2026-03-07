import { describe, it, expect } from "vitest";
import {
  generateVoucherCode,
  isValidCode,
  calculateDiscount,
  isVoucherActive,
  STATUS_LABELS,
} from "../types";

describe("generateVoucherCode", () => {
  it("generates code with default length of 8", () => {
    const code = generateVoucherCode();
    expect(code).toHaveLength(8);
    expect(isValidCode(code)).toBe(true);
  });

  it("generates code with custom length", () => {
    expect(generateVoucherCode(4)).toHaveLength(4);
    expect(generateVoucherCode(16)).toHaveLength(16);
  });

  it("contains only allowed characters", () => {
    const code = generateVoucherCode();
    expect(code).toMatch(/^[A-Z0-9]+$/);
    // No ambiguous chars (O, 0, I, 1)
    expect(code).not.toMatch(/[OI01]/);
  });
});

describe("isValidCode", () => {
  it("accepts valid codes", () => {
    expect(isValidCode("ABCD")).toBe(true);
    expect(isValidCode("ABCDEFGH12345678")).toBe(true);
  });

  it("rejects too short", () => {
    expect(isValidCode("ABC")).toBe(false);
  });

  it("rejects too long", () => {
    expect(isValidCode("A".repeat(17))).toBe(false);
  });

  it("rejects lowercase", () => {
    expect(isValidCode("abcd")).toBe(false);
  });

  it("rejects special chars", () => {
    expect(isValidCode("AB-CD")).toBe(false);
  });
});

describe("calculateDiscount", () => {
  it("calculates percent discount", () => {
    expect(calculateDiscount(100, "PERCENT", 10, 0)).toBe(10);
    expect(calculateDiscount(200, "PERCENT", 25, 0)).toBe(50);
  });

  it("clamps percent to 100", () => {
    expect(calculateDiscount(100, "PERCENT", 150, 0)).toBe(100);
  });

  it("calculates fixed discount", () => {
    expect(calculateDiscount(100, "FIXED", 0, 15)).toBe(15);
  });

  it("caps fixed discount at purchase value", () => {
    expect(calculateDiscount(10, "FIXED", 0, 50)).toBe(10);
  });

  it("returns 0 for non-positive purchase", () => {
    expect(calculateDiscount(0, "PERCENT", 10, 0)).toBe(0);
    expect(calculateDiscount(-5, "FIXED", 0, 10)).toBe(0);
  });
});

describe("isVoucherActive", () => {
  const now = new Date("2026-03-07T12:00:00Z");

  it("returns true for active voucher within dates", () => {
    expect(isVoucherActive("ACTIVE", "2026-03-01T00:00:00Z", "2026-03-31T00:00:00Z", now)).toBe(true);
  });

  it("returns false for inactive status", () => {
    expect(isVoucherActive("INACTIVE", null, null, now)).toBe(false);
  });

  it("returns false if not started yet", () => {
    expect(isVoucherActive("ACTIVE", "2026-04-01T00:00:00Z", null, now)).toBe(false);
  });

  it("returns false if expired", () => {
    expect(isVoucherActive("ACTIVE", null, "2026-03-01T00:00:00Z", now)).toBe(false);
  });

  it("returns true with no dates", () => {
    expect(isVoucherActive("ACTIVE", null, null, now)).toBe(true);
  });
});

describe("STATUS_LABELS", () => {
  it("has all required statuses", () => {
    expect(STATUS_LABELS).toHaveProperty("ACTIVE");
    expect(STATUS_LABELS).toHaveProperty("EXPIRED");
    expect(STATUS_LABELS).toHaveProperty("INACTIVE");
  });
});
