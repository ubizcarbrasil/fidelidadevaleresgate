import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";

/** Check if root admin is impersonating a brand via ?brandId= URL param */
function useImpersonatingBrand(): boolean {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return !!params.get("brandId");
  }, []);
}
/**
 * Hook that provides brand-scoped query helpers.
 * Non-root users are forced to use the current brand context.
 * Root admins can optionally override via ?brandId= URL param.
 */
export function useBrandGuard() {
  const { isRootAdmin, roles, loading: authLoading, user, rolesCarregados } = useAuth();
  const { brand } = useBrand();
  const isImpersonating = useImpersonatingBrand();

  /** The effective brand_id for the current user */
  const currentBrandId = useMemo(() => {
    if (brand) {
      // Root admins can see any brand context
      if (isRootAdmin) return brand.id;
      // Non-root: brand from context only counts if user has a role in it
      const hasRoleInBrand = roles.some(r => r.brand_id === brand.id);
      if (hasRoleInBrand) return brand.id;
    }
    // Fallback: use brand_id from the user's role (defense in depth)
    const brandRole = roles.find(r => r.brand_id);
    return brandRole?.brand_id || null;
  }, [brand, roles, isRootAdmin]);

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
  const consoleScope = useMemo((): "ROOT" | "TENANT" | "BRAND" | "BRANCH" | "OPERATOR" | "STORE_ADMIN" | "LOADING" => {
    // Defesa: enquanto auth não terminou OU a busca de roles ainda não retornou,
    // ficamos em LOADING. Após `rolesCarregados=true`, lista vazia é tratada
    // como "sem permissões", não como "ainda carregando" (evita spinner infinito).
    if (authLoading) return "LOADING";
    if (user && !rolesCarregados) return "LOADING";
    // Root admin impersonating a brand via ?brandId= should see BRAND console
    if (isRootAdmin && isImpersonating && brand) return "BRAND";
    if (isRootAdmin) return "ROOT";
    if (roles.some(r => r.role === "tenant_admin")) return "TENANT";
    if (roles.some(r => r.role === "brand_admin")) return "BRAND";
    if (roles.some(r => r.role === "branch_admin")) return "BRANCH";
    if (roles.some(r => r.role === "branch_operator" || r.role === "operator_pdv")) return "OPERATOR";
    if (roles.some(r => r.role === "store_admin")) return "STORE_ADMIN";
    return "BRANCH";
  }, [isRootAdmin, isImpersonating, brand, roles, authLoading, user, rolesCarregados]);

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
