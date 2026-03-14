/**
 * Loyalty Service — camada de acesso a dados para pontuação e resgates.
 */
import { supabase } from "@/integrations/supabase/client";
import { createLogger } from "@/lib/logger";
import type { PointsRule, EarningResult, RuleSnapshot, EarningSource, EarningStatus, LedgerEntryType } from "../types";
import { calculateEarning, clampStorePointsPerReal } from "../types";

const log = createLogger("loyalty:earning");

export async function fetchActiveRule(brandId: string, branchId?: string | null): Promise<PointsRule | null> {
  log.debug("Fetching active points rule", { brandId, branchId });

  let q = supabase
    .from("points_rules")
    .select("*")
    .eq("brand_id", brandId)
    .eq("is_active", true);

  if (branchId) {
    q = q.or(`branch_id.eq.${branchId},branch_id.is.null`);
  }

  const { data, error } = await q
    .order("branch_id", { ascending: false, nullsFirst: false })
    .limit(1);

  if (error) {
    log.error("Failed to fetch points rule", error);
    throw error;
  }

  return (data?.[0] as PointsRule) || null;
}

export async function fetchStoreCustomRule(storeId: string): Promise<{ points_per_real: number } | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("store_points_rules")
    .select("points_per_real")
    .eq("store_id", storeId)
    .eq("status", "ACTIVE")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    log.error("Failed to fetch store custom rule", error);
    return null;
  }

  return data?.[0] || null;
}

export async function checkDailyLimits(params: {
  customerId: string;
  storeId: string;
  pointsToAdd: number;
  maxCustomerDay: number;
  maxStoreDay: number;
}): Promise<{ allowed: boolean; reason?: string }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [{ data: custToday }, { data: storeToday }] = await Promise.all([
    supabase
      .from("earning_events")
      .select("points_earned")
      .eq("customer_id", params.customerId)
      .eq("status", "APPROVED")
      .gte("created_at", todayISO),
    supabase
      .from("earning_events")
      .select("points_earned")
      .eq("store_id", params.storeId)
      .eq("status", "APPROVED")
      .gte("created_at", todayISO),
  ]);

  const custDayTotal = (custToday || []).reduce((s: number, e: { points_earned: number }) => s + e.points_earned, 0);
  if (custDayTotal + params.pointsToAdd > params.maxCustomerDay) {
    return { allowed: false, reason: `Limite diário do cliente atingido (${params.maxCustomerDay} pontos)` };
  }

  const storeDayTotal = (storeToday || []).reduce((s: number, e: any) => s + e.points_earned, 0);
  if (storeDayTotal + params.pointsToAdd > params.maxStoreDay) {
    return { allowed: false, reason: `Limite diário do parceiro atingido (${params.maxStoreDay} pontos)` };
  }

  return { allowed: true };
}

export async function checkReceiptUniqueness(storeId: string, receiptCode: string): Promise<boolean> {
  const { data } = await supabase
    .from("earning_events")
    .select("id")
    .eq("store_id", storeId)
    .eq("receipt_code", receiptCode)
    .limit(1);

  return !data || data.length === 0;
}

export async function createEarningEvent(params: {
  brandId: string;
  branchId: string;
  storeId: string;
  customerId: string;
  purchaseValue: number;
  receiptCode?: string;
  points: number;
  money: number;
  source: EarningSource;
  createdByUserId: string;
  ruleSnapshot: RuleSnapshot;
}): Promise<string> {
  log.info("Creating earning event", {
    storeId: params.storeId,
    customerId: params.customerId,
    points: params.points,
  });

  const { data, error } = await supabase
    .from("earning_events")
    .insert({
      brand_id: params.brandId,
      branch_id: params.branchId,
      store_id: params.storeId,
      customer_id: params.customerId,
      purchase_value: params.purchaseValue,
      receipt_code: params.receiptCode || null,
      points_earned: params.points,
      money_earned: params.money,
      source: params.source as any,
      created_by_user_id: params.createdByUserId,
      status: "APPROVED" as any,
      rule_snapshot_json: params.ruleSnapshot as any,
    })
    .select("id")
    .single();

  if (error) {
    log.error("Failed to create earning event", error);
    throw error;
  }

  return data.id;
}

export async function createLedgerEntry(params: {
  brandId: string;
  branchId: string;
  customerId: string;
  entryType: LedgerEntryType;
  points: number;
  money: number;
  reason: string;
  referenceType: string;
  referenceId: string;
  createdByUserId: string;
}): Promise<void> {
  log.debug("Creating ledger entry", { customerId: params.customerId, points: params.points });

  const { error } = await supabase.from("points_ledger").insert({
    brand_id: params.brandId,
    branch_id: params.branchId,
    customer_id: params.customerId,
    entry_type: params.entryType as any,
    points_amount: params.points,
    money_amount: params.money,
    reason: params.reason,
    reference_type: params.referenceType as any,
    reference_id: params.referenceId,
    created_by_user_id: params.createdByUserId,
  });

  if (error) {
    log.error("Failed to create ledger entry", error);
    throw error;
  }
}

export async function updateCustomerBalance(
  customerId: string,
  newPoints: number,
  newMoney: number
): Promise<void> {
  log.debug("Updating customer balance", { customerId, newPoints, newMoney });

  const { error } = await supabase
    .from("customers")
    .update({ points_balance: newPoints, money_balance: newMoney })
    .eq("id", customerId);

  if (error) {
    log.error("Failed to update customer balance", error);
    throw error;
  }
}
