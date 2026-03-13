import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();
const mockIlike = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockEq = vi.fn();

const chainBuilder: any = {
  select: mockSelect,
  ilike: mockIlike,
  order: mockOrder,
  range: mockRange,
  eq: mockEq,
};

Object.values(chainBuilder).forEach((fn: any) => fn.mockReturnValue(chainBuilder));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => chainBuilder),
  },
}));

import { fetchRedemptions } from "../services/redemptionService";

describe("redemptionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(chainBuilder).forEach((fn: any) => fn.mockReturnValue(chainBuilder));
  });

  it("returns paginated redemptions", async () => {
    mockRange.mockResolvedValueOnce({
      data: [{ id: "r1", token: "123456", status: "PENDING" }],
      error: null,
      count: 1,
    });

    const res = await fetchRedemptions({ page: 1, pageSize: 20 });
    expect(res.items).toHaveLength(1);
    expect(res.total).toBe(1);
  });

  it("applies search filter", async () => {
    mockRange.mockResolvedValueOnce({ data: [], error: null, count: 0 });

    await fetchRedemptions({ search: "999" });
    expect(mockIlike).toHaveBeenCalledWith("token", "%999%");
  });

  it("applies brandId filter", async () => {
    mockRange.mockResolvedValueOnce({ data: [], error: null, count: 0 });

    await fetchRedemptions({ brandId: "brand-123" });
    expect(mockEq).toHaveBeenCalledWith("brand_id", "brand-123");
  });

  it("throws on error", async () => {
    mockRange.mockResolvedValueOnce({ data: null, error: { message: "fail" }, count: 0 });

    await expect(fetchRedemptions({})).rejects.toBeDefined();
  });
});
