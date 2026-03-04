import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Store, MapPin, Users, Ticket, ShoppingBag, Tag, UserCheck, ReceiptText, Coins, TrendingUp, Radio, Link2, ExternalLink, Copy, LogIn, Globe, AlertCircle } from "lucide-react";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useStoreOwnerRedirect } from "@/hooks/useStoreOwnerRedirect";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

function useMetric(table: string, enabled = true, filter?: (q: any) => any, filterKey?: string) {
  return useQuery({
    queryKey: [`${table}-count`, filterKey ?? "all"],
    queryFn: async () => {
      let q = (supabase.from as any)(table).select("*", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count } = await q;
      return count || 0;
    },
    enabled,
  });
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))"];

/** Hook to subscribe to realtime changes and auto-invalidate queries */
function useRealtimeRefresh() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "redemptions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["redemptions-count"] });
        queryClient.invalidateQueries({ queryKey: ["redemptions-chart"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "earning_events" }, () => {
        queryClient.invalidateQueries({ queryKey: ["earning_events-count"] });
        queryClient.invalidateQueries({ queryKey: ["earnings-chart"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["customers-count"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["offers-count"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

function BrandQuickLinks() {
  const { currentBrandId } = useBrandGuard();

  const { data: brand } = useQuery({
    queryKey: ["brand-quick-links", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return null;
      const { data } = await supabase
        .from("brands")
        .select("brand_settings_json, slug")
        .eq("id", currentBrandId)
        .single();
      return data;
    },
    enabled: !!currentBrandId,
  });

  const { data: domain } = useQuery({
    queryKey: ["brand-domain", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return null;
      const { data } = await supabase
        .from("brand_domains")
        .select("domain, subdomain")
        .eq("brand_id", currentBrandId)
        .eq("is_primary", true)
        .maybeSingle();
      return data;
    },
    enabled: !!currentBrandId,
  });

  const settings = brand?.brand_settings_json as any;
  const testAccounts = settings?.test_accounts as
    | { email: string; role: string; is_active: boolean }[]
    | undefined;

  const origin = window.location.origin;
  const customDomain = domain?.domain || domain?.subdomain || null;
  const productionUrl = customDomain
    ? `https://${customDomain.replace(/^https?:\/\//i, "").trim().replace(/\/$/, "")}`
    : null;

  const roleLabel: Record<string, string> = {
    brand_admin: "Admin",
    customer: "Cliente",
    store_admin: "Parceiro",
  };
  const roleIcon: Record<string, string> = {
    brand_admin: "🔑",
    customer: "👤",
    store_admin: "🏪",
  };
  const roleColor: Record<string, string> = {
    brand_admin: "bg-primary/10 border-primary/20",
    customer: "bg-green-500/10 border-green-500/20",
    store_admin: "bg-amber-500/10 border-amber-500/20",
  };

  const copyText = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.info("Copiado!");
  };

  const openExternal = (url: string) => {
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) {
      window.location.href = url;
    }
  };

  if (!brand) return null;

  const hasTestAccounts = testAccounts && testAccounts.length > 0 && testAccounts.some((a) => a.is_active);

  const quickLinks = [
    { label: "App do Cliente (PWA)", path: "/customer-preview", prodPath: "/", icon: ExternalLink, description: "Visualizar o app como cliente" },
    { label: "Cadastro de Parceiro", path: "/register-store", prodPath: "/register-store", icon: ShoppingBag, description: "Formulário de cadastro para novos parceiros" },
    { label: "Painel do Parceiro", path: "/store-panel", prodPath: "/store-panel", icon: Store, description: "Painel de gestão das lojas parceiras" },
  ];

  return (
    <div className="space-y-4">
      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              Links Úteis
            </CardTitle>
            {productionUrl ? (
              <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/30 text-amber-600">
                <AlertCircle className="h-3 w-3" />
                DNS pendente
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">Sem domínio próprio</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {quickLinks.map((link) => {
              const internalUrl = `${origin}${link.path}`;
              const prodUrl = productionUrl ? `${productionUrl}${link.prodPath === "/" ? "" : link.prodPath}` : null;
              return (
                <div key={link.label} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <link.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{link.description}</p>

                  {/* Primary: internal link (works now) */}
                  <div className="flex gap-1">
                    <Button variant="default" size="sm" className="h-7 text-xs flex-1 gap-1" onClick={() => openExternal(internalUrl)}>
                      <ExternalLink className="h-3 w-3" /> Abrir
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => copyText(internalUrl)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Secondary: production domain */}
                  {prodUrl && (
                    <div className="flex gap-1 items-center">
                      <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                      <code className="text-[10px] text-muted-foreground truncate flex-1" title={prodUrl}>{prodUrl}</code>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyText(prodUrl)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {productionUrl && (
            <p className="text-[10px] text-muted-foreground mt-3">
              ⚠️ O domínio de produção requer configuração DNS (A record → 185.158.133.1). Use os links internos acima enquanto o DNS não estiver ativo.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Test Accounts */}
      {hasTestAccounts && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LogIn className="h-4 w-4 text-primary" />
              Acessos Rápidos de Teste
              <Badge variant="secondary" className="text-[10px] ml-auto">Senha: 123456</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {testAccounts!
                .filter((a) => a.is_active)
                .map((acc) => (
                  <div key={acc.email} className={`rounded-lg border p-3 space-y-2 ${roleColor[acc.role] || ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{roleIcon[acc.role] || "👤"}</span>
                      <span className="text-sm font-semibold">{roleLabel[acc.role] || acc.role}</span>
                    </div>
                    <code className="block text-xs truncate">{acc.email}</code>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs w-full gap-1"
                      onClick={() => {
                        copyText(`${acc.email} / 123456`);
                      }}
                    >
                      <Copy className="h-3 w-3" /> Copiar credenciais
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodKey>("7d");
  const { isRedirecting } = useStoreOwnerRedirect();
  const { consoleScope } = useBrandGuard();

  // Enable realtime refresh
  useRealtimeRefresh();

  const isRoot = consoleScope === "ROOT";
  const showTenant = ["ROOT", "TENANT"].includes(consoleScope);
  const showBrand = ["ROOT", "TENANT", "BRAND"].includes(consoleScope);
  const periodStart = getPeriodStart(period);
  const periodDays = getPeriodDays(period);

  const { data: tenants } = useMetric("tenants", isRoot);
  const { data: brands } = useMetric("brands", showTenant);
  const { data: branches } = useMetric("branches");
  const { data: storesTotal } = useMetric("stores");
  const { data: storesActive } = useMetric("stores", true, (q: any) => q.eq("is_active", true), "active");
  const { data: offersTotal } = useMetric("offers");
  const { data: offersActive } = useMetric("offers", true, (q: any) => q.eq("status", "ACTIVE").eq("is_active", true), "active");
  const { data: offersDraft } = useMetric("offers", true, (q: any) => q.eq("status", "DRAFT"), "draft");
  const { data: offersExpired } = useMetric("offers", true, (q: any) => q.eq("status", "EXPIRED"), "expired");
  const { data: customersTotal } = useMetric("customers");
  const { data: customersActive } = useMetric("customers", true, (q: any) => q.eq("is_active", true), "active");
  const { data: redemptionsTotal } = useMetric("redemptions");
  const { data: redemptionsUsed } = useMetric("redemptions", true, (q: any) => q.eq("status", "USED"), "used");
  const { data: redemptionsPending } = useMetric("redemptions", true, (q: any) => q.eq("status", "PENDING"), "pending");
  const { data: vouchersTotal } = useMetric("vouchers");
  const { data: vouchersActive } = useMetric("vouchers", true, (q: any) => q.eq("status", "active"), "active");
  const { data: usersCount } = useMetric("profiles", showBrand);
  const { data: storeRulesTotal } = useMetric("store_points_rules");
  const { data: storeRulesActive } = useMetric("store_points_rules", true, (q: any) => q.eq("status", "ACTIVE"), "active");
  const { data: storeRulesPending } = useMetric("store_points_rules", true, (q: any) => q.eq("status", "PENDING_APPROVAL"), "pending");
  const { data: storeRulesRejected } = useMetric("store_points_rules", true, (q: any) => q.eq("status", "REJECTED"), "rejected");
  const { data: earningEventsTotal } = useMetric("earning_events");
  const { data: earningEventsPeriod } = useMetric("earning_events", true, (q: any) => q.gte("created_at", periodStart.toISOString()), `period-${period}`);

  const { data: redemptionsPeriod } = useMetric("redemptions", true, (q: any) => q.gte("created_at", periodStart.toISOString()), `period-${period}`);

  // Redemptions chart for selected period
  const fetchChartData = useCallback(async (table: string) => {
    const days: { label: string; count: number }[] = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      const { count } = await (supabase.from as any)(table)
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
      const fmt = periodDays <= 7
        ? d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")
        : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      days.push({ label: fmt, count: count || 0 });
    }
    return days;
  }, [periodDays]);

  const { data: recentRedemptions } = useQuery({
    queryKey: ["redemptions-chart", period],
    queryFn: () => fetchChartData("redemptions"),
  });

  const { data: recentEarnings } = useQuery({
    queryKey: ["earnings-chart", period],
    queryFn: () => fetchChartData("earning_events"),
  });

  // Early return AFTER all hooks
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const offersPie = [
    { name: "Ativas", value: offersActive ?? 0 },
    { name: "Rascunho", value: offersDraft ?? 0 },
    { name: "Expiradas", value: offersExpired ?? 0 },
    { name: "Outras", value: Math.max(0, (offersTotal ?? 0) - (offersActive ?? 0) - (offersDraft ?? 0) - (offersExpired ?? 0)) },
  ].filter(s => s.value > 0);

  const storeRulesPie = [
    { name: "Ativas", value: storeRulesActive ?? 0 },
    { name: "Pendentes", value: storeRulesPending ?? 0 },
    { name: "Rejeitadas", value: storeRulesRejected ?? 0 },
  ].filter(s => s.value > 0);

  const STORE_RULE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--destructive))"];
  const allStats = [
    { title: "Empresas", value: tenants, icon: Building2, scopes: ["ROOT"] },
    { title: "Marcas", value: brands, icon: Store, scopes: ["ROOT", "TENANT"] },
    { title: "Cidades", value: branches, icon: MapPin, scopes: ["ROOT", "TENANT", "BRAND"] },
    { title: "Parceiros", value: storesTotal, sub: `${storesActive ?? 0} ativos`, icon: ShoppingBag, scopes: ["ROOT", "TENANT", "BRAND", "BRANCH"] },
    { title: "Ofertas Ativas", value: offersActive, sub: `${offersTotal ?? 0} total`, icon: Tag, scopes: ["ROOT", "TENANT", "BRAND", "BRANCH"] },
    { title: "Clientes", value: customersTotal, sub: `${customersActive ?? 0} ativos`, icon: UserCheck, scopes: ["ROOT", "TENANT", "BRAND", "BRANCH"] },
    { title: "Resgates no Período", value: redemptionsPeriod, sub: `${redemptionsTotal ?? 0} total`, icon: ReceiptText, highlight: true, scopes: ["ROOT", "TENANT", "BRAND", "BRANCH"] },
    { title: "Cupons Ativos", value: vouchersActive, sub: `${vouchersTotal ?? 0} total`, icon: Ticket, scopes: ["ROOT", "TENANT", "BRAND", "BRANCH"] },
    { title: "Pontuações no Período", value: earningEventsPeriod, sub: `${earningEventsTotal ?? 0} total`, icon: Coins, highlight: true, scopes: ["ROOT", "TENANT", "BRAND", "BRANCH"] },
    { title: "Regras de Parceiro", value: storeRulesActive, sub: `${storeRulesTotal ?? 0} total · ${storeRulesPending ?? 0} pendentes`, icon: Store, scopes: ["ROOT", "TENANT", "BRAND", "BRANCH"] },
    { title: "Usuários", value: usersCount, icon: Users, scopes: ["ROOT", "TENANT", "BRAND"] },
  ];

  const stats = allStats.filter(s => s.scopes.includes(consoleScope));

  const scopeLabels: Record<string, string> = {
    ROOT: "Visão geral da plataforma",
    TENANT: "Visão geral da empresa",
    BRAND: "Visão geral da marca",
    BRANCH: "Visão geral da cidade",
    OPERATOR: "Operador do Ponto de Venda",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Painel Principal</h2>
            <p className="text-muted-foreground">{scopeLabels[consoleScope]}</p>
          </div>
          <Badge variant="outline" className="gap-1.5 text-xs font-normal border-green-500/30 text-green-600">
            <Radio className="h-3 w-3 animate-pulse" />
            Tempo real
          </Badge>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Links & Test Accounts for Brand Admins */}
      {showBrand && !isRoot && <BrandQuickLinks />}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={stat.highlight ? "border-primary/50 bg-primary/5" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {stat.value === undefined ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <div className="text-3xl font-bold transition-all duration-300">{stat.value}</div>
              )}
              {stat.sub && <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Redemptions chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resgates — {period === "today" ? "Hoje" : period === "7d" ? "Últimos 7 dias" : "Últimos 30 dias"}</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentRedemptions ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={recentRedemptions}>
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="count" name="Resgates" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Earnings chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pontuações — {period === "today" ? "Hoje" : period === "7d" ? "Últimos 7 dias" : "Últimos 30 dias"}</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentEarnings ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={recentEarnings}>
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="count" name="Pontuações" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pies */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Ofertas</CardTitle>
          </CardHeader>
          <CardContent>
            {offersTotal === undefined ? (
              <Skeleton className="h-[200px] w-full" />
            ) : offersPie.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-16">Nenhuma oferta cadastrada</p>
            ) : (
              <div className="flex items-center justify-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={offersPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {offersPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 text-sm">
                  {offersPie.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{s.name}:</span>
                      <span className="font-medium">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Store rules pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Regras Personalizadas de Parceiro</CardTitle>
          </CardHeader>
          <CardContent>
            {storeRulesTotal === undefined ? (
              <Skeleton className="h-[200px] w-full" />
            ) : storeRulesPie.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-16">Nenhuma regra customizada cadastrada</p>
            ) : (
              <div className="flex items-center justify-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={storeRulesPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {storeRulesPie.map((_, i) => <Cell key={i} fill={STORE_RULE_COLORS[i % STORE_RULE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 text-sm">
                  {storeRulesPie.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: STORE_RULE_COLORS[i % STORE_RULE_COLORS.length] }} />
                      <span className="text-muted-foreground">{s.name}:</span>
                      <span className="font-medium">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending redemptions alert */}
      {(redemptionsPending ?? 0) > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <ReceiptText className="h-5 w-5 text-destructive" />
            <p className="text-sm font-medium">
              {redemptionsPending} resgate{(redemptionsPending ?? 0) > 1 ? "s" : ""} pendente{(redemptionsPending ?? 0) > 1 ? "s" : ""} aguardando confirmação
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending store rules alert */}
      {(storeRulesPending ?? 0) > 0 && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Store className="h-5 w-5 text-accent-foreground" />
            <p className="text-sm font-medium">
              {storeRulesPending} regra{(storeRulesPending ?? 0) > 1 ? "s" : ""} de parceiro pendente{(storeRulesPending ?? 0) > 1 ? "s" : ""} de aprovação
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
