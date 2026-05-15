/**
 * Tests for eventBus and queryKeys.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { eventBus } from "@/lib/eventBus";
import { queryKeys } from "@/lib/queryKeys";

describe("eventBus", () => {
  beforeEach(() => {
    eventBus.clear();
  });

  it("should emit and receive events", async () => {
    const handler = vi.fn();
    eventBus.on("EARNING_CREATED", handler);

    eventBus.emit("EARNING_CREATED", {
      brandId: "b1",
      customerId: "c1",
      points: 100,
      eventId: "e1",
    });

    // Wait for microtask
    await new Promise((r) => setTimeout(r, 10));

    expect(handler).toHaveBeenCalledWith({
      brandId: "b1",
      customerId: "c1",
      points: 100,
      eventId: "e1",
    });
  });

  it("should unsubscribe correctly", async () => {
    const handler = vi.fn();
    const unsub = eventBus.on("VOUCHER_CREATED", handler);
    unsub();

    eventBus.emit("VOUCHER_CREATED", { brandId: "b1", code: "ABC" });
    await new Promise((r) => setTimeout(r, 10));

    expect(handler).not.toHaveBeenCalled();
  });

  it("should handle errors in handlers without crashing", async () => {
    const badHandler = vi.fn(() => { throw new Error("boom"); });
    const goodHandler = vi.fn();

    eventBus.on("CUSTOMER_CREATED", badHandler);
    eventBus.on("CUSTOMER_CREATED", goodHandler);

    eventBus.emit("CUSTOMER_CREATED", { brandId: "b1", customerId: "c1" });
    await new Promise((r) => setTimeout(r, 10));

    expect(badHandler).toHaveBeenCalled();
    expect(goodHandler).toHaveBeenCalled();
  });
});

describe("queryKeys", () => {
  it("should generate scoped keys", () => {
    expect(queryKeys.crm.contacts.all).toEqual(["crm-contacts"]);
    expect(queryKeys.crm.contacts.list("brand-1")).toEqual(["crm-contacts", "list", "brand-1"]);
    expect(queryKeys.crm.contacts.detail("c1")).toEqual(["crm-contacts", "detail", "c1"]);
  });

  it("should have separate namespaces per module", () => {
    expect(queryKeys.vouchers.all[0]).not.toBe(queryKeys.customers.all[0]);
    expect(queryKeys.loyalty.earnings.all[0]).toBe("loyalty-earnings");
  });

  it("should expose the extended CRM entries used by hooks/pages", () => {
    expect(queryKeys.crm.contactEvents.all).toEqual(["crm-contact-events"]);
    expect(queryKeys.crm.contactStats.all).toEqual(["crm-contact-stats"]);
    expect(queryKeys.crm.eventStats.all).toEqual(["crm-event-stats"]);
    expect(queryKeys.crm.audiencesSelect.all).toEqual(["crm-audiences-select"]);
    expect(queryKeys.crm.tierDistribution.all).toEqual(["crm-tier-distribution"]);
  });

  it("should expose stable cache keys for the brand entries consumed in pages/hooks", () => {
    expect(queryKeys.brands.all).toEqual(["brands"]);
    expect(queryKeys.brandsSelect.list("b1")).toEqual(["brands-select", "list", "b1"]);
    expect(queryKeys.brandTrial.list("b1")).toEqual(["brand-trial-status", "list", "b1"]);
    expect(queryKeys.brandScoringModels.list("b1")).toEqual(["brand-scoring-models", "list", "b1"]);
    expect(queryKeys.brandModulesActive.list("b1")).toEqual(["brand-modules-active", "list", "b1"]);
    expect(queryKeys.brandModules.list("b1")).toEqual(["brand-modules", "list", "b1"]);
    expect(queryKeys.brandSettings.list("b1")).toEqual(["brand-settings", "list", "b1"]);
    expect(queryKeys.brandDetail.all).toEqual(["brand-detail"]);
    expect(queryKeys.brandTeam.list("b1")).toEqual(["brand-team", "list", "b1"]);
  });

  it("should expose the stores entries consumed in pages/components", () => {
    expect(queryKeys.stores.all).toEqual(["stores"]);
    expect(queryKeys.storesSelect.list("b1")).toEqual(["stores-select", "list", "b1"]);
    expect(queryKeys.storesPendingCount.list("b1")).toEqual(["stores-pending-count", "list", "b1"]);
    expect(queryKeys.storesForEarning.list("b1", "br1")).toEqual(["stores-for-earning", "list", "b1", "br1"]);
  });
});
