/**
 * CRM Campaign Service — operações de audiência e campanha.
 */
import { supabase } from "@/integrations/supabase/client";
import { createLogger } from "@/lib/logger";
import type { AudienceFilters, CHANNEL_CONFIG } from "../types";

const log = createLogger("crm:campaigns");

export async function fetchAudiences(brandId: string) {
  log.debug("Fetching audiences", { brandId });

  const { data, error } = await supabase
    .from("crm_audiences")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    log.error("Failed to fetch audiences", error);
    throw error;
  }

  return data || [];
}

export async function estimateAudienceCount(
  brandId: string,
  filters: AudienceFilters
): Promise<number> {
  let query = supabase
    .from("crm_contacts")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", brandId)
    .eq("is_active", true);

  if (filters.gender) query = query.eq("gender", filters.gender);
  if (filters.os_platform) query = query.eq("os_platform", filters.os_platform);
  if (filters.source) query = query.eq("source", filters.source);

  const { count } = await query;
  return count || 0;
}

export async function createAudience(params: {
  brandId: string;
  name: string;
  description: string;
  filters: AudienceFilters;
  estimatedCount: number;
  createdBy?: string;
}) {
  log.info("Creating audience", { name: params.name, filters: params.filters });

  const { error } = await supabase.from("crm_audiences").insert([{
    brand_id: params.brandId,
    name: params.name,
    description: params.description,
    filters_json: params.filters as any,
    estimated_count: params.estimatedCount,
    created_by: params.createdBy,
  }]);

  if (error) {
    log.error("Failed to create audience", error);
    throw error;
  }

  log.info("Audience created successfully", { name: params.name });
}

export async function deleteAudience(id: string) {
  log.info("Deleting audience", { id });

  const { error } = await supabase.from("crm_audiences").delete().eq("id", id);
  if (error) {
    log.error("Failed to delete audience", error);
    throw error;
  }
}

export async function fetchCampaigns(brandId: string) {
  log.debug("Fetching campaigns", { brandId });

  const { data, error } = await supabase
    .from("crm_campaigns")
    .select("*, crm_audiences(name, estimated_count)")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    log.error("Failed to fetch campaigns", error);
    throw error;
  }

  return data || [];
}

export async function createCampaign(params: {
  brandId: string;
  audienceId: string;
  title: string;
  messageTemplate: string;
  channel: string;
  costPerSend: number;
  totalCost: number;
  totalRecipients: number;
  offerConfig: Record<string, unknown>;
  createdBy?: string;
}) {
  log.info("Creating campaign", { title: params.title, channel: params.channel });

  const { error } = await supabase.from("crm_campaigns").insert([{
    brand_id: params.brandId,
    audience_id: params.audienceId || null,
    title: params.title,
    message_template: params.messageTemplate,
    channel: params.channel,
    cost_per_send: params.costPerSend,
    total_cost: params.totalCost,
    total_recipients: params.totalRecipients,
    status: "PENDING_APPROVAL",
    offer_config_json: params.offerConfig as any,
    created_by: params.createdBy,
  }]);

  if (error) {
    log.error("Failed to create campaign", error);
    throw error;
  }

  log.info("Campaign created (pending approval)", { title: params.title });
}

export async function approveCampaign(id: string, approvedBy: string) {
  log.info("Approving campaign", { id });

  const { error } = await supabase
    .from("crm_campaigns")
    .update({
      status: "APPROVED",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    log.error("Failed to approve campaign", error);
    throw error;
  }
}
