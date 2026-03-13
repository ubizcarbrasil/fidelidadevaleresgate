import { describe, it, expect } from "vitest";
import { stripHtml, sanitizeText, sanitizeUrl, sanitizePhone, sanitizeEmail, MAX_LENGTHS } from "../sanitize";

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<script>alert('xss')</script>Hello")).toBe("alert('xss')Hello");
  });
  it("removes angle brackets", () => {
    expect(stripHtml("a < b > c")).toBe("a  b  c");
  });
  it("handles empty string", () => {
    expect(stripHtml("")).toBe("");
  });
});

describe("sanitizeText", () => {
  it("trims and limits length", () => {
    const long = "a".repeat(1000);
    expect(sanitizeText(long, 100).length).toBe(100);
  });
  it("strips HTML", () => {
    expect(sanitizeText("<b>bold</b>")).toBe("bold");
  });
  it("handles empty/falsy", () => {
    expect(sanitizeText("")).toBe("");
  });
});

describe("sanitizeUrl", () => {
  it("accepts valid https URL", () => {
    expect(sanitizeUrl("https://example.com/path")).toBe("https://example.com/path");
  });
  it("rejects javascript: protocol", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
  });
  it("rejects invalid URL", () => {
    expect(sanitizeUrl("not a url")).toBe("");
  });
  it("rejects data: protocol", () => {
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("");
  });
});

describe("sanitizePhone", () => {
  it("keeps digits and formatting chars", () => {
    expect(sanitizePhone("+55 (11) 99999-9999")).toBe("+55 (11) 99999-9999");
  });
  it("strips letters and special chars", () => {
    expect(sanitizePhone("abc123!@#")).toBe("123");
  });
});

describe("sanitizeEmail", () => {
  it("lowercases and trims", () => {
    expect(sanitizeEmail("  User@Example.COM  ")).toBe("user@example.com");
  });
  it("enforces max length", () => {
    const long = "a".repeat(300) + "@test.com";
    expect(sanitizeEmail(long).length).toBeLessThanOrEqual(255);
  });
});

describe("MAX_LENGTHS", () => {
  it("has expected keys", () => {
    expect(MAX_LENGTHS.name).toBe(150);
    expect(MAX_LENGTHS.email).toBe(255);
    expect(MAX_LENGTHS.password).toBe(128);
  });
});
