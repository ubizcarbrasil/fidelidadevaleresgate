import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";

/**
 * Hook that provides brand-scoped query helpers.
 * Non-root users are forced to use the current brand context.
 * Root admins can optionally override.
 */
export function useBrandGuard() {
  const { isRootAdmin, roles } = useAuth();
  const { brand } = useBrand();

  /** The effective brand_id for the current user */
  const currentBrandId = useMemo(() => {
    if (brand) return brand.id;
    // Fallback: get from user roles
    const brandRole = roles.find(r => r.brand_id);
    return brandRole?.brand_id || null;
  }, [brand, roles]);

  /** The effective branch_id for scoped users */
  const currentBranchId = useMemo(() => {
    const branchRole = roles.find(r => r.branch_id);
    return branchRole?.branch_id || null;
  }, [roles]);

  /** Apply brand_id filter to a query builder */
  const applyBrandFilter = useCallback(<T extends { eq: (col: string, val: string) => T }>(
    query: T,
    brandIdOverride?: string
  ): T => {
    if (isRootAdmin && brandIdOverride) {
      return query.eq("brand_id", brandIdOverride);
    }
    if (!isRootAdmin && currentBrandId) {
      return query.eq("brand_id", currentBrandId);
    }
    return query;
  }, [isRootAdmin, currentBrandId]);

  /** Apply branch_id filter to a query builder */
  const applyBranchFilter = useCallback(<T extends { eq: (col: string, val: string) => T }>(
    query: T,
    branchIdOverride?: string
  ): T => {
    if (isRootAdmin && branchIdOverride) {
      return query.eq("branch_id", branchIdOverride);
    }
    if (!isRootAdmin && currentBranchId) {
      return query.eq("branch_id", currentBranchId);
    }
    return query;
  }, [isRootAdmin, currentBranchId]);

  /** Force brand_id into a payload for inserts/updates */
  const enforceBrandId = useCallback((payload: Record<string, any>): Record<string, any> => {
    if (!isRootAdmin && currentBrandId) {
      return { ...payload, brand_id: currentBrandId };
    }
    return payload;
  }, [isRootAdmin, currentBrandId]);

  /** Force branch_id into a payload */
  const enforceBranchId = useCallback((payload: Record<string, any>): Record<string, any> => {
    if (!isRootAdmin && currentBranchId) {
      return { ...payload, branch_id: currentBranchId };
    }
    return payload;
  }, [isRootAdmin, currentBranchId]);

  /** Determine user console scope */
  const consoleScope = useMemo((): "ROOT" | "TENANT" | "BRAND" | "BRANCH" | "OPERATOR" => {
    if (isRootAdmin) return "ROOT";
    if (roles.some(r => r.role === "tenant_admin")) return "TENANT";
    if (roles.some(r => r.role === "brand_admin")) return "BRAND";
    if (roles.some(r => r.role === "branch_admin")) return "BRANCH";
    if (roles.some(r => r.role === "branch_operator" || r.role === "operator_pdv")) return "OPERATOR";
    return "BRANCH";
  }, [isRootAdmin, roles]);

  return {
    isRootAdmin,
    currentBrandId,
    currentBranchId,
    consoleScope,
    applyBrandFilter,
    applyBranchFilter,
    enforceBrandId,
    enforceBranchId,
  };
}
