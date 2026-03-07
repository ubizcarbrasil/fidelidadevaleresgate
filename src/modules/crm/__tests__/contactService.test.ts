/**
 * Integration tests for CRM Contact Service.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase before importing the service
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockLimit = vi.fn();
const mockOr = vi.fn();

const chainBuilder = {
  select: mockSelect,
  eq: mockEq,
  or: mockOr,
  order: mockOrder,
  range: mockRange,
  limit: mockLimit,
};

// Each chain method returns the builder for chaining
Object.values(chainBuilder).forEach((fn) => fn.mockReturnValue(chainBuilder));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => chainBuilder),
  },
}));

import { fetchContacts, fetchContactStats } from "../services/contactService";

describe("contactService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(chainBuilder).forEach((fn) => fn.mockReturnValue(chainBuilder));
  });

  describe("fetchContacts", () => {
    it("should apply brand filter and pagination", async () => {
      // Simulate resolved promise
      const result = { data: [{ id: "c1", name: "João" }], error: null, count: 1 };
      mockRange.mockResolvedValueOnce(result);

      const res = await fetchContacts("brand-1", { page: 0, pageSize: 50 });

      expect(res.contacts).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(mockEq).toHaveBeenCalledWith("brand_id", "brand-1");
    });

    it("should apply search filter when provided", async () => {
      const result = { data: [], error: null, count: 0 };
      mockRange.mockResolvedValueOnce(result);

      await fetchContacts("brand-1", { search: "test" });

      expect(mockOr).toHaveBeenCalled();
    });

    it("should throw on supabase error", async () => {
      mockRange.mockResolvedValueOnce({ data: null, error: { message: "DB error" }, count: 0 });

      await expect(fetchContacts("brand-1")).rejects.toBeDefined();
    });
  });

  describe("fetchContactStats", () => {
    it("should aggregate stats by source, gender, and OS", async () => {
      const mockContacts = [
        { source: "MOBILITY_APP", gender: "M", os_platform: "iOS" },
        { source: "MOBILITY_APP", gender: "F", os_platform: "Android" },
        { source: "LOYALTY", gender: "M", os_platform: "iOS" },
      ];

      // fetchContactStats doesn't use range, it terminates at the last eq
      mockEq.mockResolvedValueOnce({ data: mockContacts, error: null });

      const stats = await fetchContactStats("brand-1");

      expect(stats.total).toBe(3);
      expect(stats.bySource["MOBILITY_APP"]).toBe(2);
      expect(stats.bySource["LOYALTY"]).toBe(1);
      expect(stats.byGender["M"]).toBe(2);
      expect(stats.byOS["iOS"]).toBe(2);
    });
  });
});
