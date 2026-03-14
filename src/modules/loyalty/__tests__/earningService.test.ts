/**
 * Earning Service unit tests.
 * Tests calculateEarning, clampStorePointsPerReal, and service functions.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateEarning, clampStorePointsPerReal } from "../types";

describe("calculateEarning", () => {
  const baseRule = {
    rule_type: "PER_REAL" as const,
    points_per_real: 10,
    min_purchase_to_earn: 5,
    max_points_per_purchase: 1000,
    money_per_point: 0.01,
  };

  it("calculates points correctly for PER_REAL rule", () => {
    const result = calculateEarning(100, baseRule);
    expect(result.points).toBe(1000);
    expect(result.money).toBe(10);
    expect(result.error).toBeNull();
  });

  it("returns 0 points for negative purchase value", () => {
    const result = calculateEarning(-10, baseRule);
    expect(result.points).toBe(0);
    expect(result.error).toBe("Valor de compra deve ser positivo");
  });

  it("returns 0 points for zero purchase value", () => {
    const result = calculateEarning(0, baseRule);
    expect(result.points).toBe(0);
    expect(result.error).toBe("Valor de compra deve ser positivo");
  });

  it("returns error when below min_purchase_to_earn", () => {
    const result = calculateEarning(3, baseRule);
    expect(result.points).toBe(0);
    expect(result.error).toContain("Compra mínima");
  });

  it("clamps points at max_points_per_purchase", () => {
    const result = calculateEarning(200, { ...baseRule, max_points_per_purchase: 500 });
    expect(result.points).toBe(500);
  });

  it("uses effectivePointsPerReal when provided", () => {
    const result = calculateEarning(100, baseRule, 5);
    expect(result.points).toBe(500);
  });

  it("handles FIXED rule type", () => {
    const fixedRule = { ...baseRule, rule_type: "FIXED" as const, points_per_real: 50 };
    const result = calculateEarning(100, fixedRule);
    expect(result.points).toBe(50);
  });

  it("floors fractional points", () => {
    const result = calculateEarning(10.5, { ...baseRule, points_per_real: 3 });
    expect(result.points).toBe(31); // floor(10.5 * 3)
  });

  it("calculates money correctly", () => {
    const result = calculateEarning(50, { ...baseRule, money_per_point: 0.05 });
    expect(result.money).toBe(25); // 500 points * 0.05
  });
});

describe("clampStorePointsPerReal", () => {
  it("clamps value within range", () => {
    expect(clampStorePointsPerReal(5, 1, 10)).toBe(5);
  });

  it("clamps to min when below", () => {
    expect(clampStorePointsPerReal(0, 1, 10)).toBe(1);
  });

  it("clamps to max when above", () => {
    expect(clampStorePointsPerReal(15, 1, 10)).toBe(10);
  });

  it("handles equal min/max", () => {
    expect(clampStorePointsPerReal(5, 5, 5)).toBe(5);
  });
});
