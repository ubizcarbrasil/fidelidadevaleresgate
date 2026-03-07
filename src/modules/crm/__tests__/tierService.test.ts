import { describe, it, expect } from "vitest";
import { classifyContactTier } from "../services/tierService";
import { DEFAULT_TIERS } from "../types";
import type { TierConfig } from "../types";

const tiers: TierConfig[] = DEFAULT_TIERS.map((t, i) => ({ ...t, id: `t-${i}` }));

describe("classifyContactTier", () => {
  it("classifies 0 events as Iniciante", () => {
    const result = classifyContactTier(0, tiers);
    expect(result?.name).toBe("Iniciante");
  });

  it("classifies 1 event as Bronze", () => {
    const result = classifyContactTier(1, tiers);
    expect(result?.name).toBe("Bronze");
  });

  it("classifies 10 events as Bronze", () => {
    const result = classifyContactTier(10, tiers);
    expect(result?.name).toBe("Bronze");
  });

  it("classifies 11 events as Prata", () => {
    const result = classifyContactTier(11, tiers);
    expect(result?.name).toBe("Prata");
  });

  it("classifies 30 events as Prata", () => {
    const result = classifyContactTier(30, tiers);
    expect(result?.name).toBe("Prata");
  });

  it("classifies 31 events as Ouro", () => {
    const result = classifyContactTier(31, tiers);
    expect(result?.name).toBe("Ouro");
  });

  it("classifies 50 events as Ouro", () => {
    const result = classifyContactTier(50, tiers);
    expect(result?.name).toBe("Ouro");
  });

  it("classifies 51 events as Diamante", () => {
    const result = classifyContactTier(51, tiers);
    expect(result?.name).toBe("Diamante");
  });

  it("classifies 100 events as Diamante", () => {
    const result = classifyContactTier(100, tiers);
    expect(result?.name).toBe("Diamante");
  });

  it("classifies 101 events as Lendário", () => {
    const result = classifyContactTier(101, tiers);
    expect(result?.name).toBe("Lendário");
  });

  it("classifies 500 events as Galático", () => {
    const result = classifyContactTier(500, tiers);
    expect(result?.name).toBe("Galático");
  });

  it("classifies 9999 events as Galático", () => {
    const result = classifyContactTier(9999, tiers);
    expect(result?.name).toBe("Galático");
  });

  it("returns null for empty tiers array", () => {
    const result = classifyContactTier(5, []);
    expect(result).toBeNull();
  });
});
