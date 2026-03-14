/**
 * Service-layer integration test: Earning flow.
 * Tests earningService daily limits, receipt uniqueness.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

let fromCallCount = 0;
const mockResults: Array<{ data: unknown[]; error: null }> = [];

function createChainable(idx: number) {
  const result = () => Promise.resolve(mockResults[idx] ?? { data: [], error: null });
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    // gte is the terminal call in checkDailyLimits chains
    gte: vi.fn(() => Promise.resolve(mockResults[idx] ?? { data: [], error: null })),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    // limit is terminal for checkReceiptUniqueness
    limit: vi.fn(() => Promise.resolve(mockResults[idx] ?? { data: [], error: null })),
  };
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => {
      const idx = fromCallCount++;
      return createChainable(idx);
    }),
  },
}));

import { checkDailyLimits, checkReceiptUniqueness } from "../services/earningService";

describe("Earning Flow — Service Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromCallCount = 0;
    mockResults.length = 0;
  });

  describe("checkDailyLimits", () => {
    it("allows when within limits", async () => {
      mockResults.push(
        { data: [], error: null },
        { data: [], error: null },
      );

      const result = await checkDailyLimits({
        customerId: "c1",
        storeId: "s1",
        pointsToAdd: 100,
        maxCustomerDay: 500,
        maxStoreDay: 1000,
      });

      expect(result.allowed).toBe(true);
    });

    it("blocks when customer daily limit exceeded", async () => {
      mockResults.push(
        { data: [{ points_earned: 450 }], error: null },
        { data: [], error: null },
      );

      const result = await checkDailyLimits({
        customerId: "c1",
        storeId: "s1",
        pointsToAdd: 100,
        maxCustomerDay: 500,
        maxStoreDay: 1000,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("cliente");
    });

    it("blocks when store daily limit exceeded", async () => {
      mockResults.push(
        { data: [], error: null },
        { data: [{ points_earned: 950 }], error: null },
      );

      const result = await checkDailyLimits({
        customerId: "c1",
        storeId: "s1",
        pointsToAdd: 100,
        maxCustomerDay: 500,
        maxStoreDay: 1000,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("parceiro");
    });
  });

  describe("checkReceiptUniqueness", () => {
    it("returns true when receipt is unique", async () => {
      mockResults.push({ data: [], error: null });
      const result = await checkReceiptUniqueness("s1", "REC-001");
      expect(result).toBe(true);
    });

    it("returns false when receipt already exists", async () => {
      mockResults.push({ data: [{ id: "existing" }], error: null });
      const result = await checkReceiptUniqueness("s1", "REC-001");
      expect(result).toBe(false);
    });
  });
});
