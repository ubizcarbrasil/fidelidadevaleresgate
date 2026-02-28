import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Hook to check user permissions based on the RBAC system.
 * Uses the user's roles from AuthContext and checks against
 * the role_permissions + user_permission_overrides via the
 * server-side `user_has_permission` function.
 * 
 * For client-side quick checks (no DB call), use `hasRole`.
 * For server-validated permission checks, use the RPC function directly.
 */
export function usePermissions() {
  const { roles, isRootAdmin, hasRole, user } = useAuth();

  /** Quick client-side role check */
  const isRole = useCallback(
    (role: AppRole) => hasRole(role),
    [hasRole]
  );

  /** Get the user's scope level */
  const getScopeLevel = useCallback((): "PLATFORM" | "TENANT" | "BRAND" | "BRANCH" => {
    if (isRootAdmin) return "PLATFORM";
    if (roles.some((r) => r.role === "tenant_admin")) return "TENANT";
    if (roles.some((r) => r.role === "brand_admin")) return "BRAND";
    return "BRANCH";
  }, [roles, isRootAdmin]);

  /** Get scope IDs the user has access to */
  const getScopeIds = useCallback(() => {
    const tenantIds = roles.filter((r) => r.tenant_id).map((r) => r.tenant_id!);
    const brandIds = roles.filter((r) => r.brand_id).map((r) => r.brand_id!);
    const branchIds = roles.filter((r) => r.branch_id).map((r) => r.branch_id!);
    return { tenantIds, brandIds, branchIds };
  }, [roles]);

  /** Check if user can access a specific entity by scope */
  const canAccessTenant = useCallback(
    (tenantId: string) => {
      if (isRootAdmin) return true;
      return roles.some((r) => r.tenant_id === tenantId);
    },
    [roles, isRootAdmin]
  );

  const canAccessBrand = useCallback(
    (brandId: string) => {
      if (isRootAdmin) return true;
      return roles.some((r) => r.brand_id === brandId);
    },
    [roles, isRootAdmin]
  );

  const canAccessBranch = useCallback(
    (branchId: string) => {
      if (isRootAdmin) return true;
      return roles.some((r) => r.branch_id === branchId);
    },
    [roles, isRootAdmin]
  );

  return {
    isRootAdmin,
    isRole,
    getScopeLevel,
    getScopeIds,
    canAccessTenant,
    canAccessBrand,
    canAccessBranch,
    roles,
    userId: user?.id,
  };
}

/** All role labels for UI display */
export const ROLE_LABELS: Record<string, string> = {
  root_admin: "Root Admin",
  tenant_admin: "Tenant Admin",
  brand_admin: "Brand Admin",
  branch_admin: "Branch Admin",
  branch_operator: "Branch Operator",
  operator_pdv: "Operador PDV",
  store_admin: "Store Admin",
  customer: "Cliente",
};
