import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export interface TierConfig {
  id: string;
  name: string;
  min_events: number;
  max_events: number | null;
  color: string;
  icon: string;
  order_index: number;
}

export interface TierWithCount extends TierConfig {
  count: number;
}

const DEFAULT_TIERS: Omit<TierConfig, "id">[] = [
  { name: "Galático", min_events: 500, max_events: null, color: "#8b5cf6", icon: "Rocket", order_index: 0 },
  { name: "Lendário", min_events: 101, max_events: 499, color: "#f59e0b", icon: "Crown", order_index: 1 },
  { name: "Diamante", min_events: 51, max_events: 100, color: "#06b6d4", icon: "Diamond", order_index: 2 },
  { name: "Ouro", min_events: 31, max_events: 50, color: "#eab308", icon: "Medal", order_index: 3 },
  { name: "Prata", min_events: 11, max_events: 30, color: "#94a3b8", icon: "Award", order_index: 4 },
  { name: "Bronze", min_events: 1, max_events: 10, color: "#d97706", icon: "Star", order_index: 5 },
  { name: "Iniciante", min_events: 0, max_events: 0, color: "#9ca3af", icon: "User", order_index: 6 },
];

export function useTierConfig() {
  const { currentBrandId } = useBrandGuard();

  return useQuery({
    queryKey: ["crm-tiers", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_tiers")
        .select("*")
        .eq("brand_id", currentBrandId!)
        .order("order_index");

      if (error) throw error;

      if (!data || data.length === 0) {
        return DEFAULT_TIERS.map((t, i) => ({ ...t, id: `default-${i}` })) as TierConfig[];
      }

      return data as TierConfig[];
    },
    enabled: !!currentBrandId,
  });
}

export function useTierDistribution() {
  const { currentBrandId } = useBrandGuard();
  const { data: tiers } = useTierConfig();

  return useQuery({
    queryKey: ["crm-tier-distribution", currentBrandId, tiers],
    queryFn: async () => {
      // Get event counts per contact
      const { data: events, error } = await supabase
        .from("crm_events")
        .select("contact_id")
        .eq("brand_id", currentBrandId!);

      if (error) throw error;

      // Count events per contact
      const contactCounts: Record<string, number> = {};
      (events || []).forEach((e) => {
        contactCounts[e.contact_id] = (contactCounts[e.contact_id] || 0) + 1;
      });

      // Also get contacts with 0 events
      const { data: allContacts } = await supabase
        .from("crm_contacts")
        .select("id")
        .eq("brand_id", currentBrandId!)
        .eq("is_active", true);

      (allContacts || []).forEach((c) => {
        if (!(c.id in contactCounts)) contactCounts[c.id] = 0;
      });

      const tiersToUse = tiers || DEFAULT_TIERS.map((t, i) => ({ ...t, id: `default-${i}` }));

      const distribution: TierWithCount[] = tiersToUse.map((tier) => {
        const count = Object.values(contactCounts).filter((cnt) => {
          if (tier.max_events === null) return cnt >= tier.min_events;
          if (tier.min_events === 0 && tier.max_events === 0) return cnt === 0;
          return cnt >= tier.min_events && cnt <= tier.max_events;
        }).length;

        return { ...tier, count };
      });

      return distribution;
    },
    enabled: !!currentBrandId && !!tiers,
  });
}
