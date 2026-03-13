import { describe, it, expect } from "vitest";
import { contactCreateSchema, campaignCreateSchema } from "../schemas";

describe("contactCreateSchema", () => {
  it("accepts valid contact", () => {
    const result = contactCreateSchema.safeParse({
      brand_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      name: "João",
      email: "joao@test.com",
      source: "MANUAL",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid brand_id", () => {
    const result = contactCreateSchema.safeParse({
      brand_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = contactCreateSchema.safeParse({
      brand_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      email: "bad-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid gender", () => {
    const result = contactCreateSchema.safeParse({
      brand_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      gender: "X",
    });
    expect(result.success).toBe(false);
  });
});

describe("campaignCreateSchema", () => {
  it("accepts valid campaign", () => {
    const result = campaignCreateSchema.safeParse({
      brand_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      title: "Promo Verão",
      channel: "PUSH",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = campaignCreateSchema.safeParse({
      brand_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid channel", () => {
    const result = campaignCreateSchema.safeParse({
      brand_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      title: "Test",
      channel: "SMS",
    });
    expect(result.success).toBe(false);
  });
});
