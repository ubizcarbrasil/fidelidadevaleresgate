/**
 * Auth Module — tipos e constantes compartilhados.
 */
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export type ConsoleScope = "ROOT" | "TENANT" | "BRAND" | "BRANCH" | "OPERATOR" | "STORE_ADMIN";
export type ScopeLevel = "PLATFORM" | "TENANT" | "BRAND" | "BRANCH";

export interface UserRole {
  id: string;
  role: AppRole;
  tenant_id: string | null;
  brand_id: string | null;
  branch_id: string | null;
}

export interface ScopeIds {
  tenantIds: string[];
  brandIds: string[];
  branchIds: string[];
}

/** Labels para exibição de roles na UI */
export const ROLE_LABELS: Record<string, string> = {
  root_admin: "Administrador Raiz",
  tenant_admin: "Administrador da Empresa",
  brand_admin: "Empreendedor",
  branch_admin: "Administrador da Cidade",
  branch_operator: "Operador da Cidade",
  operator_pdv: "Operador PDV",
  store_admin: "Parceiro",
  customer: "Cliente",
};

export const CONSOLE_TITLES: Record<ConsoleScope, string> = {
  ROOT: "Painel Raiz",
  TENANT: "Painel da Empresa",
  BRAND: "Painel da Marca",
  BRANCH: "Painel da Filial",
  OPERATOR: "Operador do Ponto de Venda",
  STORE_ADMIN: "Portal do Parceiro",
};

/**
 * Determina o console scope com base nos roles do usuário.
 * Função pura — testável isoladamente.
 */
export function resolveConsoleScope(isRootAdmin: boolean, roles: UserRole[]): ConsoleScope {
  if (isRootAdmin) return "ROOT";
  if (roles.some((r) => r.role === "tenant_admin")) return "TENANT";
  if (roles.some((r) => r.role === "brand_admin")) return "BRAND";
  if (roles.some((r) => r.role === "branch_admin")) return "BRANCH";
  if (roles.some((r) => r.role === "branch_operator" || r.role === "operator_pdv")) return "OPERATOR";
  if (roles.some((r) => r.role === "store_admin")) return "STORE_ADMIN";
  return "BRANCH";
}

/**
 * Determina o scope level para checagens de permissão.
 * Função pura — testável isoladamente.
 */
export function resolveScopeLevel(isRootAdmin: boolean, roles: UserRole[]): ScopeLevel {
  if (isRootAdmin) return "PLATFORM";
  if (roles.some((r) => r.role === "tenant_admin")) return "TENANT";
  if (roles.some((r) => r.role === "brand_admin")) return "BRAND";
  return "BRANCH";
}

/**
 * Extrai IDs de escopo do array de roles.
 */
export function extractScopeIds(roles: UserRole[]): ScopeIds {
  return {
    tenantIds: roles.filter((r) => r.tenant_id).map((r) => r.tenant_id!),
    brandIds: roles.filter((r) => r.brand_id).map((r) => r.brand_id!),
    branchIds: roles.filter((r) => r.branch_id).map((r) => r.branch_id!),
  };
}

/**
 * Verifica se o usuário pode acessar um dado tenant/brand/branch.
 */
export function canAccessScope(
  isRootAdmin: boolean,
  roles: UserRole[],
  scope: { tenantId?: string; brandId?: string; branchId?: string }
): boolean {
  if (isRootAdmin) return true;
  if (scope.tenantId) return roles.some((r) => r.tenant_id === scope.tenantId);
  if (scope.brandId) return roles.some((r) => r.brand_id === scope.brandId);
  if (scope.branchId) return roles.some((r) => r.branch_id === scope.branchId);
  return false;
}
