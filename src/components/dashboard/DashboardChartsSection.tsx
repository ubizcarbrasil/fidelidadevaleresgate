import { Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface IntegratedBranch {
  branch_id: string;
  branch_name: string;
}

function useIntegratedBranches(brandId?: string) {
  return useQuery({
    queryKey: ["integrated-branches", brandId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("machine_integrations")
        .select("branch_id, branches(name)")
        .eq("brand_id", brandId!)
        .eq("is_active", true);
      return ((data || []) as any[])
        .filter((d: any) => d.branch_id && d.branches?.name)
        .map((d: any) => ({ branch_id: d.branch_id, branch_name: d.branches.name })) as IntegratedBranch[];
    },
    enabled: !!brandId,
  });
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Store, AlertTriangle, Activity, ReceiptText } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const RankingPontuacao = lazyWithRetry(() => import("@/components/dashboard/RankingPontuacao"));
const PointsFeed = lazyWithRetry(() => import("@/components/dashboard/PointsFeed"));
const AchadinhosAlerts = lazyWithRetry(() => import("@/components/dashboard/AchadinhosAlerts"));
const PendingReportsSection = lazyWithRetry(() => import("@/components/dashboard/PendingReportsSection"));

/* ── Ranking Section ── */
function RankingSection({ brandFilter }: { brandFilter?: string }) {
  const { data: topStores } = useQuery({
    queryKey: ["top-stores-ranking", brandFilter ?? "global"],
    queryFn: async () => {
      let q = supabase.from("stores").select("id, name, logo_url").eq("is_active", true);
      if (brandFilter) q = q.eq("brand_id", brandFilter);
      const { data } = await q.limit(6).order("created_at", { ascending: false });
      return data || [];
    },
  });

  if (!topStores || topStores.length === 0) return null;
  const maxVal = topStores.length;
  const medalEmoji = ["🥇", "🥈", "🥉"];
  const medalClass = ["medal-gold", "medal-silver", "medal-bronze"];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Top Parceiros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topStores.map((store: any, i: number) => {
          const pct = ((maxVal - i) / maxVal) * 100;
          return (
            <div key={store.id} className="flex items-center gap-3">
              {i < 3 ? (
                <span className={`text-sm w-5 text-center ${medalClass[i]}`}>{medalEmoji[i]}</span>
              ) : (
                <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
              )}
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="h-7 w-7 rounded-full object-cover ring-1 ring-border shrink-0" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{store.name}</p>
                <div className="mt-1 h-1.5 rounded-full bg-accent overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ── Alerts Section ── */
function AlertsSection({ redemptionsPending, storeRulesPending }: { redemptionsPending?: number; storeRulesPending?: number }) {
  const alerts = useMemo(() => {
    const list: { label: string; icon: any; color: string; count: number; action: string; href: string }[] = [];
    if ((redemptionsPending ?? 0) > 0) list.push({ label: "Resgates pendentes", icon: ReceiptText, color: "destructive", count: redemptionsPending!, action: "Ver", href: "/redemptions" });
    if ((storeRulesPending ?? 0) > 0) list.push({ label: "Regras aguardando aprovação", icon: AlertTriangle, color: "warning", count: storeRulesPending!, action: "Aprovar", href: "/approve-store-rules" });
    return list;
  }, [redemptionsPending, storeRulesPending]);

  if (alerts.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Alertas Operacionais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert) => (
          <div key={alert.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-accent/30 border border-border hover:border-destructive/30 transition-colors">
            <div className="relative">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 saas-badge-${alert.color}`}>
                <alert.icon className="h-4 w-4" />
              </div>
              {alert.color === "destructive" && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive dot-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{alert.label}</p>
              <p className="text-[11px] text-muted-foreground">{alert.count} item{alert.count > 1 ? "s" : ""}</p>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={() => window.location.href = alert.href}>
              {alert.action}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ── Activity Heatmap ── */
function ActivityHeatmap({ chartData }: { chartData?: { label: string; count: number }[] }) {
  if (!chartData || chartData.length === 0) return null;
  const maxCount = Math.max(...chartData.map(d => d.count), 1);
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const cells: { label: string; value: number }[] = [];
  for (let w = 0; w < 4; w++) {
    for (let d = 0; d < 7; d++) {
      const idx = w * 7 + d;
      const item = chartData[idx];
      cells.push({ label: item?.label || "", value: item?.count || 0 });
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Mapa de Atividade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {days.map(d => <span key={d} className="text-[9px] text-muted-foreground text-center">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.slice(0, 28).map((cell, i) => {
              const intensity = cell.value / maxCount;
              const opacity = cell.value === 0 ? 0.08 : 0.15 + intensity * 0.85;
              return (
                <div
                  key={i}
                  className="heatmap-cell aspect-square rounded-md relative group cursor-default"
                  style={{ background: `hsl(217 91% 60% / ${opacity})` }}
                >
                  {cell.value > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-popover border border-border text-[10px] text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                      {cell.label}: {cell.value}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[9px] text-muted-foreground">Menos</span>
          {[0.08, 0.25, 0.5, 0.75, 1].map((o, i) => (
            <div key={i} className="h-2.5 w-2.5 rounded-sm" style={{ background: `hsl(217 91% 60% / ${o})` }} />
          ))}
          <span className="text-[9px] text-muted-foreground">Mais</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Main Charts Section ── */
interface DashboardChartsSectionProps {
  combinedChart: { label: string; resgates: number; pontuacoes: number }[] | null;
  recentRedemptions?: { label: string; count: number }[];
  brandFilter?: string;
  showBrand: boolean;
  isRoot: boolean;
  redemptionsPending?: number;
  storeRulesPending?: number;
  isDriverEnabled?: boolean;
  isPassengerEnabled?: boolean;
}

export default function DashboardChartsSection({
  combinedChart, recentRedemptions, brandFilter,
  showBrand, isRoot, redemptionsPending, storeRulesPending,
  isDriverEnabled = true, isPassengerEnabled = true,
}: DashboardChartsSectionProps) {
  const shouldShowPointsFeed = isDriverEnabled || isPassengerEnabled;
  const { data: integratedBranches } = useIntegratedBranches(brandFilter);

  return (
    <>
      {/* Chart + Ranking */}
      <div className="grid gap-4 lg:grid-cols-3 animate-slide-up delay-5">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Visão Geral</CardTitle>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Resgates</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Pontuações</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!combinedChart ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={combinedChart} style={{ cursor: "crosshair" }}>
                  <defs>
                    <linearGradient id="gradResgates" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPontuacoes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(215 16% 65%)" }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(215 16% 65%)" }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(215 25% 27%)",
                      background: "hsl(217 33% 17% / 0.95)",
                      backdropFilter: "blur(12px)",
                      color: "hsl(210 40% 98%)",
                      fontSize: 12,
                    }}
                    cursor={{ stroke: "hsl(217 91% 60% / 0.2)", strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="resgates" name="Resgates" stroke="hsl(217 91% 60%)" fill="url(#gradResgates)" strokeWidth={2} />
                  <Area type="monotone" dataKey="pontuacoes" name="Pontuações" stroke="hsl(142 71% 45%)" fill="url(#gradPontuacoes)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <RankingSection brandFilter={brandFilter} />
      </div>

      {/* Ranking de Pontuação */}
      {showBrand && !isRoot && (
        <div className="animate-slide-up delay-5">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <RankingPontuacao brandId={brandFilter} isDriverEnabled={isDriverEnabled} isPassengerEnabled={isPassengerEnabled} integratedBranches={integratedBranches || []} />
          </Suspense>
        </div>
      )}

      {/* Pontuações em Tempo Real + Achadinhos Alertas */}
      {showBrand && !isRoot && shouldShowPointsFeed && (
        <div className="grid gap-4 lg:grid-cols-2 animate-slide-up delay-5">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <PointsFeed brandId={brandFilter} isDriverEnabled={isDriverEnabled} isPassengerEnabled={isPassengerEnabled} integratedBranches={integratedBranches || []} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <AchadinhosAlerts brandId={brandFilter} />
          </Suspense>
        </div>
      )}

      {/* Alerts + Heatmap */}
      <div className="grid gap-4 lg:grid-cols-2 animate-slide-up delay-6">
        <AlertsSection redemptionsPending={redemptionsPending} storeRulesPending={storeRulesPending} />
        <ActivityHeatmap chartData={recentRedemptions} />
      </div>

      {/* Denúncias Pendentes */}
      <div className="animate-slide-up delay-7">
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <PendingReportsSection brandId={brandFilter} />
        </Suspense>
      </div>
    </>
  );
}
