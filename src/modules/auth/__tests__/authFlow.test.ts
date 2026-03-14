/**
 * Service-layer test: Auth module types and role resolution.
 */
import { describe, it, expect } from "vitest";
import {
  resolveConsoleScope,
  resolveScopeLevel,
  extractScopeIds,
  canAccessScope,
  ROLE_LABELS,
  CONSOLE_TITLES,
} from "../types";
import type { UserRole, AppRole } from "../types";

function makeRole(role: AppRole, overrides?: Partial<UserRole>): UserRole {
  return { id: "test-id", role, tenant_id: null, brand_id: null, branch_id: null, ...overrides };
}

describe("Auth Flow — Role Resolution", () => {
  describe("resolveConsoleScope", () => {
    it("returns ROOT for root_admin", () => {
      expect(resolveConsoleScope(true, [makeRole("root_admin")])).toBe("ROOT");
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

    it("returns OPERATOR for operator roles", () => {
      expect(resolveConsoleScope(false, [makeRole("branch_operator")])).toBe("OPERATOR");
      expect(resolveConsoleScope(false, [makeRole("operator_pdv")])).toBe("OPERATOR");
    });

    it("returns STORE_ADMIN for store_admin", () => {
      expect(resolveConsoleScope(false, [makeRole("store_admin")])).toBe("STORE_ADMIN");
    });

    it("returns BRANCH as default for customer", () => {
      expect(resolveConsoleScope(false, [makeRole("customer")])).toBe("BRANCH");
    });
  });

  describe("resolveScopeLevel", () => {
    it("maps root_admin to PLATFORM level", () => {
      expect(resolveScopeLevel(true, [makeRole("root_admin")])).toBe("PLATFORM");
    });

    it("maps brand_admin to BRAND level", () => {
      expect(resolveScopeLevel(false, [makeRole("brand_admin")])).toBe("BRAND");
    });

    it("maps branch_admin to BRANCH level", () => {
      expect(resolveScopeLevel(false, [makeRole("branch_admin")])).toBe("BRANCH");
    });
  });

  describe("extractScopeIds", () => {
    it("extracts tenant, brand, and branch IDs from roles", () => {
      const roles: UserRole[] = [
        makeRole("brand_admin", { brand_id: "b1", tenant_id: "t1" }),
        makeRole("branch_admin", { brand_id: "b1", branch_id: "br1" }),
      ];
      const ids = extractScopeIds(roles);
      expect(ids.tenantIds).toContain("t1");
      expect(ids.brandIds).toContain("b1");
      expect(ids.branchIds).toContain("br1");
    });
  });

  describe("canAccessScope", () => {
    it("root_admin can access any scope", () => {
      const roles = [makeRole("root_admin")];
      expect(canAccessScope(true, roles, { brandId: "any-id" })).toBe(true);
    });

    it("brand_admin can access own brand", () => {
      const roles = [makeRole("brand_admin", { brand_id: "b1" })];
      expect(canAccessScope(false, roles, { brandId: "b1" })).toBe(true);
    });

    it("brand_admin cannot access other brand", () => {
      const roles = [makeRole("brand_admin", { brand_id: "b1" })];
      expect(canAccessScope(false, roles, { brandId: "b2" })).toBe(false);
    });
  });

  describe("constants", () => {
    it("ROLE_LABELS has entries for all roles", () => {
      expect(ROLE_LABELS).toHaveProperty("root_admin");
      expect(ROLE_LABELS).toHaveProperty("brand_admin");
      expect(ROLE_LABELS).toHaveProperty("customer");
    });

    it("CONSOLE_TITLES has entries for all scopes", () => {
      expect(CONSOLE_TITLES).toHaveProperty("ROOT");
      expect(CONSOLE_TITLES).toHaveProperty("BRAND");
      expect(CONSOLE_TITLES).toHaveProperty("STORE_ADMIN");
    });
  });
});
