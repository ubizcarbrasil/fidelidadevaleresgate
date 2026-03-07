/**
 * Integration tests for Voucher Service.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();
const mockIlike = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockInsert = vi.fn();

const chainBuilder: any = {
  select: mockSelect,
  ilike: mockIlike,
  order: mockOrder,
  range: mockRange,
  update: mockUpdate,
  insert: mockInsert,
  eq: mockEq,
};

Object.values(chainBuilder).forEach((fn: any) => fn.mockReturnValue(chainBuilder));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => chainBuilder),
  },
}));

import { listVouchers, toggleVoucherStatus } from "../services/voucherService";

describe("voucherService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(chainBuilder).forEach((fn: any) => fn.mockReturnValue(chainBuilder));
  });

  describe("listVouchers", () => {
    it("should return paginated vouchers", async () => {
      const result = { data: [{ id: "v1", code: "ABC123" }], error: null, count: 1 };
      mockRange.mockResolvedValueOnce(result);

      const res = await listVouchers({ page: 1, pageSize: 20 });

      expect(res.rows).toHaveLength(1);
      expect(res.count).toBe(1);
    });

    it("should apply search filter", async () => {
      mockRange.mockResolvedValueOnce({ data: [], error: null, count: 0 });

      await listVouchers({ search: "ABC" });

      expect(mockIlike).toHaveBeenCalledWith("code", "%ABC%");
    });

    it("should throw on error", async () => {
      mockRange.mockResolvedValueOnce({ data: null, error: { message: "err" }, count: 0 });

      await expect(listVouchers()).rejects.toBeDefined();
    });
  });

  describe("toggleVoucherStatus", () => {
    it("should toggle ACTIVE to INACTIVE", async () => {
      mockEq.mockResolvedValueOnce({ error: null });

      const result = await toggleVoucherStatus("v1", "ACTIVE");

      expect(result).toBe("INACTIVE");
    });

    it("should toggle INACTIVE to ACTIVE", async () => {
      mockEq.mockResolvedValueOnce({ error: null });

      const result = await toggleVoucherStatus("v1", "INACTIVE");

      expect(result).toBe("ACTIVE");
    });
  });
});
