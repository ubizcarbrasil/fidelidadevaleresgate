import { supabase } from "@/integrations/supabase/client";

export async function triggerMirrorSync(brandId: string) {
  const { data, error } = await supabase.functions.invoke("mirror-sync", {
    body: { brand_id: brandId },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function runMirrorDiagnose(brandId: string) {
  const { data, error } = await supabase.functions.invoke("mirror-sync", {
    body: { brand_id: brandId, mode: "diagnose" },
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

export async function fetchSyncConfig(brandId: string) {
  const { data, error } = await supabase
    .from("mirror_sync_config")
    .select("*")
    .eq("brand_id", brandId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertSyncConfig(brandId: string, config: Record<string, any>) {
  const { data: existing } = await supabase
    .from("mirror_sync_config")
    .select("id")
    .eq("brand_id", brandId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("mirror_sync_config")
      .update({ ...config, updated_at: new Date().toISOString() })
      .eq("brand_id", brandId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("mirror_sync_config")
      .insert({ brand_id: brandId, ...config });
    if (error) throw error;
  }
}

export async function fetchMirroredDeals(brandId: string, filters?: {
  status?: string;
  visible?: boolean;
  featured?: boolean;
  search?: string;
}) {
  let query = supabase
    .from("affiliate_deals")
    .select("*")
    .eq("brand_id", brandId)
    .eq("origin", "divulgador_inteligente")
    .order("created_at", { ascending: false })
    .limit(200);

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
