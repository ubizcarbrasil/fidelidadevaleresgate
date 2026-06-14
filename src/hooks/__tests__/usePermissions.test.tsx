/**
 * usePermissions — checks de RBAC client-side baseado em roles.
 *
 * Bug aqui = vazamento de tenant (brand_admin de brand A acessa brand B)
 * ou bloqueio incorreto de root_admin.
 *
 * Usa o mock harness consolidado de createMockAuth (PR #82).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermissions, ROLE_LABELS } from "../usePermissions";
import { createMockAuth } from "@/test/mocks/context";

// Adapter pro mock harness: createMockAuth não inclui `hasRole` por default,
// então plugamos em cima. usePermissions o lê do useAuth().
const mockAuth = createMockAuth();
function hasRole(role: string) {
  return mockAuth.state.roles.some((r) => r.role === role);
}
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ ...mockAuth.state, hasRole }),
}));

beforeEach(() => {
  mockAuth.reset();
});

// ── isRole / scope level ─────────────────────────────────
describe("getScopeLevel", () => {
  it("root_admin → PLATFORM", () => {
    mockAuth.state.isRootAdmin = true;
    const { result } = renderHook(() => usePermissions());
    expect(result.current.getScopeLevel()).toBe("PLATFORM");
  });

  it("tenant_admin → TENANT", () => {
    mockAuth.state.roles = [{ role: "tenant_admin" }];
    const { result } = renderHook(() => usePermissions());
    expect(result.current.getScopeLevel()).toBe("TENANT");
  });

  it("brand_admin → BRAND", () => {
    mockAuth.state.roles = [{ role: "brand_admin", brand_id: "b1" }];
    const { result } = renderHook(() => usePermissions());
    expect(result.current.getScopeLevel()).toBe("BRAND");
  });

  it("hierarquia: tenant > brand quando ambos presentes", () => {
    mockAuth.state.roles = [
      { role: "brand_admin", brand_id: "b1" },
      { role: "tenant_admin" },
    ];
    const { result } = renderHook(() => usePermissions());
    expect(result.current.getScopeLevel()).toBe("TENANT");
  });

  it("fallback BRANCH pra qualquer outra role", () => {
    mockAuth.state.roles = [{ role: "branch_operator" }];
    const { result } = renderHook(() => usePermissions());
    expect(result.current.getScopeLevel()).toBe("BRANCH");
  });

  it("sem roles: BRANCH (default conservador)", () => {
    const { result } = renderHook(() => usePermissions());
    expect(result.current.getScopeLevel()).toBe("BRANCH");
  });
});

// ── getScopeIds ──────────────────────────────────────────
describe("getScopeIds", () => {
  it("agrupa tenant_ids/brand_ids/branch_ids de cada role", () => {
    mockAuth.state.roles = [
      { role: "tenant_admin", tenant_id: "t1" },
      { role: "brand_admin", brand_id: "b1", tenant_id: "t1" },
      { role: "branch_admin", brand_id: "b1", branch_id: "br1" },
    ];
    const { result } = renderHook(() => usePermissions());
    const ids = result.current.getScopeIds();
    expect(ids.tenantIds).toEqual(["t1", "t1"]);
    expect(ids.brandIds).toEqual(["b1", "b1"]);
    expect(ids.branchIds).toEqual(["br1"]);
  });

  it("roles sem ids: arrays vazios", () => {
    mockAuth.state.roles = [{ role: "customer" }];
    const { result } = renderHook(() => usePermissions());
    const ids = result.current.getScopeIds();
    expect(ids.tenantIds).toEqual([]);
    expect(ids.brandIds).toEqual([]);
    expect(ids.branchIds).toEqual([]);
  });
});

// ── canAccess* — defesa cross-tenant ─────────────────────
describe("canAccessTenant", () => {
  it("root_admin: true pra qualquer tenant", () => {
    mockAuth.state.isRootAdmin = true;
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canAccessTenant("any-tenant")).toBe(true);
  });

  it("non-root com role no tenant: true", () => {
    mockAuth.state.roles = [{ role: "tenant_admin", tenant_id: "t1" }];
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canAccessTenant("t1")).toBe(true);
  });

  it("non-root sem role no tenant alvo: false", () => {
    mockAuth.state.roles = [{ role: "tenant_admin", tenant_id: "t1" }];
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canAccessTenant("t-DIFERENTE")).toBe(false);
  });
});

describe("canAccessBrand", () => {
  it("root_admin: true pra qualquer brand", () => {
    mockAuth.state.isRootAdmin = true;
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canAccessBrand("any-brand")).toBe(true);
  });

  it("non-root com role na brand: true", () => {
    mockAuth.state.roles = [{ role: "brand_admin", brand_id: "b1" }];
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canAccessBrand("b1")).toBe(true);
  });

  it("non-root SEM role na brand alvo: false (CRÍTICO cross-tenant)", () => {
    mockAuth.state.roles = [{ role: "brand_admin", brand_id: "b1" }];
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canAccessBrand("b-OUTRA")).toBe(false);
  });
});

describe("canAccessBranch", () => {
  it("root_admin: true pra qualquer branch", () => {
    mockAuth.state.isRootAdmin = true;
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canAccessBranch("any-branch")).toBe(true);
  });

  it("non-root com role na branch: true", () => {
    mockAuth.state.roles = [{ role: "branch_admin", branch_id: "br1" }];
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canAccessBranch("br1")).toBe(true);
  });

  it("non-root SEM role na branch alvo: false", () => {
    mockAuth.state.roles = [{ role: "branch_admin", branch_id: "br1" }];
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canAccessBranch("br-OUTRA")).toBe(false);
  });
});

// ── isRole ───────────────────────────────────────────────
describe("isRole (proxy de hasRole)", () => {
  it("delega pra useAuth().hasRole", () => {
    mockAuth.state.roles = [{ role: "brand_admin", brand_id: "b1" }];
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isRole("brand_admin" as never)).toBe(true);
    expect(result.current.isRole("store_admin" as never)).toBe(false);
  });
});

// ── userId / roles exposed ───────────────────────────────
describe("retornos expostos", () => {
  it("userId vem de useAuth().user.id", () => {
    mockAuth.state.user = { id: "u-42" };
    const { result } = renderHook(() => usePermissions());
    expect(result.current.userId).toBe("u-42");
  });

  it("user null: userId undefined", () => {
    mockAuth.state.user = null;
    const { result } = renderHook(() => usePermissions());
    expect(result.current.userId).toBeUndefined();
  });

  it("roles passados direto do AuthContext", () => {
    mockAuth.state.roles = [{ role: "store_admin", brand_id: "b1" }];
    const { result } = renderHook(() => usePermissions());
    expect(result.current.roles).toEqual([{ role: "store_admin", brand_id: "b1" }]);
  });
});

// ── ROLE_LABELS export ───────────────────────────────────
describe("ROLE_LABELS", () => {
  it("cobre 8 roles conhecidas", () => {
    expect(Object.keys(ROLE_LABELS)).toEqual([
      "root_admin",
      "tenant_admin",
      "brand_admin",
      "branch_admin",
      "branch_operator",
      "operator_pdv",
      "store_admin",
      "customer",
    ]);
  });

  it("labels em pt-BR pra UI", () => {
    expect(ROLE_LABELS.root_admin).toMatch(/Raiz/);
    expect(ROLE_LABELS.brand_admin).toBe("Empreendedor");
    expect(ROLE_LABELS.customer).toBe("Cliente");
  });
});
