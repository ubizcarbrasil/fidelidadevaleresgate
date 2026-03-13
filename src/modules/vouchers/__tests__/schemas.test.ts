import { describe, it, expect } from "vitest";
import { voucherCreateSchema, voucherToggleSchema } from "../schemas";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("voucherCreateSchema", () => {
  it("accepts valid voucher", () => {
    const result = voucherCreateSchema.safeParse({
      code: "PROMO2026",
      branch_id: UUID,
      brand_id: UUID,
      store_id: UUID,
      type: "PERCENT",
      value: 15,
      expires_at: "2026-12-31T23:59:59.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects lowercase code", () => {
    const result = voucherCreateSchema.safeParse({
      code: "promo123",
      branch_id: UUID,
      brand_id: UUID,
      store_id: UUID,
      type: "FIXED",
      value: 10,
      expires_at: "2026-12-31T23:59:59.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects code with special chars", () => {
    const result = voucherCreateSchema.safeParse({
      code: "AB-CD",
      branch_id: UUID,
      brand_id: UUID,
      store_id: UUID,
      type: "PERCENT",
      value: 5,
      expires_at: "2026-12-31T23:59:59.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative value", () => {
    const result = voucherCreateSchema.safeParse({
      code: "TEST1234",
      branch_id: UUID,
      brand_id: UUID,
      store_id: UUID,
      type: "FIXED",
      value: -5,
      expires_at: "2026-12-31T23:59:59.000Z",
    });
    expect(result.success).toBe(false);
  });
});

describe("voucherToggleSchema", () => {
  it("accepts valid toggle", () => {
    const result = voucherToggleSchema.safeParse({
      id: UUID,
      currentStatus: "ACTIVE",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = voucherToggleSchema.safeParse({
      id: UUID,
      currentStatus: "DELETED",
    });
    expect(result.success).toBe(false);
  });
});
