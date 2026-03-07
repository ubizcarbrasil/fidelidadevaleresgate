/**
 * Loyalty Module — tipos e constantes.
 */

export interface PointsRule {
  id: string;
  brand_id: string;
  branch_id: string | null;
  rule_type: "PER_REAL" | "FIXED" | "TIERED";
  points_per_real: number;
  money_per_point: number;
  min_purchase_to_earn: number;
  max_points_per_purchase: number;
  max_points_per_customer_per_day: number;
  max_points_per_store_per_day: number;
  require_receipt_code: boolean;
  is_active: boolean;
  allow_store_custom_rule: boolean;
  store_points_per_real_min: number;
  store_points_per_real_max: number;
  store_rule_requires_approval: boolean;
}

export interface EarningPreview {
  points: number;
  money: number;
  error: string | null;
}

export interface EarningResult {
  points: number;
  money: number;
  newBalance: number;
  eventId: string;
}

export interface RuleSnapshot {
  points_per_real: number;
  rule_type: string;
  money_per_point: number;
  min_purchase_to_earn: number;
  max_points_per_purchase: number;
  max_points_per_customer_per_day: number;
  max_points_per_store_per_day: number;
  using_custom_store_rule: boolean;
}

export type EarningSource = "PDV" | "API" | "IMPORT" | "MANUAL";
export type EarningStatus = "APPROVED" | "PENDING" | "REJECTED";
export type LedgerEntryType = "CREDIT" | "DEBIT";

/**
 * Calcula os pontos de uma compra com base na regra ativa.
 * Função pura — testável isoladamente.
 */
export function calculateEarning(
  purchaseValue: number,
  rule: Pick<PointsRule, "rule_type" | "points_per_real" | "min_purchase_to_earn" | "max_points_per_purchase" | "money_per_point">,
  effectivePointsPerReal?: number
): EarningPreview {
  if (purchaseValue <= 0) {
    return { points: 0, money: 0, error: "Valor de compra deve ser positivo" };
  }

  if (purchaseValue < rule.min_purchase_to_earn) {
    return {
      points: 0,
      money: 0,
      error: `Compra mínima: R$ ${rule.min_purchase_to_earn.toFixed(2)}`,
    };
  }

  const ppr = effectivePointsPerReal ?? rule.points_per_real;
  let points = 0;

  if (rule.rule_type === "PER_REAL") {
    points = Math.floor(purchaseValue * ppr);
  } else if (rule.rule_type === "FIXED") {
    points = Number(rule.points_per_real);
  }

  points = Math.min(points, rule.max_points_per_purchase);
  const money = points * rule.money_per_point;

  return { points, money, error: null };
}

/**
 * Calcula o effectivePointsPerReal com clamping.
 * Função pura — testável isoladamente.
 */
export function clampStorePointsPerReal(
  storeValue: number,
  min: number,
  max: number
): number {
  return Math.min(Math.max(storeValue, min), max);
}
