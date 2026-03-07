/**
 * CRM Tier Service — lógica de classificação por engajamento.
 */
import { supabase } from "@/integrations/supabase/client";
import { createLogger } from "@/lib/logger";
import type { TierConfig, TierWithCount } from "../types";
import { DEFAULT_TIERS } from "../types";

const log = createLogger("crm:tiers");

export function getDefaultTiers(): TierConfig[] {
  return DEFAULT_TIERS.map((t, i) => ({ ...t, id: `default-${i}` }));
}

export async function fetchTierConfig(brandId: string): Promise<TierConfig[]> {
  log.debug("Fetching tier config", { brandId });

  const { data, error } = await supabase
    .from("crm_tiers")
    .select("*")
    .eq("brand_id", brandId)
    .order("order_index");

  if (error) {
    log.error("Failed to fetch tier config", error);
    throw error;
  }

  if (!data || data.length === 0) {
    log.info("No custom tiers found, using defaults");
    return getDefaultTiers();
  }

  return data as TierConfig[];
}

/**
 * Classifica um contato em um tier com base no número de eventos.
 * Função pura — testável isoladamente.
 */
export function classifyContactTier(eventCount: number, tiers: TierConfig[]): TierConfig | null {
  for (const tier of tiers) {
    if (tier.max_events === null && eventCount >= tier.min_events) return tier;
    if (tier.min_events === 0 && tier.max_events === 0 && eventCount === 0) return tier;
    if (tier.max_events !== null && eventCount >= tier.min_events && eventCount <= tier.max_events) return tier;
  }
  return null;
}

export async function fetchTierDistribution(brandId: string, tiers: TierConfig[]): Promise<TierWithCount[]> {
  log.debug("Computing tier distribution", { brandId });

  // Get event counts per contact
  const { data: events, error } = await supabase
    .from("crm_events")
    .select("contact_id")
    .eq("brand_id", brandId);

  if (error) {
    log.error("Failed to fetch events for tier distribution", error);
    throw error;
  }

  const contactCounts: Record<string, number> = {};
  (events || []).forEach((e) => {
    contactCounts[e.contact_id] = (contactCounts[e.contact_id] || 0) + 1;
  });

  // Include contacts with 0 events
  const { data: allContacts } = await supabase
    .from("crm_contacts")
    .select("id")
    .eq("brand_id", brandId)
    .eq("is_active", true);

  (allContacts || []).forEach((c) => {
    if (!(c.id in contactCounts)) contactCounts[c.id] = 0;
  });

  const distribution: TierWithCount[] = tiers.map((tier) => {
    const count = Object.values(contactCounts).filter((cnt) => {
      if (tier.max_events === null) return cnt >= tier.min_events;
      if (tier.min_events === 0 && tier.max_events === 0) return cnt === 0;
      return cnt >= tier.min_events && cnt <= tier.max_events;
    }).length;

    return { ...tier, count };
  });

  log.info("Tier distribution computed", {
    totalContacts: Object.keys(contactCounts).length,
    tiers: distribution.map((d) => `${d.name}: ${d.count}`),
  });

  return distribution;
}
