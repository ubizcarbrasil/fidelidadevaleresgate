/**
 * Customer Service — data access layer.
 */
import { supabase } from "@/integrations/supabase/client";
import { createLogger } from "@/lib/logger";
import type { CustomerForm } from "../types";

const log = createLogger("customers");

export interface CustomerListOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listCustomers({ search, page = 1, pageSize = 20 }: CustomerListOptions = {}) {
  log.info("Listing customers", { search, page });

  let query = supabase
    .from("customers")
    .select("*, brands(name), branches(name)", { count: "exact" });

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) {
    log.error("Failed to list customers", error);
    throw error;
  }

  return { items: data || [], total: count ?? 0 };
}

export async function createCustomer(form: CustomerForm) {
  log.info("Creating customer", { name: form.name });

  const { error } = await supabase.from("customers").insert({
    name: form.name,
    phone: form.phone || null,
    brand_id: form.brand_id,
    branch_id: form.branch_id,
  });

  if (error) {
    log.error("Failed to create customer", error);
    throw error;
  }
}

export async function updateCustomer(id: string, form: CustomerForm) {
  log.info("Updating customer", { id });

  const { error } = await supabase.from("customers").update({
    name: form.name,
    phone: form.phone || null,
    brand_id: form.brand_id,
    branch_id: form.branch_id,
  }).eq("id", id);

  if (error) {
    log.error("Failed to update customer", error);
    throw error;
  }
}

export async function findOrCreateCustomer(
  userId: string,
  brandId: string,
  branchId: string,
  name: string,
  phone: string | null
) {
  log.info("Finding or creating customer", { userId, brandId, branchId });

  // Check in selected branch
  const { data: inBranch } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", userId)
    .eq("brand_id", brandId)
    .eq("branch_id", branchId)
    .maybeSingle();

  if (inBranch) return inBranch;

  // Fallback: reuse from same brand
  const { data: inBrand } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", userId)
    .eq("brand_id", brandId)
    .order("points_balance", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (inBrand) {
    if (inBrand.branch_id !== branchId) {
      const { data: moved } = await supabase
        .from("customers")
        .update({ branch_id: branchId })
        .eq("id", inBrand.id)
        .select("*")
        .maybeSingle();
      return moved || inBrand;
    }
    return inBrand;
  }

  // Auto-create
  const { data: created, error } = await supabase
    .from("customers")
    .insert({ user_id: userId, brand_id: brandId, branch_id: branchId, name, phone })
    .select()
    .single();

  if (error) {
    log.error("Failed to create customer record", error);
    return null;
  }

  return created;
}
