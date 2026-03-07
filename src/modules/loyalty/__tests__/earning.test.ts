import { describe, it, expect } from "vitest";
import { calculateEarning, clampStorePointsPerReal } from "../types";

const baseRule = {
  rule_type: "PER_REAL" as const,
  points_per_real: 1,
  money_per_point: 0.01,
  min_purchase_to_earn: 10,
  max_points_per_purchase: 500,
};

describe("calculateEarning", () => {
  it("calculates PER_REAL correctly", () => {
    const result = calculateEarning(100, baseRule);
    expect(result.points).toBe(100);
    expect(result.money).toBe(1);
    expect(result.error).toBeNull();
  });

  it("respects max_points_per_purchase", () => {
    const result = calculateEarning(1000, baseRule);
    expect(result.points).toBe(500);
    expect(result.money).toBe(5);
  });

  it("returns error for below minimum purchase", () => {
    const result = calculateEarning(5, baseRule);
    expect(result.points).toBe(0);
    expect(result.error).toContain("Compra mínima");
  });

  it("returns error for zero value", () => {
    const result = calculateEarning(0, baseRule);
    expect(result.error).toContain("positivo");
  });

  it("returns error for negative value", () => {
    const result = calculateEarning(-10, baseRule);
    expect(result.error).toContain("positivo");
  });

  it("calculates FIXED correctly", () => {
    const rule = { ...baseRule, rule_type: "FIXED" as const, points_per_real: 50 };
    const result = calculateEarning(100, rule);
    expect(result.points).toBe(50);
  });

  it("uses effectivePointsPerReal when provided", () => {
    const result = calculateEarning(100, baseRule, 2);
    expect(result.points).toBe(200);
  });

  it("floors fractional points", () => {
    const result = calculateEarning(15.5, { ...baseRule, points_per_real: 1.3 });
    expect(result.points).toBe(20); // floor(15.5 * 1.3) = floor(20.15) = 20
  });

  it("handles min_purchase_to_earn of 0", () => {
    const rule = { ...baseRule, min_purchase_to_earn: 0 };
    const result = calculateEarning(1, rule);
    expect(result.points).toBe(1);
    expect(result.error).toBeNull();
  });
});

describe("clampStorePointsPerReal", () => {
  it("clamps value within range", () => {
    expect(clampStorePointsPerReal(2, 1, 3)).toBe(2);
  });

  it("clamps below min", () => {
    expect(clampStorePointsPerReal(0.5, 1, 3)).toBe(1);
  });

  it("clamps above max", () => {
    expect(clampStorePointsPerReal(5, 1, 3)).toBe(3);
  });

  it("returns exact min when equal", () => {
    expect(clampStorePointsPerReal(1, 1, 3)).toBe(1);
  });

  it("returns exact max when equal", () => {
    expect(clampStorePointsPerReal(3, 1, 3)).toBe(3);
  });
});
