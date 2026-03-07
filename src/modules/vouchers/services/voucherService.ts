/**
 * Voucher Service — data access layer.
 */
import { supabase } from "@/integrations/supabase/client";
import { createLogger } from "@/lib/logger";

const log = createLogger("vouchers");

export interface VoucherListOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listVouchers({ search, page = 1, pageSize = 20 }: VoucherListOptions = {}) {
  log.info("Listing vouchers", { search, page });

  let query = supabase
    .from("coupons")
    .select("*, branches:branch_id(name, brands:brand_id(name))", { count: "exact" });

  if (search) {
    query = query.ilike("code", `%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) {
    log.error("Failed to list vouchers", error);
    throw error;
  }

  return { rows: data || [], count: count ?? 0 };
}

export async function toggleVoucherStatus(id: string, currentStatus: string) {
  const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  log.info("Toggling voucher status", { id, from: currentStatus, to: newStatus });

  const { error } = await supabase
    .from("coupons")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) {
    log.error("Failed to toggle voucher status", error);
    throw error;
  }

  return newStatus;
}

export async function createVoucher(payload: Record<string, any>) {
  log.info("Creating voucher", { code: payload.code });

  const { error } = await supabase.from("vouchers").insert(payload as any);

  if (error) {
    log.error("Failed to create voucher", error);
    throw error;
  }
}

export async function fetchBranchesForWizard() {
  const { data, error } = await supabase
    .from("branches")
    .select("id, name, brands(name)")
    .eq("is_active", true)
    .order("name");

  if (error) {
    log.error("Failed to fetch branches for wizard", error);
    throw error;
  }

  return data || [];
}
