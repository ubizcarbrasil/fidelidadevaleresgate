/**
 * Loyalty Service — resgates.
 */
import { supabase } from "@/integrations/supabase/client";
import { createLogger } from "@/lib/logger";

const log = createLogger("loyalty:redemptions");

export interface RedemptionListItem {
  id: string;
  created_at: string;
  token: string;
  status: string;
  purchase_value: number | null;
  offers: { title: string } | null;
  customers: { name: string } | null;
  branches: { name: string } | null;
}

export async function fetchRedemptions(params: {
  search?: string;
  page?: number;
  pageSize?: number;
  brandId?: string;
}): Promise<{ items: RedemptionListItem[]; total: number }> {
  const { search, page = 1, pageSize = 20, brandId } = params;
  log.debug("Fetching redemptions", params);

  let query = supabase
    .from("redemptions")
    .select("*, offers(title), customers(name), branches(name)", { count: "exact" });

  if (brandId) query = query.eq("brand_id", brandId);
  if (search) query = query.ilike("token", `%${search}%`);

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) {
    log.error("Failed to fetch redemptions", error);
    throw error;
  }

  return { items: (data || []) as any, total: count || 0 };
}
