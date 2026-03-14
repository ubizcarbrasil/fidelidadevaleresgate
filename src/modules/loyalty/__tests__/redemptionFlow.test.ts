/**
 * Service-layer integration test: Redemption flow.
 * Tests the redemptionService logic without UI.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();
const mockIlike = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect.mockReturnThis(),
      insert: mockInsert.mockReturnThis(),
      update: mockUpdate.mockReturnThis(),
      eq: mockEq.mockReturnThis(),
      ilike: mockIlike.mockReturnThis(),
      order: mockOrder.mockReturnThis(),
      range: mockRange.mockReturnThis(),
      limit: mockLimit.mockReturnThis(),
      single: mockSingle,
    })),
  },
}));

import { fetchRedemptions } from "../services/redemptionService";

describe("Redemption Flow — Service Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches redemptions with default pagination", async () => {
    const mockItems = [
      { id: "r1", created_at: "2026-01-01", token: "123456", status: "PENDING", purchase_value: 50, offers: { title: "Oferta 1" }, customers: { name: "João" }, branches: { name: "Centro" } },
      { id: "r2", created_at: "2026-01-02", token: "654321", status: "USED", purchase_value: 100, offers: { title: "Oferta 2" }, customers: { name: "Maria" }, branches: { name: "Shopping" } },
    ];
    mockRange.mockResolvedValueOnce({ data: mockItems, error: null, count: 2 });

    const result = await fetchRedemptions({ brandId: "brand-1" });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.items[0].id).toBe("r1");
  });

  it("applies search filter via ilike", async () => {
    mockRange.mockResolvedValueOnce({ data: [], error: null, count: 0 });

    await fetchRedemptions({ brandId: "brand-1", search: "ABC123" });

    expect(mockIlike).toHaveBeenCalledWith("token", "%ABC123%");
  });

  it("paginates correctly with page and pageSize", async () => {
    mockRange.mockResolvedValueOnce({ data: [], error: null, count: 0 });

    await fetchRedemptions({ brandId: "brand-1", page: 3, pageSize: 10 });

    // page 3 → from = (3-1)*10 = 20, to = 29
    expect(mockRange).toHaveBeenCalledWith(20, 29);
  });

  it("throws on supabase error", async () => {
    mockRange.mockResolvedValueOnce({ data: null, error: { message: "DB error" }, count: 0 });

    await expect(fetchRedemptions({ brandId: "brand-1" })).rejects.toEqual({ message: "DB error" });
  });

  it("returns empty array when no data", async () => {
    mockRange.mockResolvedValueOnce({ data: null, error: null, count: 0 });

    const result = await fetchRedemptions({ brandId: "brand-1" });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
