// Governança de sync groups: tracking de versão, detecção de ofertas
// removidas/reativadas e contagem agregada.

import type { SyncGroupCounters } from "./types.ts";

export async function updateSyncGroup(
  supabase: any,
  brandId: string,
  sourceSystem: string,
  sourceGroupId: string,
  sourceGroupName: string | null,
  syncStatus: string,
  counters: SyncGroupCounters
) {
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("offer_sync_groups")
    .select("id, sync_version")
    .eq("brand_id", brandId)
    .eq("source_system", sourceSystem)
    .eq("source_group_id", sourceGroupId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("offer_sync_groups")
      .update({
        source_group_name: sourceGroupName,
        last_sync_at: now,
        last_sync_status: syncStatus,
        total_imported: counters.totalImported,
        total_active: counters.totalActive,
        total_removed: counters.totalRemoved,
        total_reported: counters.totalReported,
        sync_version: (existing.sync_version || 0) + 1,
        updated_at: now,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("offer_sync_groups").insert({
      brand_id: brandId,
      source_system: sourceSystem,
      source_group_id: sourceGroupId,
      source_group_name: sourceGroupName,
      last_sync_at: now,
      last_sync_status: syncStatus,
      total_imported: counters.totalImported,
      total_active: counters.totalActive,
      total_removed: counters.totalRemoved,
      total_reported: counters.totalReported,
      sync_version: 1,
    });
  }
}

export async function detectRemovedOffers(
  supabase: any,
  brandId: string,
  originValue: string,
  syncedExtIds: Set<string>
) {
  const { data: allExisting } = await supabase
    .from("affiliate_deals")
    .select("id, origin_external_id, current_status, is_active")
    .eq("brand_id", brandId)
    .eq("origin", originValue)
    .in("current_status", ["active", "suspected_outdated", "user_reported"]);

  let removedCount = 0;
  for (const deal of allExisting || []) {
    if (deal.origin_external_id && !syncedExtIds.has(deal.origin_external_id)) {
      await supabase
        .from("affiliate_deals")
        .update({
          current_status: "removed_from_source",
          is_active: false,
          visible_driver: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deal.id);
      removedCount++;
    }
  }
  return removedCount;
}

export async function reactivateReappearedOffers(
  supabase: any,
  brandId: string,
  originValue: string,
  syncedExtIds: Set<string>
) {
  const { data: archived } = await supabase
    .from("affiliate_deals")
    .select("id, origin_external_id")
    .eq("brand_id", brandId)
    .eq("origin", originValue)
    .in("current_status", ["archived", "removed_from_source", "inactive"])
    .eq("is_active", false);

  let reactivatedCount = 0;
  for (const deal of archived || []) {
    if (deal.origin_external_id && syncedExtIds.has(deal.origin_external_id)) {
      await supabase
        .from("affiliate_deals")
        .update({
          current_status: "active",
          is_active: true,
          visible_driver: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deal.id);
      reactivatedCount++;
    }
  }
  return reactivatedCount;
}

export async function computeSyncGroupCounters(
  supabase: any,
  brandId: string,
  originValue: string
): Promise<SyncGroupCounters> {
  const { data: deals } = await supabase
    .from("affiliate_deals")
    .select("id, current_status, is_active")
    .eq("brand_id", brandId)
    .eq("origin", originValue);

  const items = deals || [];
  const { count: reportedCount } = await supabase
    .from("offer_reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed");

  return {
    totalImported: items.length,
    totalActive: items.filter((d: any) => d.current_status === "active" && d.is_active).length,
    totalRemoved: items.filter((d: any) => d.current_status === "removed_from_source").length,
    totalReported: reportedCount || 0,
  };
}
