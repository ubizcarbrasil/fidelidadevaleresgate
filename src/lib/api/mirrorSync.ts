import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────
// Catálogo de Origens (gerido pelo Root Admin)
// ─────────────────────────────────────────────

export interface SourceCatalogEntry {
  id: string;
  source_key: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  is_enabled: boolean;
  scraper_handler: string;
  sort_order: number;
}

export async function fetchSourceCatalog(opts?: { onlyEnabled?: boolean }): Promise<SourceCatalogEntry[]> {
  let q = supabase
    .from("mirror_source_catalog" as any)
    .select("*")
    .order("sort_order", { ascending: true });
  if (opts?.onlyEnabled) q = q.eq("is_enabled", true);
  const { data, error } = await q;
  if (error) throw error;
  return ((data as unknown) as SourceCatalogEntry[]) || [];
}

export async function updateSourceCatalogEntry(id: string, patch: Partial<Pick<SourceCatalogEntry, "display_name" | "description" | "icon" | "is_enabled" | "sort_order">>) {
  const { error } = await supabase
    .from("mirror_source_catalog" as any)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────
// Conectores (mirror_sync_config) — múltiplos por origem
// ─────────────────────────────────────────────

export async function triggerMirrorSync(brandId: string, sourceType = "divulgador_inteligente", configId?: string) {
  const { data, error } = await supabase.functions.invoke("mirror-sync", {
    body: { brand_id: brandId, source_type: sourceType, config_id: configId },
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
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAllSyncConfigs(brandId: string) {
  const { data, error } = await supabase
    .from("mirror_sync_config")
    .select("*")
    .eq("brand_id", brandId)
    .order("source_type", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchConnectorById(configId: string) {
  const { data, error } = await supabase
    .from("mirror_sync_config")
    .select("*")
    .eq("id", configId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createConnector(brandId: string, sourceType: string, payload: Record<string, any>) {
  const { data, error } = await supabase
    .from("mirror_sync_config")
    .insert({ brand_id: brandId, source_type: sourceType, ...payload })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function updateConnector(configId: string, payload: Record<string, any>) {
  const { error } = await supabase
    .from("mirror_sync_config")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", configId);
  if (error) throw error;
}

export async function deleteConnector(configId: string, opts?: { archiveDeals?: boolean; brandId?: string; sourceType?: string }) {
  // Optionally archive related deals (origin matches source_type globally — we cannot scope by config_id since
  // affiliate_deals doesn't carry config_id today. Archiving is opt-in and scoped by brand+origin.)
  if (opts?.archiveDeals && opts.brandId && opts.sourceType) {
    await supabase
      .from("affiliate_deals")
      .update({ current_status: "archived", is_active: false, updated_at: new Date().toISOString() } as any)
      .eq("brand_id", opts.brandId)
      .eq("origin", opts.sourceType);
  }
  const { error } = await supabase
    .from("mirror_sync_config")
    .delete()
    .eq("id", configId);
  if (error) throw error;
}

export async function upsertSyncConfig(brandId: string, sourceType: string, config: Record<string, any>) {
  const { data: existing } = await supabase
    .from("mirror_sync_config")
    .select("id")
    .eq("brand_id", brandId)
    .eq("source_type" as any, sourceType)
    .order("created_at", { ascending: true })
    .limit(1)
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
