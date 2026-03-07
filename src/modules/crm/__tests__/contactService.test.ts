/**
 * Integration tests for CRM Contact Service.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Create a proper chainable mock
function createChainMock(resolveValue: any = { data: [], error: null, count: 0 }) {
  const mock: any = new Proxy({}, {
    get(_target, prop) {
      if (prop === "then") {
        return (resolve: any) => resolve(resolveValue);
      }
      if (prop === "catch" || prop === "finally") {
        return () => mock;
      }
      // Any method call returns the mock itself for chaining
      if (!mock[`_${String(prop)}`]) {
        mock[`_${String(prop)}`] = vi.fn().mockReturnValue(mock);
      }
      return mock[`_${String(prop)}`];
    },
  });
  return mock;
}

let currentMock: any;

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => currentMock),
  },
}));

import { fetchContacts, fetchContactStats } from "../services/contactService";

describe("contactService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchContacts", () => {
    it("should return contacts with count", async () => {
      currentMock = createChainMock({
        data: [{ id: "c1", name: "João" }],
        error: null,
        count: 1,
      });

      const res = await fetchContacts("brand-1", { page: 0, pageSize: 50 });

      expect(res.contacts).toHaveLength(1);
      expect(res.total).toBe(1);
    });

    it("should handle search filter", async () => {
      currentMock = createChainMock({ data: [], error: null, count: 0 });

      const res = await fetchContacts("brand-1", { search: "test" });

      expect(res.contacts).toHaveLength(0);
    });

    it("should throw on supabase error", async () => {
      currentMock = createChainMock({ data: null, error: { message: "DB error" }, count: 0 });

      await expect(fetchContacts("brand-1")).rejects.toBeDefined();
    });
  });

  describe("fetchContactStats", () => {
    it("should aggregate stats correctly", async () => {
      currentMock = createChainMock({
        data: [
          { source: "MOBILITY_APP", gender: "M", os_platform: "iOS" },
          { source: "MOBILITY_APP", gender: "F", os_platform: "Android" },
          { source: "LOYALTY", gender: "M", os_platform: "iOS" },
        ],
        error: null,
      });

      const stats = await fetchContactStats("brand-1");

      expect(stats.total).toBe(3);
      expect(stats.bySource["MOBILITY_APP"]).toBe(2);
      expect(stats.bySource["LOYALTY"]).toBe(1);
      expect(stats.byGender["M"]).toBe(2);
      expect(stats.byOS["iOS"]).toBe(2);
    });
  });
});
