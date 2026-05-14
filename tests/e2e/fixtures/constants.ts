/**
 * Constantes determinísticas para o ambiente E2E.
 *
 * UUIDs fixos garantem que o seed seja idempotente (UPSERT) e o teardown
 * possa remover os mesmos registros sem ambiguidade. CPF de teste padrão
 * "00000000000" não é válido em produção e fica isolado por brand_id.
 */
export const E2E_BRAND_ID = "00000000-e2e0-0000-0000-000000000001";
export const E2E_BRANCH_ID = "00000000-e2e0-0000-0000-000000000002";
export const E2E_CUSTOMER_ID = "00000000-e2e0-0000-0000-000000000003";
export const E2E_SEASON_ID = "00000000-e2e0-0000-0000-000000000004";
export const E2E_TIER_A_ID = "00000000-e2e0-0000-0000-000000000005";
export const E2E_TIER_B_ID = "00000000-e2e0-0000-0000-000000000006";

export const E2E_DRIVER_CPF = "00000000000";
export const E2E_DRIVER_NAME = "[MOTORISTA] E2E Test Driver";

export const E2E_PREFIX = "e2e_";

export function driverSessionStorageKey(brandId: string): string {
  return `driver_session_cpf_${brandId}`;
}