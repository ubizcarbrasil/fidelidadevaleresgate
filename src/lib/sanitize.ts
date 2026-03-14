/**
 * Input sanitization utilities for XSS prevention and input validation.
 */

/** Strip HTML tags from input to prevent XSS */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").replace(/[<>]/g, "");
}

/** Sanitize string input: trim, enforce maxLength, strip HTML */
export function sanitizeText(input: string, maxLength = 500): string {
  if (!input) return "";
  return stripHtml(input.trim().slice(0, maxLength));
}

/** Sanitize URL input: validate protocol, enforce maxLength */
export function sanitizeUrl(input: string, maxLength = 2048): string {
  if (!input) return "";
  const trimmed = input.trim().slice(0, maxLength);
  try {
    const url = new URL(trimmed);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

/** Sanitize phone: keep only digits and + */
export function sanitizePhone(input: string, maxLength = 20): string {
  if (!input) return "";
  return input.replace(/[^\d+\-() ]/g, "").trim().slice(0, maxLength);
}

/** Sanitize email: lowercase, trim, max length */
export function sanitizeEmail(input: string, maxLength = 255): string {
  if (!input) return "";
  return input.trim().toLowerCase().slice(0, maxLength);
}

/** Max lengths for common fields */
export const MAX_LENGTHS = {
  name: 150,
  email: 255,
  phone: 20,
  description: 2000,
  code: 16,
  title: 200,
  address: 500,
  url: 2048,
  password: 128,
  cnpj: 18,
  message: 5000,
} as const;
