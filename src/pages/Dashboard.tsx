import { useState, useEffect, useCallback, useMemo, Suspense, startTransition, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandInfo } from "@/hooks/useBrandName";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Smartphone } from "lucide-react";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useStoreOwnerRedirect } from "@/hooks/useStoreOwnerRedirect";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import BranchDashboardSection from "@/components/dashboard/BranchDashboardSection";

import DashboardKpiSection from "@/components/dashboard/DashboardKpiSection";
import DashboardChartsSection from "@/components/dashboard/DashboardChartsSection";
import DashboardQuickLinksSection from "@/components/dashboard/DashboardQuickLinks";
import RidesCounterCard from "@/components/dashboard/RidesCounterCard";

const DashboardTasksSection = lazyWithRetry(() => import("@/components/dashboard/TasksSection"));
const DashboardActivityFeed = lazyWithRetry(() => import("@/components/dashboard/ActivityFeed"));

type PeriodKey = "today" | "7d" | "30d";

function getPeriodStart(period: PeriodKey): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === "7d") d.setDate(d.getDate() - 6);
  if (period === "30d") d.setDate(d.getDate() - 29);
  return d;
}

function getPeriodDays(period: PeriodKey): number {
  return period === "today" ? 1 : period === "7d" ? 7 : 30;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- supabase.from() requires dynamic table names here
const fromTable = (table: string) => (supabase.from as (t: string) => ReturnType<typeof supabase.from>)(table);

function useMetric(table: string, enabled = true, filter?: (q: any) => any, filterKey?: string, brandId?: string) {
  return useQuery({
    queryKey: [`${table}-count`, filterKey ?? "all", brandId ?? "global"],
    queryFn: async () => {
      let q = fromTable(table).select("*", { count: "exact", head: true });
      if (brandId) q = q.eq("brand_id", brandId);
      if (filter) q = filter(q);
      const { count } = await q;
      return count || 0;
    },
    enabled,
  });
}

function useRealtimeRefresh() {
  const queryClient = useQueryClient();
  const pendingKeys = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const flush = () => {
      const keys = Array.from(pendingKeys.current);
      pendingKeys.current.clear();
      timerRef.current = null;
      startTransition(() => {
        keys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
      });
    };

    const enqueue = (...queryKeys: string[]) => {
      queryKeys.forEach((k) => pendingKeys.current.add(k));
      if (!timerRef.current) timerRef.current = setTimeout(flush, 120);
    };

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "redemptions" }, () => {
        enqueue("redemptions-count", "redemptions-chart");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "machine_rides" }, () => {
        enqueue("machine_rides-count", "earnings-chart", "pontos-summary", "ranking-pontuacao");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => {
        enqueue("customers-count");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => {
        enqueue("offers-count");
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [queryClient]);
}

/* ── Dashboard Header ── */
function DashboardHeader({ consoleScope, scopeLabels }: { consoleScope: string; scopeLabels: Record<string, string> }) {
  const { name: brandName, logoUrl: brandLogoUrl } = useBrandInfo();
  const showBrandLogo = ["BRAND", "TENANT"].includes(consoleScope);
  const greeting = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="flex items-center gap-3">
      {showBrandLogo && brandLogoUrl ? (
        <img src={brandLogoUrl} alt={brandName} className="h-10 w-10 rounded-xl object-cover ring-1 ring-border shrink-0" />
      ) : showBrandLogo && brandName ? (
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-primary">{brandName.substring(0, 2).toUpperCase()}</span>
        </div>
      ) : null}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          {greeting} 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {showBrandLogo && brandName ? `${brandName} · ` : ""}
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          {" · "}{scopeLabels[consoleScope]}
        </p>
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodKey>("7d");
  const navigate = useNavigate();
  const { isRedirecting } = useStoreOwnerRedirect();
  const { consoleScope, currentBrandId, currentBranchId } = useBrandGuard();

  useRealtimeRefresh();

  const isRoot = consoleScope === "ROOT";
  const showTenant = ["ROOT", "TENANT"].includes(consoleScope);
  const showBrand = ["ROOT", "TENANT", "BRAND"].includes(consoleScope);
  const periodStart = getPeriodStart(period);
  const periodDays = getPeriodDays(period);
  const brandFilter = isRoot ? undefined : currentBrandId ?? undefined;

  // All metrics
  const { data: storesActive } = useMetric("stores", true, (q) => q.eq("is_active", true), "active", brandFilter);
  const { data: offersTotal } = useMetric("offers", true, undefined, undefined, brandFilter);
  const { data: offersActive } = useMetric("offers", true, (q) => q.eq("status", "ACTIVE").eq("is_active", true), "active", brandFilter);
  const { data: customersTotal } = useMetric("customers", true, undefined, undefined, brandFilter);
  const { data: customersActive } = useMetric("customers", true, (q) => q.eq("is_active", true), "active", brandFilter);
  const { data: redemptionsTotal } = useMetric("redemptions", true, undefined, undefined, brandFilter);
  const { data: redemptionsPending } = useMetric("redemptions", true, (q) => q.eq("status", "PENDING"), "pending", brandFilter);
  const { data: storeRulesPending } = useMetric("store_points_rules", true, (q) => q.eq("status", "PENDING_APPROVAL"), "pending", brandFilter);
  const { data: earningEventsTotal } = useMetric("machine_rides", true, (q: any) => q.eq("ride_status", "FINALIZED"), "finished", brandFilter);
  const { data: earningEventsPeriod } = useMetric("machine_rides", true, (q: any) => q.eq("ride_status", "FINALIZED").gte("created_at", periodStart.toISOString()), `finished-period-${period}`, brandFilter);
  const { data: redemptionsPeriod } = useMetric("redemptions", true, (q) => q.gte("created_at", periodStart.toISOString()), `period-${period}`, brandFilter);
  const { data: motoristasTotal } = useMetric("customers", true, (q) => q.ilike("name", "%[MOTORISTA]%"), "motoristas", brandFilter);

  // Achadinhos KPIs
  const { data: achadinhosAtivas } = useMetric("affiliate_deals", true, (q) => q.eq("is_active", true), "achadinhos-active", brandFilter);
  const { data: achadinhosLojas } = useQuery({
    queryKey: ["achadinhos-stores-count", brandFilter ?? "global"],
    queryFn: async () => {
      let q = supabase.from("affiliate_deals").select("store_name").eq("is_active", true);
      if (brandFilter) q = q.eq("brand_id", brandFilter);
      const { data } = await q.limit(1000);
      const unique = new Set((data || []).map((d: any) => d.store_name).filter(Boolean));
      return unique.size;
    },
  });
  const { data: achadinhosCidades } = useMetric("branches", true, (q) => q.eq("is_active", true), "branches-active", brandFilter);

  // Pontos summary via RPC
  const { data: pontosSummary } = useQuery({
    queryKey: ["pontos-summary", brandFilter ?? "global"],
    queryFn: async () => {
      if (!brandFilter) return { driver_points_total: 0, client_points_total: 0 };
      const { data, error } = await supabase.rpc("get_points_summary", { p_brand_id: brandFilter } as any);
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return {
        driver_points_total: Number(row?.driver_points_total ?? 0),
        client_points_total: Number(row?.client_points_total ?? 0),
      };
    },
    enabled: !!brandFilter,
  });

  // Chart data
  const fetchChartData = useCallback(async (table: string, extraFilter?: (q: any) => any) => {
    const startDate = getPeriodStart(period);
    let q = fromTable(table).select("created_at").gte("created_at", startDate.toISOString());
    if (brandFilter) q = q.eq("brand_id", brandFilter);
    if (extraFilter) q = extraFilter(q);
    q = q.order("created_at", { ascending: true }).limit(5000);
    const { data: rows } = await q;

    const countByDate: Record<string, number> = {};
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      countByDate[key] = 0;
    }
    for (const row of rows || []) {
      const created = (row as Record<string, unknown>).created_at;
      const key = typeof created === "string" ? created.slice(0, 10) : null;
      if (key && key in countByDate) countByDate[key]++;
    }

    return Object.entries(countByDate).map(([dateStr, count]) => {
      const d = new Date(dateStr + "T12:00:00");
      const fmt = periodDays <= 7
        ? d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")
        : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      return { label: fmt, count };
    });
  }, [period, periodDays, brandFilter]);

  const { data: recentRedemptions } = useQuery({
    queryKey: ["redemptions-chart", period, brandFilter ?? "global"],
    queryFn: () => fetchChartData("redemptions"),
  });
  const { data: recentEarnings } = useQuery({
    queryKey: ["earnings-chart", period, brandFilter ?? "global"],
    queryFn: () => fetchChartData("machine_rides", (q: any) => q.eq("ride_status", "FINALIZED")),
  });

  const combinedChart = useMemo(() => {
    if (!recentRedemptions || !recentEarnings) return null;
    return recentRedemptions.map((r, i) => ({
      label: r.label,
      resgates: r.count,
      pontuacoes: recentEarnings[i]?.count || 0,
    }));
  }, [recentRedemptions, recentEarnings]);

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const scopeLabels: Record<string, string> = {
    ROOT: "Visão geral da plataforma",
    TENANT: "Visão geral da empresa",
    BRAND: "Visão geral da marca",
    BRANCH: "Visão geral da cidade",
    OPERATOR: "Operador do Ponto de Venda",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <DashboardHeader consoleScope={consoleScope} scopeLabels={scopeLabels} />
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 text-xs font-normal border-success/30 text-success">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-40 dot-pulse" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            Tempo real
          </Badge>
          <Select value={period} onValueChange={(v) => startTransition(() => setPeriod(v as PeriodKey))}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs — hidden for BRANCH scope */}
      {consoleScope !== "BRANCH" && <DashboardKpiSection
        redemptionsPeriod={redemptionsPeriod}
        redemptionsTotal={redemptionsTotal}
        customersTotal={customersTotal}
        customersActive={customersActive}
        earningEventsPeriod={earningEventsPeriod}
        earningEventsTotal={earningEventsTotal}
        offersActive={offersActive}
        offersTotal={offersTotal}
        motoristasTotal={motoristasTotal}
        pontosMotoristas={pontosSummary?.driver_points_total}
        pontosClientes={pontosSummary?.client_points_total}
        achadinhosAtivas={achadinhosAtivas}
        achadinhosLojas={achadinhosLojas}
        achadinhosCidades={achadinhosCidades}
        recentRedemptions={recentRedemptions?.map(d => d.count)}
        recentEarnings={recentEarnings?.map(d => d.count)}
      />}

      {/* Branch-specific dashboard */}
      {consoleScope === "BRANCH" && currentBranchId && (
        <BranchDashboardSection branchId={currentBranchId} />
      )}

      {/* Corridas com seletor de período */}
      {showBrand && <RidesCounterCard brandId={brandFilter} />}

      {/* Charts, Ranking, Alerts, Heatmap, Reports */}
      <DashboardChartsSection
        combinedChart={combinedChart}
        recentRedemptions={recentRedemptions}
        brandFilter={brandFilter}
        showBrand={showBrand}
        isRoot={isRoot}
        redemptionsPending={redemptionsPending}
        storeRulesPending={storeRulesPending}
      />

      {/* Tasks + Activity Feed */}
      <div className="grid gap-4 lg:grid-cols-2 animate-slide-up delay-7">
        <Suspense fallback={<Skeleton className="h-48 w-full" />}><DashboardTasksSection /></Suspense>
        <Suspense fallback={<Skeleton className="h-48 w-full" />}><DashboardActivityFeed /></Suspense>
      </div>

      {/* CRM Banner */}
      {showBrand && !isRoot && (
        <Card className="border-primary/20 overflow-hidden">
          <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-sm">CRM Estratégico</h3>
                  <Badge className="text-[10px] px-2 py-0">30 dias grátis</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Diagnóstico do negócio, clientes perdidos e potenciais.</p>
              </div>
            </div>
            <Button size="sm" className="shrink-0 gap-1.5 w-full sm:w-auto" onClick={() => navigate("/crm")}>
              <TrendingUp className="h-3.5 w-3.5" /> Abrir CRM
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Links, Access Hub, Demo */}
      <DashboardQuickLinksSection consoleScope={consoleScope} showBrand={showBrand} isRoot={isRoot} />

      {/* FAB */}
      {currentBrandId && (
        <button
          onClick={() => window.open(`/customer-preview?brandId=${currentBrandId}`, "_blank")}
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 shadow-lg hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/20"
        >
          <Smartphone className="h-4 w-4" />
          <span className="hidden sm:inline text-xs font-semibold">App do Cliente</span>
        </button>
      )}
    </div>
  );
}
