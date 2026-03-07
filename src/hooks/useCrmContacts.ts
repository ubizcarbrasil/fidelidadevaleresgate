import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export interface CrmContact {
  id: string;
  brand_id: string;
  branch_id: string | null;
  customer_id: string | null;
  external_id: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  cpf: string | null;
  gender: string | null;
  os_platform: string | null;
  source: string;
  latitude: number | null;
  longitude: number | null;
  tags_json: any;
  metadata_json: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrmEvent {
  id: string;
  brand_id: string;
  contact_id: string;
  event_type: string;
  event_subtype: string | null;
  latitude: number | null;
  longitude: number | null;
  payload_json: any;
  created_at: string;
}

interface UseCrmContactsOptions {
  source?: string;
  gender?: string;
  os_platform?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useCrmContacts(options: UseCrmContactsOptions = {}) {
  const { currentBrandId } = useBrandGuard();
  const { source, gender, os_platform, search, page = 0, pageSize = 50 } = options;

  return useQuery({
    queryKey: ["crm-contacts", currentBrandId, source, gender, os_platform, search, page],
    queryFn: async () => {
      let query = supabase
        .from("crm_contacts")
        .select("*", { count: "exact" })
        .eq("brand_id", currentBrandId!)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (source) query = query.eq("source", source);
      if (gender) query = query.eq("gender", gender);
      if (os_platform) query = query.eq("os_platform", os_platform);
      if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);

      const { data, error, count } = await query;
      if (error) throw error;
      return { contacts: (data || []) as CrmContact[], total: count || 0 };
    },
    enabled: !!currentBrandId,
  });
}

export function useCrmContactEvents(contactId: string | null) {
  return useQuery({
    queryKey: ["crm-contact-events", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_events")
        .select("*")
        .eq("contact_id", contactId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as CrmEvent[];
    },
    enabled: !!contactId,
  });
}

export function useCrmContactStats() {
  const { currentBrandId } = useBrandGuard();

  return useQuery({
    queryKey: ["crm-contact-stats", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_contacts")
        .select("source, gender, os_platform")
        .eq("brand_id", currentBrandId!)
        .eq("is_active", true);

      if (error) throw error;
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
    },
    enabled: !!currentBrandId,
  });
}

export function useCrmEventStats() {
  const { currentBrandId } = useBrandGuard();

  return useQuery({
    queryKey: ["crm-event-stats", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_events")
        .select("event_type, created_at")
        .eq("brand_id", currentBrandId!)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      const events = data || [];

      const byType: Record<string, number> = {};
      events.forEach((e) => {
        byType[e.event_type] = (byType[e.event_type] || 0) + 1;
      });

      return { total: events.length, byType };
    },
    enabled: !!currentBrandId,
  });
}
