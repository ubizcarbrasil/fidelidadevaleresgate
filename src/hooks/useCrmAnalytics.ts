import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { format, subMonths, startOfMonth } from "date-fns";

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
  journey_stage: "new" | "engaging" | "loyal" | "at_risk" | "lost";
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

export interface MonthlyData {
  month: string;
  earnings: number;
  redemptions: number;
  newCustomers: number;
}

export interface OpportunitySegment {
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  customers: CrmCustomer[];
}

function classifyCustomer(daysInactive: number, createdDaysAgo: number): CrmCustomer["status"] {
  if (createdDaysAgo <= 30 && daysInactive <= 30) return "new";
  if (daysInactive <= 30) return "active";
  if (daysInactive <= 60) return "at_risk";
  return "lost";
}

function classifyJourney(c: { days_inactive: number; total_earnings: number; total_redemptions: number; status: CrmCustomer["status"]; created_at: string }): CrmCustomer["journey_stage"] {
  const createdDaysAgo = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
  if (createdDaysAgo <= 30 && c.total_earnings <= 2) return "new";
  if (c.status === "lost") return "lost";
  if (c.status === "at_risk") return "at_risk";
  if (c.total_earnings >= 5 && c.total_redemptions >= 2) return "loyal";
  return "engaging";
}

