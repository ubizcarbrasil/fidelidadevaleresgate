import { supabase } from "@/integrations/supabase/client";

export async function triggerMirrorSync(brandId: string, sourceType = "divulgador_inteligente") {
  const { data, error } = await supabase.functions.invoke("mirror-sync", {
    body: { brand_id: brandId, source_type: sourceType },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function runMirrorDiagnose(brandId: string, sourceType = "divulgador_inteligente") {
  const { data, error } = await supabase.functions.invoke("mirror-sync", {
    body: { brand_id: brandId, mode: "diagnose", source_type: sourceType },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchSyncLogs(brandId: string, limit = 20) {
  const { data, error } = await supabase
    .from("mirror_sync_logs")
    .select("*")
    .eq("brand_id", brandId)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function fetchSyncConfig(brandId: string, sourceType = "divulgador_inteligente") {
  const { data, error } = await supabase
    .from("mirror_sync_config")
    .select("*")
    .eq("brand_id", brandId)
    .eq("source_type" as any, sourceType)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAllSyncConfigs(brandId: string) {
  const { data, error } = await supabase
    .from("mirror_sync_config")
    .select("*")
    .eq("brand_id", brandId);
  if (error) throw error;
  return data || [];
}

export async function upsertSyncConfig(brandId: string, sourceType: string, config: Record<string, any>) {
  const { data: existing } = await supabase
    .from("mirror_sync_config")
    .select("id")
    .eq("brand_id", brandId)
    .eq("source_type" as any, sourceType)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("mirror_sync_config")
      .update({ ...config, source_type: sourceType, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("mirror_sync_config")
      .insert({ brand_id: brandId, source_type: sourceType, ...config });
    if (error) throw error;
  }
}

export async function fetchMirroredDeals(brandId: string, filters?: {
  status?: string;
  visible?: boolean;
  featured?: boolean;
  search?: string;
  sourceType?: string;
}) {
  const origin = filters?.sourceType || "divulgador_inteligente";
  let query = supabase
    .from("affiliate_deals")
    .select("*")
    .eq("brand_id", brandId)
    .eq("origin", origin)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (filters?.status === "active") query = query.eq("is_active", true);
  if (filters?.status === "inactive") query = query.eq("is_active", false);
  if (filters?.visible === true) query = query.eq("visible_driver" as any, true);
  if (filters?.visible === false) query = query.eq("visible_driver" as any, false);
  if (filters?.featured === true) query = query.eq("is_featured" as any, true);
  if (filters?.search) query = query.ilike("title", `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateDealField(dealId: string, fields: Record<string, any>) {
  const { error } = await supabase
    .from("affiliate_deals")
    .update(fields)
    .eq("id", dealId);
  if (error) throw error;
}

export async function batchUpdateDeals(dealIds: string[], fields: Record<string, any>) {
  const { error } = await supabase
    .from("affiliate_deals")
    .update(fields)
    .in("id", dealIds);
  if (error) throw error;
}

export async function fetchCategories(brandId: string) {
  const { data, error } = await supabase
    .from("affiliate_deal_categories")
    .select("id, name, icon_name, color, is_active")
    .eq("brand_id", brandId)
    .order("order_index");
  if (error) throw error;
  return data;
}

export async function duplicateDealToCategory(dealId: string, newCategoryId: string) {
  const { data: original, error: fetchErr } = await supabase
    .from("affiliate_deals")
    .select("*")
    .eq("id", dealId)
    .single();
  if (fetchErr) throw fetchErr;

  const { id, created_at, updated_at, click_count, ...rest } = original;
  const { error } = await supabase
    .from("affiliate_deals")
    .insert({ ...rest, category_id: newCategoryId, click_count: 0 });
  if (error) throw error;
}
