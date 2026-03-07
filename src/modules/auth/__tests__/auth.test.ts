import { describe, it, expect } from "vitest";
import {
  resolveConsoleScope,
  resolveScopeLevel,
  extractScopeIds,
  canAccessScope,
} from "../types";
import type { UserRole } from "../types";

const makeRole = (role: string, overrides: Partial<UserRole> = {}): UserRole => ({
  id: "r1",
  role: role as any,
  tenant_id: null,
  brand_id: null,
  branch_id: null,
  ...overrides,
});

describe("resolveConsoleScope", () => {
  it("returns ROOT for root_admin", () => {
    expect(resolveConsoleScope(true, [])).toBe("ROOT");
  });

  it("returns TENANT for tenant_admin", () => {
    expect(resolveConsoleScope(false, [makeRole("tenant_admin")])).toBe("TENANT");
  });

  it("returns BRAND for brand_admin", () => {
    expect(resolveConsoleScope(false, [makeRole("brand_admin")])).toBe("BRAND");
  });

  it("returns BRANCH for branch_admin", () => {
    expect(resolveConsoleScope(false, [makeRole("branch_admin")])).toBe("BRANCH");
  });

  it("returns OPERATOR for operator_pdv", () => {
    expect(resolveConsoleScope(false, [makeRole("operator_pdv")])).toBe("OPERATOR");
  });

  it("returns STORE_ADMIN for store_admin", () => {
    expect(resolveConsoleScope(false, [makeRole("store_admin")])).toBe("STORE_ADMIN");
  });

  it("defaults to BRANCH for unknown roles", () => {
    expect(resolveConsoleScope(false, [makeRole("customer")])).toBe("BRANCH");
  });

  it("prioritizes higher roles (tenant > brand)", () => {
    expect(resolveConsoleScope(false, [makeRole("brand_admin"), makeRole("tenant_admin")])).toBe("TENANT");
  });
});

describe("resolveScopeLevel", () => {
  it("returns PLATFORM for root", () => {
    expect(resolveScopeLevel(true, [])).toBe("PLATFORM");
  });

  it("returns BRAND for brand_admin", () => {
    expect(resolveScopeLevel(false, [makeRole("brand_admin")])).toBe("BRAND");
  });

  it("returns BRANCH for branch_admin", () => {
    expect(resolveScopeLevel(false, [makeRole("branch_admin")])).toBe("BRANCH");
  });
});

describe("extractScopeIds", () => {
  it("extracts tenant, brand, and branch ids", () => {
    const roles: UserRole[] = [
      makeRole("tenant_admin", { tenant_id: "t1" }),
      makeRole("brand_admin", { brand_id: "b1" }),
      makeRole("branch_admin", { branch_id: "br1" }),
    ];
    const ids = extractScopeIds(roles);
    expect(ids.tenantIds).toEqual(["t1"]);
    expect(ids.brandIds).toEqual(["b1"]);
    expect(ids.branchIds).toEqual(["br1"]);
  });

  it("returns empty arrays for no scope ids", () => {
    const ids = extractScopeIds([makeRole("customer")]);
    expect(ids.tenantIds).toEqual([]);
    expect(ids.brandIds).toEqual([]);
    expect(ids.branchIds).toEqual([]);
  });
});

describe("canAccessScope", () => {
  it("root can access anything", () => {
    expect(canAccessScope(true, [], { brandId: "x" })).toBe(true);
  });

  it("brand_admin can access their brand", () => {
    const roles = [makeRole("brand_admin", { brand_id: "b1" })];
    expect(canAccessScope(false, roles, { brandId: "b1" })).toBe(true);
  });

  it("brand_admin cannot access other brand", () => {
    const roles = [makeRole("brand_admin", { brand_id: "b1" })];
    expect(canAccessScope(false, roles, { brandId: "b2" })).toBe(false);
  });

  it("returns false with no scope provided", () => {
    expect(canAccessScope(false, [makeRole("brand_admin")], {})).toBe(false);
  });
});
