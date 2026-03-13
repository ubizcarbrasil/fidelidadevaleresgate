import { describe, it, expect } from "vitest";
import { translateError } from "../translateError";

describe("translateError", () => {
  it("returns translation for exact match", () => {
    expect(translateError("User already registered")).toBe("Este e-mail já está cadastrado");
  });

  it("returns translation for partial match (case-insensitive)", () => {
    expect(translateError("Something: email rate limit exceeded here")).toBe(
      "Muitas tentativas. Aguarde um momento"
    );
  });

  it("returns original message when no match found", () => {
    expect(translateError("Some unknown error xyz")).toBe("Some unknown error xyz");
  });

  it("returns fallback for empty string", () => {
    expect(translateError("")).toBe("Ocorreu um erro inesperado");
  });

  it("returns fallback for null/undefined", () => {
    expect(translateError(null as any)).toBe("Ocorreu um erro inesperado");
    expect(translateError(undefined as any)).toBe("Ocorreu um erro inesperado");
  });

  it("handles all known error keys", () => {
    const knownMessages = [
      "Invalid login credentials",
      "Email not confirmed",
      "Token has expired or is invalid",
      "User not found",
      "Password should be at least 6 characters",
      "Signup requires a valid password",
      "new row violates row-level security policy",
      "Unable to validate email address: invalid format",
      "A user with this email address has already been registered",
    ];
    for (const msg of knownMessages) {
      const result = translateError(msg);
      expect(result).not.toBe(msg); // should be translated
      expect(result.length).toBeGreaterThan(0);
    }
  });
});
