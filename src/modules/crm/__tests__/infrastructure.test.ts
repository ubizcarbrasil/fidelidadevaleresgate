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
});
