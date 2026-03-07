/**
 * Stores Service — camada de acesso a dados para parceiros.
 */
import { supabase } from "@/integrations/supabase/client";
import { createLogger } from "@/lib/logger";
import type { Store } from "../types";

const log = createLogger("stores");

export async function fetchStores(params: {
  brandId?: string;
  branchId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ stores: Store[]; total: number }> {
  const { brandId, branchId, isActive, search, page = 0, pageSize = 50 } = params;
  log.debug("Fetching stores", params);

  let query = supabase
    .from("stores")
    .select("*", { count: "exact" })
    .order("name");

  if (brandId) query = query.eq("brand_id", brandId);
  if (branchId) query = query.eq("branch_id", branchId);
  if (isActive !== undefined) query = query.eq("is_active", isActive);
  if (search) query = query.or(`name.ilike.%${search}%,segment.ilike.%${search}%`);

  query = query.range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    log.error("Failed to fetch stores", error);
    throw error;
  }

  return { stores: (data || []) as Store[], total: count || 0 };
}

export async function fetchStoreById(id: string): Promise<Store | null> {
  log.debug("Fetching store by id", { id });

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    log.error("Failed to fetch store", error);
    throw error;
  }

  return data as Store | null;
}

export async function updateStoreApproval(
  id: string,
  status: "APPROVED" | "REJECTED"
): Promise<void> {
  log.info("Updating store approval", { id, status });

  const { error } = await supabase
    .from("stores")
    .update({ approval_status: status })
    .eq("id", id);

  if (error) {
    log.error("Failed to update store approval", error);
    throw error;
  }
}
