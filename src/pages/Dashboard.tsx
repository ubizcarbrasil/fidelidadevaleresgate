import { useState, useEffect, useCallback, useMemo, Suspense, startTransition, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandInfo } from "@/hooks/useBrandName";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Smartphone, Swords } from "lucide-react";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useBrandScoringModels } from "@/hooks/useBrandScoringModels";
import { useStoreOwnerRedirect } from "@/hooks/useStoreOwnerRedirect";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import BranchDashboardSection from "@/components/dashboard/BranchDashboardSection";
import PlatformLogo from "@/components/PlatformLogo";

import DashboardKpiSection from "@/components/dashboard/DashboardKpiSection";
import DashboardChartsSection from "@/components/dashboard/DashboardChartsSection";
import DashboardQuickLinksSection from "@/components/dashboard/DashboardQuickLinks";
import RidesCounterCard from "@/components/dashboard/RidesCounterCard";
import AdminNotificationBell from "@/components/dashboard/AdminNotificationBell";

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

interface DashboardKpis {
  stores_active: number;
  offers_total: number;
  offers_active: number;
  customers_total: number;
  customers_active: number;
  redemptions_total: number;
  redemptions_period: number;
  redemptions_pending: number;
  store_rules_pending: number;
  earning_events_total: number;
  earning_events_period: number;
  motoristas_total: number;
  achadinhos_active: number;
  achadinhos_stores: number;
  achadinhos_cities: number;
  product_redemptions_pending: number;
  product_redemptions_month: number;
  driver_points_total: number;
  client_points_total: number;
}

