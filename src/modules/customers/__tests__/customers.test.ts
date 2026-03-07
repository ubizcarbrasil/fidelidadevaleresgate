import { describe, it, expect } from "vitest";
import {
  formatBalance,
  isValidCustomerForm,
  resolveCustomerName,
  EMPTY_CUSTOMER_FORM,
} from "../types";

describe("formatBalance", () => {
  it("formats positive values", () => {
    expect(formatBalance(150.5)).toBe("R$ 150.50");
  });

  it("formats zero", () => {
    expect(formatBalance(0)).toBe("R$ 0.00");
  });

  it("formats integers", () => {
    expect(formatBalance(42)).toBe("R$ 42.00");
  });
});

describe("isValidCustomerForm", () => {
  it("rejects empty form", () => {
    expect(isValidCustomerForm(EMPTY_CUSTOMER_FORM)).toBe(false);
  });

  it("rejects missing brand", () => {
    expect(isValidCustomerForm({ name: "Test", phone: "", brand_id: "", branch_id: "b1" })).toBe(false);
  });

  it("rejects missing branch", () => {
    expect(isValidCustomerForm({ name: "Test", phone: "", brand_id: "b1", branch_id: "" })).toBe(false);
  });

  it("rejects whitespace-only name", () => {
    expect(isValidCustomerForm({ name: "   ", phone: "", brand_id: "b1", branch_id: "b2" })).toBe(false);
  });

  it("accepts valid form", () => {
    expect(isValidCustomerForm({ name: "João", phone: "", brand_id: "b1", branch_id: "b2" })).toBe(true);
  });
});

describe("resolveCustomerName", () => {
  it("uses full name when available", () => {
    expect(resolveCustomerName("Maria Silva", "maria@test.com")).toBe("Maria Silva");
  });

  it("falls back to email prefix", () => {
    expect(resolveCustomerName(null, "joao@example.com")).toBe("joao");
  });

  it("falls back to Cliente", () => {
    expect(resolveCustomerName(null, null)).toBe("Cliente");
  });

  it("trims whitespace names", () => {
    expect(resolveCustomerName("  ", "a@b.com")).toBe("a");
  });
});
