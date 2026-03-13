import { describe, it, expect } from "vitest";
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
  type ApprovalStatus,
} from "../types";

const ALL_STATUSES: ApprovalStatus[] = ["PENDING", "APPROVED", "REJECTED"];

describe("Store type constants", () => {
  it("APPROVAL_STATUS_LABELS covers all statuses", () => {
    for (const status of ALL_STATUSES) {
      expect(APPROVAL_STATUS_LABELS[status]).toBeDefined();
      expect(typeof APPROVAL_STATUS_LABELS[status]).toBe("string");
    }
  });

  it("APPROVAL_STATUS_COLORS covers all statuses with valid classes", () => {
    for (const status of ALL_STATUSES) {
      expect(APPROVAL_STATUS_COLORS[status]).toBeDefined();
      expect(APPROVAL_STATUS_COLORS[status]).toContain("bg-");
      expect(APPROVAL_STATUS_COLORS[status]).toContain("text-");
    }
  });
});
