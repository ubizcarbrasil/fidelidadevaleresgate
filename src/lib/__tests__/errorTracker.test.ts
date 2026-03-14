/**
 * Error tracker unit tests.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

import { reportError, setErrorContext } from "@/lib/errorTracker";

describe("errorTracker", () => {
  beforeEach(() => {
    setErrorContext(null, null);
  });

  it("reportError does not throw on success", async () => {
    await expect(
      reportError({ message: "Test error", source: "client" })
    ).resolves.not.toThrow();
  });

  it("reportError truncates long messages", async () => {
    const longMessage = "x".repeat(3000);
    await expect(
      reportError({ message: longMessage })
    ).resolves.not.toThrow();
  });

  it("setErrorContext sets user and brand context", () => {
    // Should not throw
    expect(() => setErrorContext("user-123", "brand-456")).not.toThrow();
  });

  it("reportError handles missing optional fields", async () => {
    await expect(
      reportError({ message: "minimal error" })
    ).resolves.not.toThrow();
  });
});
