import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export interface CrmCustomer {
  id: string;
  name: string;
  phone: string | null;
  cpf: string | null;
  points_balance: number;
  money_balance: number;
  created_at: string;
  last_earning_at: string | null;
  last_redemption_at: string | null;
  total_earnings: number;
  total_redemptions: number;
  days_inactive: number;
  status: "active" | "at_risk" | "lost" | "new";
}

export interface CrmSummary {
  total: number;
  active: number;
  atRisk: number;
  lost: number;
  newCustomers: number;
  avgPointsBalance: number;
  healthScore: number;
}

function classifyCustomer(daysInactive: number, createdDaysAgo: number): CrmCustomer["status"] {
  if (createdDaysAgo <= 30 && daysInactive <= 30) return "new";
  if (daysInactive <= 30) return "active";
  if (daysInactive <= 60) return "at_risk";
  return "lost";
}

function calcHealthScore(summary: { active: number; atRisk: number; lost: number; total: number }) {
  if (summary.total === 0) return 0;
  const score = ((summary.active / summary.total) * 100) - ((summary.lost / summary.total) * 30);
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function useCrmAnalytics() {
  const { currentBrandId } = useBrandGuard();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["crm-analytics", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return [];

      // Fetch customers
      const { data: custs } = await supabase
        .from("customers")
        .select("id, name, phone, cpf, points_balance, money_balance, created_at, is_active")
        .eq("brand_id", currentBrandId)
        .eq("is_active", true);

      if (!custs || custs.length === 0) return [];

      const customerIds = custs.map((c) => c.id);

      // Fetch last earning per customer
      const { data: earnings } = await supabase
        .from("earning_events")
        .select("customer_id, created_at")
        .eq("brand_id", currentBrandId)
        .in("customer_id", customerIds)
        .order("created_at", { ascending: false });

      // Fetch last redemption per customer
      const { data: redemptions } = await supabase
        .from("redemptions")
        .select("customer_id, created_at")
        .eq("brand_id", currentBrandId)
        .in("customer_id", customerIds)
        .order("created_at", { ascending: false });

      // Build maps for last activity
      const lastEarningMap = new Map<string, string>();
      const earningCountMap = new Map<string, number>();
      (earnings || []).forEach((e) => {
        if (!lastEarningMap.has(e.customer_id)) lastEarningMap.set(e.customer_id, e.created_at);
        earningCountMap.set(e.customer_id, (earningCountMap.get(e.customer_id) || 0) + 1);
      });

      const lastRedemptionMap = new Map<string, string>();
      const redemptionCountMap = new Map<string, number>();
      (redemptions || []).forEach((r) => {
        if (!lastRedemptionMap.has(r.customer_id)) lastRedemptionMap.set(r.customer_id, r.created_at);
        redemptionCountMap.set(r.customer_id, (redemptionCountMap.get(r.customer_id) || 0) + 1);
      });

      const now = Date.now();

      return custs.map((c): CrmCustomer => {
        const lastEarning = lastEarningMap.get(c.id) || null;
        const lastRedemption = lastRedemptionMap.get(c.id) || null;
        const lastActivity = [lastEarning, lastRedemption].filter(Boolean).sort().pop() || c.created_at;
        const daysInactive = Math.floor((now - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
        const createdDaysAgo = Math.floor((now - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          cpf: c.cpf,
          points_balance: c.points_balance,
          money_balance: c.money_balance,
          created_at: c.created_at,
          last_earning_at: lastEarning,
          last_redemption_at: lastRedemption,
          total_earnings: earningCountMap.get(c.id) || 0,
          total_redemptions: redemptionCountMap.get(c.id) || 0,
          days_inactive: daysInactive,
          status: classifyCustomer(daysInactive, createdDaysAgo),
        };
      });
    },
    enabled: !!currentBrandId,
  });

  const allCustomers = customers || [];

  const summary: CrmSummary = {
    total: allCustomers.length,
    active: allCustomers.filter((c) => c.status === "active").length,
    atRisk: allCustomers.filter((c) => c.status === "at_risk").length,
    lost: allCustomers.filter((c) => c.status === "lost").length,
    newCustomers: allCustomers.filter((c) => c.status === "new").length,
    avgPointsBalance: allCustomers.length > 0
      ? Math.round(allCustomers.reduce((s, c) => s + c.points_balance, 0) / allCustomers.length)
      : 0,
    healthScore: calcHealthScore({
      active: allCustomers.filter((c) => c.status === "active" || c.status === "new").length,
      atRisk: allCustomers.filter((c) => c.status === "at_risk").length,
      lost: allCustomers.filter((c) => c.status === "lost").length,
      total: allCustomers.length,
    }),
  };

  const lostCustomers = allCustomers.filter((c) => c.status === "lost").sort((a, b) => b.days_inactive - a.days_inactive);
  const atRiskCustomers = allCustomers.filter((c) => c.status === "at_risk").sort((a, b) => b.days_inactive - a.days_inactive);
  const potentialCustomers = allCustomers
    .filter((c) => c.points_balance > 0 && c.total_redemptions === 0)
    .sort((a, b) => b.points_balance - a.points_balance);
  const highFrequency = allCustomers
    .filter((c) => c.total_earnings >= 5)
    .sort((a, b) => b.total_earnings - a.total_earnings);
  const newCustomers = allCustomers.filter((c) => c.status === "new").sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    isLoading,
    allCustomers,
    summary,
    lostCustomers,
    atRiskCustomers,
    potentialCustomers,
    highFrequency,
    newCustomers,
  };
}
