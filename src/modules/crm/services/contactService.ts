/**
 * CRM Contact Service — camada de acesso a dados isolada.
 * Nenhuma dependência de React aqui. Apenas Supabase queries.
 */
import { supabase } from "@/integrations/supabase/client";
import { createLogger } from "@/lib/logger";
import type { CrmContact, CrmEvent, CrmContactsQueryOptions, ContactStats, EventStats } from "../types";

const log = createLogger("crm:contacts");

export async function fetchContacts(
  brandId: string,
  options: CrmContactsQueryOptions = {}
): Promise<{ contacts: CrmContact[]; total: number }> {
  const { source, gender, os_platform, search, page = 0, pageSize = 50 } = options;

  log.debug("Fetching contacts", { brandId, options });

  let query = supabase
    .from("crm_contacts")
    .select("*", { count: "exact" })
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (source) query = query.eq("source", source);
  if (gender) query = query.eq("gender", gender);
  if (os_platform) query = query.eq("os_platform", os_platform);
  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    log.error("Failed to fetch contacts", error);
    throw error;
  }

  log.info("Contacts fetched", { count: count || 0, page });
  return { contacts: (data || []) as CrmContact[], total: count || 0 };
}

export async function fetchContactEvents(contactId: string): Promise<CrmEvent[]> {
  log.debug("Fetching contact events", { contactId });

  const { data, error } = await supabase
    .from("crm_events")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    log.error("Failed to fetch contact events", error);
    throw error;
  }

  return (data || []) as CrmEvent[];
}

export async function fetchContactStats(brandId: string): Promise<ContactStats> {
  log.debug("Fetching contact stats", { brandId });

  const { data, error } = await supabase
    .from("crm_contacts")
    .select("source, gender, os_platform")
    .eq("brand_id", brandId)
    .eq("is_active", true);

  if (error) {
    log.error("Failed to fetch contact stats", error);
    throw error;
  }

  const contacts = data || [];
  const bySource: Record<string, number> = {};
  const byGender: Record<string, number> = {};
  const byOS: Record<string, number> = {};

  contacts.forEach((c) => {
    bySource[c.source || "UNKNOWN"] = (bySource[c.source || "UNKNOWN"] || 0) + 1;
    if (c.gender) byGender[c.gender] = (byGender[c.gender] || 0) + 1;
    if (c.os_platform) byOS[c.os_platform] = (byOS[c.os_platform] || 0) + 1;
  });

  return { total: contacts.length, bySource, byGender, byOS };
}

export async function fetchEventStats(brandId: string): Promise<EventStats> {
  log.debug("Fetching event stats", { brandId });

  const { data, error } = await supabase
    .from("crm_events")
    .select("event_type, created_at")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    log.error("Failed to fetch event stats", error);
    throw error;
  }

  const events = data || [];
  const byType: Record<string, number> = {};
  events.forEach((e) => {
    byType[e.event_type] = (byType[e.event_type] || 0) + 1;
  });

  return { total: events.length, byType };
}