function useDashboardKpis(brandFilter?: string, periodStart?: Date) {
  const monthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return useQuery<DashboardKpis>({
    queryKey: ["dashboard-kpis", brandFilter ?? "global", periodStart?.toISOString()],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_dashboard_kpis", {
        p_brand_id: brandFilter || null,
        p_period_start: periodStart?.toISOString() ?? new Date(Date.now() - 7 * 86400000).toISOString(),
        p_month_start: monthStart.toISOString(),
      });
      if (error) throw error;
      return data as DashboardKpis;
    },
    staleTime: 30_000,
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
        enqueue("dashboard-kpis", "redemptions-chart");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "machine_rides" }, () => {
        enqueue("dashboard-kpis", "earnings-chart", "ranking-pontuacao");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => {
        enqueue("dashboard-kpis");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => {
        enqueue("dashboard-kpis");
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [queryClient]);
}

/* ── Dashboard Header ── */
function DashboardHeader({ consoleScope, scopeLabels, isCityScopedView, viewingBranchId }: { consoleScope: string; scopeLabels: Record<string, string>; isCityScopedView: boolean; viewingBranchId: string | null }) {
  const { name: brandName, logoUrl: brandLogoUrl } = useBrandInfo();
  const showBrandLogo = ["BRAND", "TENANT"].includes(consoleScope);
  const greeting = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";

  const { data: branchName } = useQuery({
    queryKey: ["branch-name", viewingBranchId],
    queryFn: async () => {
      const { data } = await supabase.from("branches").select("name").eq("id", viewingBranchId!).single();
      return data?.name || "Cidade";
    },
    enabled: !!viewingBranchId,
  });

  const scopeLabel = isCityScopedView && viewingBranchId
    ? `Visão da cidade · ${branchName || "Carregando..."}`
    : scopeLabels[consoleScope];

  return (
    <div className="flex items-center gap-3">
      {showBrandLogo && (
        <PlatformLogo src={brandLogoUrl} alt={brandName} className="h-10 w-10 rounded-xl ring-1 ring-border" fallbackLabel={brandName?.substring(0, 2).toUpperCase()} />
      )}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          {greeting} 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {showBrandLogo && brandName ? `${brandName} · ` : ""}
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          {" · "}{scopeLabel}
        </p>
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodKey>("7d");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isRedirecting } = useStoreOwnerRedirect();
  const { consoleScope, currentBrandId, currentBranchId } = useBrandGuard();
  const { isDriverEnabled, isPassengerEnabled } = useBrandScoringModels();

  // Allow BRAND/TENANT/ROOT admins to view a specific branch dashboard via URL param
  const urlBranchId = searchParams.get("branchId");
  const viewingBranchId = urlBranchId && ["ROOT", "TENANT", "BRAND"].includes(consoleScope)
    ? urlBranchId
    : null;
  const isViewingBranch = !!viewingBranchId;
  const isCityScopedView = consoleScope === "BRANCH" || isViewingBranch;

  useRealtimeRefresh();

  const isRoot = consoleScope === "ROOT";
  const showTenant = ["ROOT", "TENANT"].includes(consoleScope);
  const showBrand = ["ROOT", "TENANT", "BRAND"].includes(consoleScope);
  const periodStart = getPeriodStart(period);
  const periodDays = getPeriodDays(period);
  const brandFilter = isRoot ? undefined : currentBrandId ?? undefined;

  // All metrics consolidated in a single RPC
  const { data: kpis } = useDashboardKpis(brandFilter, periodStart);

  // Chart data
  const fetchChartData = useCallback(async (table: string, extraFilter?: (q: any) => any, dateColumn = "created_at") => {
    const startDate = getPeriodStart(period);

    // Build the bucket map first
    const countByDate: Record<string, number> = {};
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      countByDate[d.toISOString().slice(0, 10)] = 0;
    }

    // Paginated fetch to avoid the 5000-row truncation
    const PAGE_SIZE = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let q = fromTable(table).select(dateColumn).gte(dateColumn, startDate.toISOString());
      if (brandFilter) q = q.eq("brand_id", brandFilter);
      if (extraFilter) q = extraFilter(q);
      q = q.order(dateColumn, { ascending: true }).range(offset, offset + PAGE_SIZE - 1);
      const { data: rows } = await q;

      for (const row of rows || []) {
        const val = (row as unknown as Record<string, unknown>)[dateColumn];
        const key = typeof val === "string" ? val.slice(0, 10) : null;
        if (key && key in countByDate) countByDate[key]++;
      }

      hasMore = (rows?.length ?? 0) === PAGE_SIZE;
      offset += PAGE_SIZE;
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
    staleTime: 60_000,
  });
  const { data: recentEarnings } = useQuery({
    queryKey: ["earnings-chart", period, brandFilter ?? "global"],
    queryFn: () => fetchChartData("machine_rides", (q: any) => q.eq("ride_status", "FINALIZED"), "finalized_at"),
    staleTime: 60_000,
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
        <DashboardHeader consoleScope={consoleScope} scopeLabels={scopeLabels} isCityScopedView={isCityScopedView} viewingBranchId={viewingBranchId} />
        <div className="flex items-center gap-3">
          <AdminNotificationBell />
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
      {!isCityScopedView && <DashboardKpiSection
        redemptionsPeriod={kpis?.redemptions_period}
        redemptionsTotal={kpis?.redemptions_total}
        customersTotal={kpis?.customers_total}
        customersActive={kpis?.customers_active}
        earningEventsPeriod={kpis?.earning_events_period}
        earningEventsTotal={kpis?.earning_events_total}
        offersActive={kpis?.offers_active}
        offersTotal={kpis?.offers_total}
        motoristasTotal={kpis?.motoristas_total}
        pontosMotoristas={kpis?.driver_points_total}
        pontosClientes={kpis?.client_points_total}
        achadinhosAtivas={kpis?.achadinhos_active}
        achadinhosLojas={kpis?.achadinhos_stores}
        achadinhosCidades={kpis?.achadinhos_cities}
        productRedemptionsPending={kpis?.product_redemptions_pending}
        productRedemptionsMonth={kpis?.product_redemptions_month}
        recentRedemptions={recentRedemptions?.map(d => d.count)}
        recentEarnings={recentEarnings?.map(d => d.count)}
        isDriverEnabled={isDriverEnabled}
        isPassengerEnabled={isPassengerEnabled}
      />}

      {/* Branch-specific dashboard */}
      {consoleScope === "BRANCH" && currentBranchId && (
        <BranchDashboardSection branchId={currentBranchId} />
      )}

      {/* Brand/Tenant/Root viewing a specific branch */}
      {isViewingBranch && viewingBranchId && (
        <BranchDashboardSection branchId={viewingBranchId} />
      )}

      {/* Sections hidden for BRANCH scope */}
      {!isCityScopedView && (
        <>
          {/* Corridas com seletor de período — só motorista */}
          {showBrand && isDriverEnabled && <RidesCounterCard brandId={brandFilter} />}

          {/* Charts, Ranking, Alerts, Heatmap, Reports */}
          <DashboardChartsSection
            combinedChart={combinedChart}
            recentRedemptions={recentRedemptions}
            brandFilter={brandFilter}
            showBrand={showBrand}
            isRoot={isRoot}
            redemptionsPending={kpis?.redemptions_pending}
            storeRulesPending={kpis?.store_rules_pending}
            isDriverEnabled={isDriverEnabled}
            isPassengerEnabled={isPassengerEnabled}
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

          {/* Gamificação Banner */}
          {showBrand && !isRoot && isDriverEnabled && (
            <Card className="border-primary/20 overflow-hidden">
              <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Swords className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm">Duelos & Ranking</h3>
                      <Badge variant="destructive" className="text-[10px] px-2 py-0">Ao Vivo</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Acompanhe duelos ao vivo, crie desafios e impulsione apostas.</p>
                  </div>
                </div>
                <Button size="sm" className="shrink-0 gap-1.5 w-full sm:w-auto" onClick={() => navigate("/gamificacao-admin")}>
                  <Swords className="h-3.5 w-3.5" /> Abrir Gamificação
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!isCityScopedView && (
        <DashboardQuickLinksSection consoleScope={consoleScope} showBrand={showBrand} isRoot={isRoot} isDriverEnabled={isDriverEnabled} isPassengerEnabled={isPassengerEnabled} />
      )}

      {/* FAB */}
      {currentBrandId && !isCityScopedView && (
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
