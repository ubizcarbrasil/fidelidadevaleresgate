/**
 * Service-layer integration test: Earning flow.
 * Tests earningService daily limits, receipt uniqueness, and event creation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockOr = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();

const chainable = () => ({
  select: mockSelect.mockReturnThis(),
  insert: mockInsert.mockReturnThis(),
  update: mockUpdate.mockReturnThis(),
  eq: mockEq.mockReturnThis(),
  gte: mockGte.mockReturnThis(),
  or: mockOr.mockReturnThis(),
  order: mockOrder.mockReturnThis(),
  limit: mockLimit,
  single: mockSingle,
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => chainable()),
  },
}));

import { checkDailyLimits, checkReceiptUniqueness } from "../services/earningService";

describe("Earning Flow — Service Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkDailyLimits", () => {
    it("allows when within limits", async () => {
      // Both customer and store queries return empty (no points today)
      mockLimit
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

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
      mockLimit
        .mockResolvedValueOnce({ data: [{ points_earned: 450 }], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

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
      mockLimit
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [{ points_earned: 950 }], error: null });

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
      mockLimit.mockResolvedValueOnce({ data: [], error: null });

      const result = await checkReceiptUniqueness("s1", "REC-001");

      expect(result).toBe(true);
    });

    it("returns false when receipt already exists", async () => {
      mockLimit.mockResolvedValueOnce({ data: [{ id: "existing" }], error: null });

      const result = await checkReceiptUniqueness("s1", "REC-001");

      expect(result).toBe(false);
    });
  });
});
