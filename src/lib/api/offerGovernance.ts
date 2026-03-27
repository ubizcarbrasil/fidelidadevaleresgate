import { supabase } from "@/integrations/supabase/client";

export type SourceSystem = "dvlinks" | "divulgador_inteligente";

export const ORIGENS: { value: SourceSystem; label: string }[] = [
  { value: "dvlinks", label: "Divulga Link" },
  { value: "divulgador_inteligente", label: "Divulgador Inteligente" },
];

export const STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  suspected_outdated: "Suspeita desatualizada",
  user_reported: "Denunciada",
  removed_from_source: "Removida da origem",
  sync_error: "Erro de sync",
  archived: "Arquivada",
  inactive: "Inativa",
};

export const REPORT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  reviewed: "Revisada",
  confirmed: "Confirmada",
  dismissed: "Dispensada",
};

// ---- KPIs ----

export async function fetchGovernanceKpis(brandId: string, origin: SourceSystem) {
  const { data: deals } = await supabase
    .from("affiliate_deals")
    .select("id, current_status, is_active, source_group_id")
    .eq("brand_id", brandId)
    .eq("origin", origin);

  const items = deals || [];
  const groups = new Set(items.map((d: any) => d.source_group_id).filter(Boolean));

  return {
    totalGrupos: groups.size,
    totalOfertas: items.length,
    totalAtivas: items.filter((d: any) => d.current_status === "active" && d.is_active).length,
    totalRemovidas: items.filter((d: any) => d.current_status === "removed_from_source").length,
    totalDenunciadas: items.filter((d: any) => d.current_status === "user_reported").length,
    totalArquivadas: items.filter((d: any) => d.current_status === "archived").length,
  };
}

// ---- Deals ----

export interface GovernanceDealFilters {
  brandId: string;
  origin: SourceSystem;
  status?: string;
  groupId?: string;
  marketplace?: string;
  search?: string;
}

export async function fetchGovernanceDeals(filters: GovernanceDealFilters) {
  let q = supabase
    .from("affiliate_deals")
    .select("id, title, image_url, price, original_price, origin, current_status, is_active, source_group_id, source_group_name, marketplace, store_name, last_synced_at, created_at")
    .eq("brand_id", filters.brandId)
    .eq("origin", filters.origin)
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.status) q = q.eq("current_status", filters.status);
  if (filters.groupId) q = q.eq("source_group_id", filters.groupId);
  if (filters.marketplace) q = q.eq("marketplace", filters.marketplace);
  if (filters.search) q = q.ilike("title", `%${filters.search}%`);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

// ---- Bulk Actions ----

export async function bulkUpdateDealStatus(ids: string[], status: string, isActive: boolean) {
  const { error } = await supabase
    .from("affiliate_deals")
    .update({ current_status: status, is_active: isActive, updated_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}

export async function bulkArchiveDeals(ids: string[]) {
  return bulkUpdateDealStatus(ids, "archived", false);
}

export async function bulkDeactivateDeals(ids: string[]) {
  return bulkUpdateDealStatus(ids, "inactive", false);
}

// ---- Reports ----

export async function fetchOfferReports(brandId: string, origin?: SourceSystem) {
  let q = supabase
    .from("offer_reports")
    .select("id, offer_id, user_id, reason, note, screenshot_url, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as any[];
}

export async function updateReportStatus(reportId: string, status: string) {
  const { error } = await supabase
    .from("offer_reports")
    .update({ status } as any)
    .eq("id", reportId);
  if (error) throw error;
}

// ---- Sync Groups ----

export async function fetchSyncGroups(brandId: string, origin: SourceSystem) {
  const { data, error } = await supabase
    .from("offer_sync_groups")
    .select("*")
    .eq("brand_id", brandId)
    .eq("source_system", origin)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []) as any[];
}

// ---- Sync Logs ----

export async function fetchSyncLogs(brandId: string, limit = 50) {
  const { data, error } = await supabase
    .from("mirror_sync_logs")
    .select("*")
    .eq("brand_id", brandId)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as any[];
}
