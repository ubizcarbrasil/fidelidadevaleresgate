import { describe, it, expect } from "vitest";
import { DEFAULT_TIERS, CRM_EVENT_TYPES, CRM_SOURCES, CHANNEL_CONFIG } from "../types";

describe("CRM Types & Constants", () => {
  it("has 7 default tiers in correct order", () => {
    expect(DEFAULT_TIERS).toHaveLength(7);
    expect(DEFAULT_TIERS[0].name).toBe("Galático");
    expect(DEFAULT_TIERS[6].name).toBe("Iniciante");
  });

  it("tiers have non-overlapping ranges", () => {
    const sorted = [...DEFAULT_TIERS].sort((a, b) => b.min_events - a.min_events);
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (current.max_events !== null && next.max_events !== null) {
        expect(current.min_events).toBeGreaterThan(next.max_events);
      }
    }
  });

  it("has all expected mobility event types", () => {
    expect(CRM_EVENT_TYPES.RIDE_COMPLETED).toBe("RIDE_COMPLETED");
    expect(CRM_EVENT_TYPES.RIDE_CANCELLED_PASSENGER).toBe("RIDE_CANCELLED_PASSENGER");
    expect(CRM_EVENT_TYPES.USER_REGISTERED).toBe("USER_REGISTERED");
  });

  it("has all expected sources", () => {
    expect(Object.keys(CRM_SOURCES)).toEqual(["MOBILITY_APP", "LOYALTY", "STORE_UPLOAD", "MANUAL"]);
  });

  it("channel costs are correct", () => {
    expect(CHANNEL_CONFIG.WHATSAPP.cost).toBe(0.50);
    expect(CHANNEL_CONFIG.PUSH.cost).toBe(0.03);
    expect(CHANNEL_CONFIG.EMAIL.cost).toBe(0.03);
    expect(CHANNEL_CONFIG.IN_APP.cost).toBe(0.01);
  });
});
