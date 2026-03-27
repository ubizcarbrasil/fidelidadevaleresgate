import { useState, useEffect, useCallback, memo, useMemo, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandInfo } from "@/hooks/useBrandName";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2, Store, MapPin, Users, Ticket, ShoppingBag, Tag, UserCheck,
  ReceiptText, Coins, TrendingUp, Radio, Link2, ExternalLink, Copy, LogIn,
  Globe, Eye, Smartphone, Search, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, AlertTriangle, Zap, Activity, Car,
} from "lucide-react";
import DemoStoresToggle from "@/components/DemoStoresToggle";
import { Input } from "@/components/ui/input";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useStoreOwnerRedirect } from "@/hooks/useStoreOwnerRedirect";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
const DashboardTasksSection = lazyWithRetry(() => import("@/components/dashboard/TasksSection"));
const DashboardActivityFeed = lazyWithRetry(() => import("@/components/dashboard/ActivityFeed"));
const AchadinhosAlerts = lazyWithRetry(() => import("@/components/dashboard/AchadinhosAlerts"));
const PointsFeed = lazyWithRetry(() => import("@/components/dashboard/PointsFeed"));
const PendingReportsSection = lazyWithRetry(() => import("@/components/dashboard/PendingReportsSection"));
const RankingPontuacao = lazyWithRetry(() => import("@/components/dashboard/RankingPontuacao"));

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
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "redemptions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["redemptions-count"] });
        queryClient.invalidateQueries({ queryKey: ["redemptions-chart"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "machine_rides" }, () => {
        queryClient.invalidateQueries({ queryKey: ["machine_rides-count"] });
        queryClient.invalidateQueries({ queryKey: ["earnings-chart"] });
        queryClient.invalidateQueries({ queryKey: ["pontos-summary"] });
        queryClient.invalidateQueries({ queryKey: ["ranking-pontuacao"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["customers-count"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["offers-count"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
}

/* ── KPI Card with Sparkline ── */
const KpiCard = memo(function KpiCard({ title, value, sub, icon: Icon, trend, color = "primary", sparkData }: {
  title: string; value: any; sub?: string; icon: any; trend?: number; color?: string; sparkData?: number[];
}) {
  const colorMap: Record<string, { text: string; bg: string; stroke: string }> = {
    primary: { text: "text-primary", bg: "bg-primary/10", stroke: "hsl(217 91% 60%)" },
    success: { text: "text-success", bg: "bg-success/10", stroke: "hsl(142 71% 45%)" },
    warning: { text: "text-warning", bg: "bg-warning/10", stroke: "hsl(38 92% 50%)" },
    destructive: { text: "text-destructive", bg: "bg-destructive/10", stroke: "hsl(0 84% 60%)" },
    violet: { text: "text-purple-400", bg: "bg-purple-500/10", stroke: "hsl(270 60% 60%)" },
  };
  const c = colorMap[color] || colorMap.primary;

  return (
    <Card className="saas-kpi overflow-hidden relative">
      <CardContent className="p-5">
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            {value === undefined ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{value}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {trend !== undefined && (
                <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(trend)}%
                </span>
              )}
              {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
            </div>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${c.text} ${c.bg}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {/* Sparkline */}
        {sparkData && sparkData.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData.map((v, i) => ({ v, i }))} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c.stroke} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={c.stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={c.stroke} fill={`url(#spark-${color})`} strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

/* ── Quick Links (existing logic preserved) ── */
function BrandQuickLinks() {
  const { currentBrandId } = useBrandGuard();
  const { data: brand } = useQuery({
    queryKey: ["brand-quick-links", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return null;
      const { data } = await supabase.from("brands").select("brand_settings_json, slug").eq("id", currentBrandId).single();
      return data;
    },
    enabled: !!currentBrandId,
  });
  const settings = brand?.brand_settings_json as Record<string, unknown> | null;
  const testAccounts = (settings?.test_accounts ?? undefined) as { email: string; role: string; is_active: boolean }[] | undefined;
  const origin = window.location.origin;
  const driverPublicBase = (settings?.driver_public_base_url as string) || null;

  const roleLabel: Record<string, string> = { brand_admin: "Admin", customer: "Cliente", store_admin: "Parceiro", driver: "Motorista" };
  const roleIcon: Record<string, string> = { brand_admin: "🔑", customer: "👤", store_admin: "🏪", driver: "🚗" };
  const copyText = (t: string) => { navigator.clipboard.writeText(t); toast.info("Copiado!"); };
  const openExternal = (url: string) => { const popup = window.open(url, "_blank", "noopener,noreferrer"); if (!popup) window.location.href = url; };

  if (!brand) return null;
  const hasTestAccounts = testAccounts && testAccounts.length > 0 && testAccounts.some((a) => a.is_active);

  const quickLinks = [
    { label: "App do Cliente", path: currentBrandId ? `/customer-preview?brandId=${currentBrandId}` : "/customer-preview", prodPath: "/", icon: ExternalLink, description: "Visualizar o app" },
    { label: "Cadastro Parceiro", path: "/register-store", prodPath: "/register-store", icon: ShoppingBag, description: "Formulário de parceiros" },
    { label: "Painel Parceiro", path: "/store-panel", prodPath: "/store-panel", icon: Store, description: "Gestão das lojas" },
    { label: "Achadinho Motorista", path: currentBrandId ? `/driver?brandId=${currentBrandId}` : "/driver", prodPath: currentBrandId ? `/driver?brandId=${currentBrandId}` : "/driver", icon: Car, description: "Marketplace do motorista" },
  ];

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" /> Links Úteis
            </CardTitle>
            {driverPublicBase ? (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Globe className="h-3 w-3" /> URL configurada
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">Usando domínio atual</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => {
              const internalUrl = `${origin}${link.path}`;
              const publicBase = driverPublicBase || origin;
              const prodUrl = link.label === "Achadinho Motorista" ? `${publicBase}${link.prodPath}` : null;
              return (
                <div key={link.label} className="rounded-lg border border-border p-3 space-y-2 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <link.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                  <div className="flex gap-1">
                    <Button variant="default" size="sm" className="h-7 text-xs flex-1 gap-1" onClick={() => openExternal(internalUrl)}>
                      <ExternalLink className="h-3 w-3" /> Abrir
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => copyText(internalUrl)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {prodUrl && (
                    <div className="flex gap-1 items-center">
                      <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                      <code className="text-[10px] text-muted-foreground truncate flex-1">{prodUrl}</code>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyText(prodUrl)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {hasTestAccounts && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LogIn className="h-4 w-4 text-primary" /> Acessos de Teste
              <Badge variant="outline" className="text-[10px] ml-auto">Senha: 123456</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {testAccounts!.filter((a) => a.is_active).map((acc) => (
                <div key={acc.email} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{roleIcon[acc.role] || "👤"}</span>
                    <span className="text-sm font-semibold">{roleLabel[acc.role] || acc.role}</span>
                  </div>
                  <code className="block text-xs truncate text-muted-foreground">{acc.email}</code>
                  <Button variant="outline" size="sm" className="h-7 text-xs w-full gap-1" onClick={() => copyText(`${acc.email} / 123456`)}>
                    <Copy className="h-3 w-3" /> Copiar
                  </Button>
                  {acc.role === "driver" && currentBrandId && (
                    <Button variant="outline" size="sm" className="h-7 text-xs w-full gap-1" onClick={() => openExternal(`${origin}/customer-preview?brandId=${currentBrandId}`)}>
                      <ExternalLink className="h-3 w-3" /> Abrir como Motorista
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DemoStoresSection() {
  const { currentBrandId, currentBranchId } = useBrandGuard();
  const { data: firstBranch } = useQuery({
    queryKey: ["first-branch-for-demo", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return null;
      const { data } = await supabase.from("branches").select("id").eq("brand_id", currentBrandId).eq("is_active", true).limit(1).maybeSingle();
      return data;
    },
    enabled: !!currentBrandId && !currentBranchId,
  });
  const branchId = currentBranchId || firstBranch?.id;
  if (!currentBrandId || !branchId) return null;
  return <DemoStoresToggle brandId={currentBrandId} branchId={branchId} />;
}

function AccessHubSection({ consoleScope }: { consoleScope: string }) {
  const { currentBrandId } = useBrandGuard();
  const isRoot = consoleScope === "ROOT";
  const isBrand = ["BRAND", "TENANT"].includes(consoleScope);
  const [search, setSearch] = useState("");

  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ["access-hub-brands"],
    queryFn: async () => { const { data } = await supabase.from("brands").select("id, name, slug, is_active").order("name"); return data || []; },
    enabled: isRoot,
  });
  const { data: stores, isLoading: storesLoading } = useQuery({
    queryKey: ["access-hub-stores", currentBrandId],
    queryFn: async () => { const { data } = await supabase.from("stores").select("id, name, address, approval_status").eq("brand_id", currentBrandId!).order("name"); return data || []; },
    enabled: isBrand && !!currentBrandId,
  });

  if (!isRoot && !isBrand) return null;

  if (isRoot) {
    const filtered = (brands || []).filter((b) => b.name.toLowerCase().includes(search.toLowerCase()) || b.slug.toLowerCase().includes(search.toLowerCase()));
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Painéis dos Empreendedores</CardTitle>
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar marca..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {brandsLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma marca encontrada.</p>
          ) : (
            <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
              {filtered.map((brand) => (
                <div key={brand.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 gap-2">
                   <div className="min-w-0 flex items-center gap-2">
                     <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Store className="h-4 w-4 text-primary" /></div>
                     <div><p className="text-sm font-medium truncate">{brand.name}</p><p className="text-xs text-muted-foreground">{brand.slug}</p></div>
                   </div>
                   <div className="flex gap-1.5 shrink-0">
                     <Button size="sm" variant="outline" className="h-7 text-xs gap-1 flex-1 sm:flex-none" onClick={() => { window.location.href = `/?brandId=${brand.id}`; }}><Building2 className="h-3 w-3" />Admin</Button>
                     <Button size="sm" variant="outline" className="h-7 text-xs gap-1 flex-1 sm:flex-none" onClick={() => { window.location.href = `/customer-preview?brandId=${brand.id}`; }}><Smartphone className="h-3 w-3" />App</Button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const filteredStores = (stores || []).filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Painéis dos Parceiros</CardTitle>
          <div className="flex gap-2 items-center w-full sm:w-auto">
            {currentBrandId && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 hidden sm:inline-flex" onClick={() => window.open(`/customer-preview?brandId=${currentBrandId}`, "_blank")}>
                <Smartphone className="h-3.5 w-3.5" />App do Cliente
              </Button>
            )}
            <div className="relative flex-1 sm:w-40 sm:flex-none">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar loja..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {storesLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
        ) : filteredStores.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum parceiro encontrado.</p>
        ) : (
          <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
            {filteredStores.map((store) => (
              <div key={store.id} className="flex items-center justify-between py-2.5 gap-2">
                <div className="min-w-0"><p className="text-sm font-medium truncate">{store.name}</p><p className="text-xs text-muted-foreground">{store.address || "—"}</p></div>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 shrink-0" onClick={() => window.open(`/store-panel?storeId=${store.id}`, "_blank")}><Eye className="h-3 w-3" />Ver</Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Section C: Ranking with Medals ── */
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
  const medalClass = ["medal-gold", "medal-silver", "medal-bronze"];
  const medalEmoji = ["🥇", "🥈", "🥉"];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Top Parceiros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topStores.map((store, i) => {
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

/* ── Section D: Alerts ── */
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

/* ── Section E: Activity Heatmap ── */
function ActivityHeatmap({ chartData }: { chartData?: { label: string; count: number }[] }) {
  if (!chartData || chartData.length === 0) return null;
  const maxCount = Math.max(...chartData.map(d => d.count), 1);
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  // Fill 7x4 grid from chart data
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

/* TasksTable and ActivityFeed moved to src/components/dashboard/ */

/* ── Dashboard Header with Brand Logo ── */
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
  const { consoleScope, currentBrandId } = useBrandGuard();

  useRealtimeRefresh();

  const isRoot = consoleScope === "ROOT";
  const showTenant = ["ROOT", "TENANT"].includes(consoleScope);
  const showBrand = ["ROOT", "TENANT", "BRAND"].includes(consoleScope);
  const periodStart = getPeriodStart(period);
  const periodDays = getPeriodDays(period);
  const brandFilter = isRoot ? undefined : currentBrandId ?? undefined;

  // All metrics
  const { data: tenants } = useMetric("tenants", isRoot);
  const { data: brands } = useMetric("brands", showTenant);
  const { data: branches } = useMetric("branches", true, undefined, undefined, brandFilter);
  const { data: storesTotal } = useMetric("stores", true, undefined, undefined, brandFilter);
  const { data: storesActive } = useMetric("stores", true, (q) => q.eq("is_active", true), "active", brandFilter);
  const { data: offersTotal } = useMetric("offers", true, undefined, undefined, brandFilter);
  const { data: offersActive } = useMetric("offers", true, (q) => q.eq("status", "ACTIVE").eq("is_active", true), "active", brandFilter);
  const { data: customersTotal } = useMetric("customers", true, undefined, undefined, brandFilter);
  const { data: customersActive } = useMetric("customers", true, (q) => q.eq("is_active", true), "active", brandFilter);
  const { data: redemptionsTotal } = useMetric("redemptions", true, undefined, undefined, brandFilter);
  const { data: redemptionsPending } = useMetric("redemptions", true, (q) => q.eq("status", "PENDING"), "pending", brandFilter);
  const { data: vouchersActive } = useMetric("vouchers", true, (q) => q.eq("status", "active"), "active", brandFilter);
  const { data: vouchersTotal } = useMetric("vouchers", true, undefined, undefined, brandFilter);
  const { data: usersCount } = useMetric("profiles", showBrand);
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

  // Soma de pontos motoristas e clientes via RPC
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
  const pontosMotoristas = pontosSummary?.driver_points_total;
  const pontosClientes = pontosSummary?.client_points_total;

  // Optimized: single query per table instead of N queries per day
  const fetchChartData = useCallback(async (table: string, extraFilter?: (q: any) => any) => {
    const startDate = getPeriodStart(period);
    let q = fromTable(table).select("created_at").gte("created_at", startDate.toISOString());
    if (brandFilter) q = q.eq("brand_id", brandFilter);
    if (extraFilter) q = extraFilter(q);
    q = q.order("created_at", { ascending: true }).limit(5000);
    const { data: rows } = await q;

    // Group by date on the client side (1 query instead of 30)
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

  // Combined chart data
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
      {/* ── Header ── */}
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
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
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

      {/* ── SECTION A: KPIs ── */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="animate-slide-up delay-1">
          <KpiCard title="Resgates" value={redemptionsPeriod} sub={`${redemptionsTotal ?? 0} total`} icon={ReceiptText} color="primary" sparkData={recentRedemptions?.map(d => d.count)} />
        </div>
        <div className="animate-slide-up delay-2">
          <KpiCard title="Clientes" value={customersTotal} sub={`${customersActive ?? 0} ativos`} icon={UserCheck} color="success" sparkData={recentEarnings?.map(d => d.count)} />
        </div>
        <div className="animate-slide-up delay-3">
          <KpiCard title="Pontuações" value={earningEventsPeriod} sub={`${earningEventsTotal ?? 0} total`} icon={Coins} color="primary" sparkData={recentEarnings?.map(d => d.count)} />
        </div>
        <div className="animate-slide-up delay-4">
          <KpiCard title="Ofertas Ativas" value={offersActive} sub={`${offersTotal ?? 0} total`} icon={Tag} color="violet" sparkData={recentRedemptions?.map(d => d.count)} />
        </div>
      </div>

      {/* ── SECTION A2: KPIs Motoristas ── */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="animate-slide-up delay-1">
          <KpiCard title="Motoristas" value={motoristasTotal} icon={Car} color="warning" />
        </div>
        <div className="animate-slide-up delay-2">
          <KpiCard title="Pontos Motoristas" value={pontosMotoristas !== undefined ? pontosMotoristas.toLocaleString("pt-BR") : undefined} icon={Coins} color="success" />
        </div>
        <div className="animate-slide-up delay-3">
          <KpiCard title="Pontos Clientes" value={pontosClientes !== undefined ? pontosClientes.toLocaleString("pt-BR") : undefined} icon={UserCheck} color="primary" />
        </div>
      </div>

      {/* ── SECTION A3: KPIs Achadinhos ── */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="animate-slide-up delay-1">
          <KpiCard title="Achadinhos Ativos" value={achadinhosAtivas} icon={ShoppingBag} color="warning" />
        </div>
        <div className="animate-slide-up delay-2">
          <KpiCard title="Lojas Ativas" value={achadinhosLojas} icon={Store} color="success" />
        </div>
        <div className="animate-slide-up delay-3">
          <KpiCard title="Cidades Ativas" value={achadinhosCidades} icon={MapPin} color="primary" />
        </div>
      </div>

      {/* ── SECTION B + C: Chart + Ranking ── */}
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

      {/* ── Ranking de Pontuação (Passageiros + Motoristas) ── */}
      {showBrand && !isRoot && (
        <div className="animate-slide-up delay-5">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <RankingPontuacao brandId={brandFilter} />
          </Suspense>
        </div>
      )}

      {/* ── Pontuações em Tempo Real + Achadinhos Alertas ── */}
      {showBrand && !isRoot && (
        <div className="grid gap-4 lg:grid-cols-2 animate-slide-up delay-5">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <PointsFeed brandId={brandFilter} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <AchadinhosAlerts brandId={brandFilter} />
          </Suspense>
        </div>
      )}

      {/* ── SECTION D + E: Alerts + Heatmap ── */}
      <div className="grid gap-4 lg:grid-cols-2 animate-slide-up delay-6">
        <AlertsSection redemptionsPending={redemptionsPending} storeRulesPending={storeRulesPending} />
        <ActivityHeatmap chartData={recentRedemptions} />
      </div>

      {/* ── SECTION F: Denúncias Pendentes ── */}
      <div className="animate-slide-up delay-7">
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <PendingReportsSection brandId={brandFilter} />
        </Suspense>
      </div>

      {/* ── SECTION G + H: Tasks + Activity Feed ── */}
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

      {/* Access Hub */}
      <AccessHubSection consoleScope={consoleScope} />

      {/* Quick Links & Demo (movido para o final) */}
      {showBrand && !isRoot && <BrandQuickLinks />}
      {showBrand && !isRoot && <DemoStoresSection />}

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