function calcHealthScore(summary: { active: number; atRisk: number; lost: number; total: number }) {
  if (summary.total === 0) return 0;
  const score = ((summary.active / summary.total) * 100) - ((summary.lost / summary.total) * 30);
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function useCrmAnalytics() {
  const { currentBrandId } = useBrandGuard();

  const { data, isLoading } = useQuery({
    queryKey: ["crm-analytics-full", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return null;

      const { data: custs } = await supabase
        .from("customers")
        .select("id, name, phone, cpf, points_balance, money_balance, created_at, is_active")
        .eq("brand_id", currentBrandId)
        .eq("is_active", true);

      if (!custs || custs.length === 0) return { customers: [], monthlyData: [] };

      const customerIds = custs.map((c) => c.id);

      // Fetch earnings and redemptions in parallel
      const sixMonthsAgo = subMonths(new Date(), 6).toISOString();

      const [{ data: earnings }, { data: redemptions }] = await Promise.all([
        supabase
          .from("earning_events")
          .select("customer_id, created_at")
          .eq("brand_id", currentBrandId)
          .in("customer_id", customerIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("redemptions")
          .select("customer_id, created_at")
          .eq("brand_id", currentBrandId)
          .in("customer_id", customerIds)
          .order("created_at", { ascending: false }),
      ]);

      // Build maps
      const lastEarningMap = new Map<string, string>();
      const earningCountMap = new Map<string, number>();
      const earningsByMonth = new Map<string, number>();

      (earnings || []).forEach((e) => {
        if (!lastEarningMap.has(e.customer_id)) lastEarningMap.set(e.customer_id, e.created_at);
        earningCountMap.set(e.customer_id, (earningCountMap.get(e.customer_id) || 0) + 1);
        if (e.created_at >= sixMonthsAgo) {
          const m = format(new Date(e.created_at), "yyyy-MM");
          earningsByMonth.set(m, (earningsByMonth.get(m) || 0) + 1);
        }
      });

      const lastRedemptionMap = new Map<string, string>();
      const redemptionCountMap = new Map<string, number>();
      const redemptionsByMonth = new Map<string, number>();

      (redemptions || []).forEach((r) => {
        if (!lastRedemptionMap.has(r.customer_id)) lastRedemptionMap.set(r.customer_id, r.created_at);
        redemptionCountMap.set(r.customer_id, (redemptionCountMap.get(r.customer_id) || 0) + 1);
        if (r.created_at >= sixMonthsAgo) {
          const m = format(new Date(r.created_at), "yyyy-MM");
          redemptionsByMonth.set(m, (redemptionsByMonth.get(m) || 0) + 1);
        }
      });

      // Build monthly data for charts
      const monthlyData: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const key = format(d, "yyyy-MM");
        const monthStart = startOfMonth(d);
        const monthEnd = i > 0 ? startOfMonth(subMonths(new Date(), i - 1)) : new Date();
        const newCusts = custs.filter(c => {
          const cd = new Date(c.created_at);
          return cd >= monthStart && cd < monthEnd;
        }).length;
        monthlyData.push({
          month: format(d, "MMM"),
          earnings: earningsByMonth.get(key) || 0,
          redemptions: redemptionsByMonth.get(key) || 0,
          newCustomers: newCusts,
        });
      }

      const now = Date.now();
      const customers: CrmCustomer[] = custs.map((c) => {
        const lastEarning = lastEarningMap.get(c.id) || null;
        const lastRedemption = lastRedemptionMap.get(c.id) || null;
        const lastActivity = [lastEarning, lastRedemption].filter(Boolean).sort().pop() || c.created_at;
        const daysInactive = Math.floor((now - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
        const createdDaysAgo = Math.floor((now - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
        const status = classifyCustomer(daysInactive, createdDaysAgo);
        const totalEarnings = earningCountMap.get(c.id) || 0;
        const totalRedemptions = redemptionCountMap.get(c.id) || 0;

        const base = {
          id: c.id,
          name: c.name,
          phone: c.phone,
          cpf: c.cpf,
          points_balance: c.points_balance,
          money_balance: c.money_balance,
          created_at: c.created_at,
          last_earning_at: lastEarning,
          last_redemption_at: lastRedemption,
          total_earnings: totalEarnings,
          total_redemptions: totalRedemptions,
          days_inactive: daysInactive,
          status,
        };

        return {
          ...base,
          journey_stage: classifyJourney({ ...base, created_at: c.created_at }),
        };
      });

      return { customers, monthlyData };
    },
    enabled: !!currentBrandId,
  });

  const allCustomers = data?.customers || [];
  const monthlyData = data?.monthlyData || [];

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

  // Pareto: top 20% by total_earnings generating bulk of activity
  const sortedByEarnings = [...allCustomers].sort((a, b) => b.total_earnings - a.total_earnings);
  const paretoCount = Math.max(1, Math.ceil(allCustomers.length * 0.2));
  const paretoCustomers = sortedByEarnings.slice(0, paretoCount);
  const totalEarningsAll = allCustomers.reduce((s, c) => s + c.total_earnings, 0);
  const paretoEarningsTotal = paretoCustomers.reduce((s, c) => s + c.total_earnings, 0);
  const paretoPercentage = totalEarningsAll > 0 ? Math.round((paretoEarningsTotal / totalEarningsAll) * 100) : 0;

  // Opportunity segments
  const opportunitySegments: OpportunitySegment[] = [
    {
      key: "high_balance_no_redemption",
      label: "Alto saldo sem resgate",
      description: "Clientes com pontos acumulados que nunca resgataram",
      icon: "Target",
      color: "text-primary",
      customers: allCustomers.filter(c => c.points_balance >= 50 && c.total_redemptions === 0).sort((a, b) => b.points_balance - a.points_balance),
    },
    {
      key: "high_frequency_no_redemption",
      label: "Alta frequência sem resgate",
      description: "Clientes que pontuam frequentemente mas não resgatam",
      icon: "Zap",
      color: "text-amber-500",
      customers: allCustomers.filter(c => c.total_earnings >= 5 && c.total_redemptions === 0).sort((a, b) => b.total_earnings - a.total_earnings),
    },
    {
      key: "cooling_redeemer",
      label: "Resgatador esfriando",
      description: "Clientes que resgatavam mas estão ficando inativos",
      icon: "TrendingDown",
      color: "text-destructive",
      customers: allCustomers.filter(c => c.total_redemptions >= 2 && c.days_inactive >= 20 && c.days_inactive <= 60).sort((a, b) => b.days_inactive - a.days_inactive),
    },
    {
      key: "promising_new",
      label: "Novo cliente promissor",
      description: "Clientes novos com boa frequência inicial",
      icon: "Sparkles",
      color: "text-green-500",
      customers: allCustomers.filter(c => {
        const daysAgo = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return daysAgo <= 30 && c.total_earnings >= 3;
      }).sort((a, b) => b.total_earnings - a.total_earnings),
    },
  ];

  // Journey stages
  const journeyStages = {
    new: allCustomers.filter(c => c.journey_stage === "new"),
    engaging: allCustomers.filter(c => c.journey_stage === "engaging"),
    loyal: allCustomers.filter(c => c.journey_stage === "loyal"),
    at_risk: allCustomers.filter(c => c.journey_stage === "at_risk"),
    lost: allCustomers.filter(c => c.journey_stage === "lost"),
  };

  // Critical scenario buckets
  const criticalScenario = {
    warm: allCustomers.filter(c => c.days_inactive >= 30 && c.days_inactive < 45),
    cold: allCustomers.filter(c => c.days_inactive >= 45 && c.days_inactive < 60),
    lost60: allCustomers.filter(c => c.days_inactive >= 60 && c.days_inactive < 90),
    lost90: allCustomers.filter(c => c.days_inactive >= 90),
    neverConverted: allCustomers.filter(c => c.total_redemptions === 0 && c.total_earnings > 0),
  };

  return {
    isLoading,
    allCustomers,
    summary,
    lostCustomers,
    atRiskCustomers,
    potentialCustomers,
    highFrequency,
    newCustomers,
    monthlyData,
    paretoCustomers,
    paretoCount,
    paretoPercentage,
    paretoEarningsTotal,
    totalEarningsAll,
    opportunitySegments,
    journeyStages,
    criticalScenario,
  };
}
