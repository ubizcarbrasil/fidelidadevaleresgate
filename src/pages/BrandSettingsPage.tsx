import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useBrandInfo } from "@/hooks/useBrandName";
import PlatformLogo from "@/components/PlatformLogo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Users, Store, Coins, ReceiptText, TrendingUp, ShoppingBag, Car } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function BrandSettingsPage() {
  const { currentBrandId } = useBrandGuard();
  const { name: brandName, logoUrl: brandLogoUrl } = useBrandInfo();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["brand-settings-metrics", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return null;

      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isoStart = thirtyDaysAgo.toISOString();

      const [customers, stores, earnings, redemptions, ledger, scoredRides] = await Promise.all([
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("brand_id", currentBrandId).eq("is_active", true),
        supabase.from("stores").select("id", { count: "exact", head: true }).eq("brand_id", currentBrandId).eq("is_active", true),
        supabase.from("earning_events").select("points_earned, money_earned, created_at").eq("brand_id", currentBrandId).eq("status", "APPROVED").gte("created_at", isoStart),
        supabase.from("redemptions").select("id", { count: "exact", head: true }).eq("brand_id", currentBrandId).gte("created_at", isoStart),
        supabase.from("points_ledger").select("entry_type, points_amount, created_at").eq("brand_id", currentBrandId).gte("created_at", isoStart).limit(1000),
        supabase.from("machine_rides").select("id", { count: "exact", head: true }).eq("brand_id", currentBrandId).eq("ride_status", "FINALIZED").gt("points_credited", 0).gte("created_at", isoStart),
      ]);

      const totalPoints = (earnings.data || []).reduce((s, e) => s + (e.points_earned || 0), 0);
      const totalMoney = (earnings.data || []).reduce((s, e) => s + (e.money_earned || 0), 0);

      // Points by day for chart
      const dayMap: Record<string, { credits: number; debits: number }> = {};
      (ledger.data || []).forEach((e: any) => {
        const day = new Date(e.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        if (!dayMap[day]) dayMap[day] = { credits: 0, debits: 0 };
        if (e.entry_type === "CREDIT") dayMap[day].credits += e.points_amount;
        else dayMap[day].debits += e.points_amount;
      });
      const chartData = Object.entries(dayMap)
        .map(([day, v]) => ({ day, ...v }))
        .slice(-14);

      // Pie: credits vs debits
      const totalCredits = (ledger.data || []).filter((e: any) => e.entry_type === "CREDIT").reduce((s: number, e: any) => s + e.points_amount, 0);
      const totalDebits = (ledger.data || []).filter((e: any) => e.entry_type === "DEBIT").reduce((s: number, e: any) => s + e.points_amount, 0);

      return {
        customerCount: customers.count || 0,
        storeCount: stores.count || 0,
        earningCount: (earnings.data || []).length,
        redemptionCount: redemptions.count || 0,
        scoredRidesCount: scoredRides.count || 0,
        totalPoints,
        totalMoney,
        chartData,
        pieData: [
          { name: "Créditos", value: totalCredits },
          { name: "Débitos", value: totalDebits },
        ],
      };
    },
    enabled: !!currentBrandId,
  });

  const cards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Clientes ativos", value: stats.customerCount, icon: Users, color: "text-primary" },
      { label: "Parceiros ativos", value: stats.storeCount, icon: Store, color: "text-primary" },
      { label: "Pontos emitidos (30d)", value: stats.totalPoints.toLocaleString("pt-BR"), icon: Coins, color: "text-primary" },
      { label: "Resgates (30d)", value: stats.redemptionCount, icon: ReceiptText, color: "text-primary" },
      { label: "Acúmulos (30d)", value: stats.earningCount, icon: TrendingUp, color: "text-primary" },
      { label: "R$ em pontos (30d)", value: `R$ ${stats.totalMoney.toFixed(2)}`, icon: ShoppingBag, color: "text-primary" },
      { label: "Corridas pontuadas (30d)", value: stats.scoredRidesCount, icon: Car, color: "text-primary" },
    ];
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <PlatformLogo src={brandLogoUrl} alt={brandName || "Marca"} className="h-14 w-14 rounded-xl" fallbackLabel={brandName?.slice(0, 2)?.toUpperCase() || "VR"} />
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {brandName || "Configurações"} — Métricas Gerais
          </h2>
          <p className="text-muted-foreground">Visão consolidada dos últimos 30 dias da sua marca</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-10 w-full" /></CardContent></Card>
            ))
          : cards.map((c) => (
              <Card key={c.label}>
                <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-1">
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                  <span className="text-2xl font-bold">{c.value}</span>
                  <span className="text-xs text-muted-foreground">{c.label}</span>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Pontos por dia (últimos 14 dias)</CardTitle></CardHeader>
          <CardContent className="h-64">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.chartData || []}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="credits" name="Créditos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="debits" name="Débitos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Créditos vs Débitos (30d)</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats?.pieData || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {(stats?.pieData || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
