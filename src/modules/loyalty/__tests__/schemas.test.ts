import { describe, it, expect } from "vitest";
import { earningRequestSchema, ledgerEntrySchema } from "../schemas";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("earningRequestSchema", () => {
  it("accepts valid earning request", () => {
    const result = earningRequestSchema.safeParse({
      brand_id: UUID,
      branch_id: UUID,
      store_id: UUID,
      customer_id: UUID,
      purchase_value: 49.9,
      source: "PDV",
      created_by_user_id: UUID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero purchase_value", () => {
    const result = earningRequestSchema.safeParse({
      brand_id: UUID,
      branch_id: UUID,
      store_id: UUID,
      customer_id: UUID,
      purchase_value: 0,
      created_by_user_id: UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative purchase_value", () => {
    const result = earningRequestSchema.safeParse({
      brand_id: UUID,
      branch_id: UUID,
      store_id: UUID,
      customer_id: UUID,
      purchase_value: -10,
      created_by_user_id: UUID,
    });
    expect(result.success).toBe(false);
  });
});

describe("ledgerEntrySchema", () => {
  it("accepts valid CREDIT entry", () => {
    const result = ledgerEntrySchema.safeParse({
      brand_id: UUID,
      branch_id: UUID,
      customer_id: UUID,
      entry_type: "CREDIT",
      points_amount: 100,
      money_amount: 10,
      reason: "Compra registrada",
      created_by_user_id: UUID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid entry_type", () => {
    const result = ledgerEntrySchema.safeParse({
      brand_id: UUID,
      branch_id: UUID,
      customer_id: UUID,
      entry_type: "TRANSFER",
      points_amount: 50,
      money_amount: 5,
      reason: "Teste",
      created_by_user_id: UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty reason", () => {
    const result = ledgerEntrySchema.safeParse({
      brand_id: UUID,
      branch_id: UUID,
      customer_id: UUID,
      entry_type: "DEBIT",
      points_amount: 10,
      money_amount: 1,
      reason: "",
      created_by_user_id: UUID,
    });
    expect(result.success).toBe(false);
  });
});
