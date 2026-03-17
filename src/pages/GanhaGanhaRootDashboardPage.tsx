import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Handshake, DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle, Download, Loader2, Building2 } from "lucide-react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

function formatMoney(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function GanhaGanhaRootDashboardPage() {
  const [periodMonth, setPeriodMonth] = useState(getCurrentMonth());

  // Fetch ALL billing events across ALL brands for the period
  const { data: events, isLoading } = useQuery({
    queryKey: ["gg-root-billing", periodMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ganha_ganha_billing_events")
        .select("*, stores(name, brand_id)")
        .eq("period_month", periodMonth)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all active GG configs to know which brands have it active
  const { data: activeConfigs } = useQuery({
    queryKey: ["gg-root-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ganha_ganha_config")
        .select("brand_id, is_active, fee_per_point_earned, fee_per_point_redeemed, fee_mode, brands(name)")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch last 6 months for evolution chart
  const { data: evolutionEvents } = useQuery({
    queryKey: ["gg-root-evolution"],
    queryFn: async () => {
      const months: string[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toISOString().slice(0, 7));
      }
      const { data, error } = await supabase
        .from("ganha_ganha_billing_events")
        .select("event_type, fee_total, points_amount, period_month")
        .in("period_month", months);
      if (error) throw error;
      return { rows: data, months };
    },
  });

  const evolutionChart = useMemo(() => {
    if (!evolutionEvents) return [];
    const { rows, months } = evolutionEvents;
    return months.map(m => {
      const mEvents = rows.filter((e: any) => e.period_month === m);
      const earnFee = mEvents.filter((e: any) => e.event_type === "EARN").reduce((s: number, e: any) => s + Number(e.fee_total), 0);
      const redeemFee = mEvents.filter((e: any) => e.event_type === "REDEEM").reduce((s: number, e: any) => s + Number(e.fee_total), 0);
      const [y, mo] = m.split("-");
      return {
        month: `${mo}/${y.slice(2)}`,
        "Fat. Geração": Number(earnFee.toFixed(2)),
        "Fat. Resgate": Number(redeemFee.toFixed(2)),
        Total: Number((earnFee + redeemFee).toFixed(2)),
      };
    });
  }, [evolutionEvents]);

  const kpis = useMemo(() => {
    if (!events) return { earnPts: 0, redeemPts: 0, earnFee: 0, redeemFee: 0, total: 0, eventCount: 0 };
    const earn = events.filter((e: any) => e.event_type === "EARN");
    const redeem = events.filter((e: any) => e.event_type === "REDEEM");
    return {
      earnPts: earn.reduce((s: number, e: any) => s + e.points_amount, 0),
      redeemPts: redeem.reduce((s: number, e: any) => s + e.points_amount, 0),
      earnFee: earn.reduce((s: number, e: any) => s + Number(e.fee_total), 0),
      redeemFee: redeem.reduce((s: number, e: any) => s + Number(e.fee_total), 0),
      total: events.reduce((s: number, e: any) => s + Number(e.fee_total), 0),
      eventCount: events.length,
    };
  }, [events]);

  // Per-brand summary
  const brandSummary = useMemo(() => {
    if (!events || !activeConfigs) return [];
    const map: Record<string, { name: string; earnPts: number; redeemPts: number; earnFee: number; redeemFee: number; total: number; storeCount: Set<string> }> = {};
    events.forEach((e: any) => {
      const bid = e.brand_id;
      if (!map[bid]) {
        const cfg = activeConfigs.find((c: any) => c.brand_id === bid);
        map[bid] = {
          name: (cfg?.brands as any)?.name || bid.slice(0, 8),
          earnPts: 0, redeemPts: 0, earnFee: 0, redeemFee: 0, total: 0, storeCount: new Set(),
        };
      }
      map[bid].storeCount.add(e.store_id);
      if (e.event_type === "EARN") {
        map[bid].earnPts += e.points_amount;
        map[bid].earnFee += Number(e.fee_total);
      } else {
        map[bid].redeemPts += e.points_amount;
        map[bid].redeemFee += Number(e.fee_total);
      }
      map[bid].total += Number(e.fee_total);
    });
    return Object.entries(map)
      .map(([id, v]) => ({ id, ...v, storeCount: v.storeCount.size }))
      .sort((a, b) => b.total - a.total);
  }, [events, activeConfigs]);

  // Chart data
  const chartData = useMemo(() => {
    return brandSummary.map(b => ({
      name: b.name.length > 15 ? b.name.slice(0, 15) + "…" : b.name,
      "Fat. Geração": Number(b.earnFee.toFixed(2)),
      "Fat. Resgate": Number(b.redeemFee.toFixed(2)),
    }));
  }, [brandSummary]);

  // CSV export
  const exportCsv = () => {
    if (!brandSummary.length) return;
    const rows = [["Marca", "Parceiros", "Pts Gerados", "Pts Resgatados", "Fat. Geração", "Fat. Resgate", "Total"]];
    brandSummary.forEach(b => {
      rows.push([b.name, String(b.storeCount), String(b.earnPts), String(b.redeemPts), b.earnFee.toFixed(2), b.redeemFee.toFixed(2), b.total.toFixed(2)]);
    });
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gg-consolidado-${periodMonth}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Handshake className="h-6 w-6" /> Dashboard Financeiro Ganha-Ganha
        </h2>
        <p className="text-muted-foreground">Visão consolidada do faturamento de todas as marcas com módulo GG ativo.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Período</Label>
          <Input type="month" value={periodMonth} onChange={e => setPeriodMonth(e.target.value)} className="w-44" />
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!brandSummary.length}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
        <Badge variant="outline" className="h-8 px-3">
          <Building2 className="h-3.5 w-3.5 mr-1" />
          {activeConfigs?.length || 0} marcas ativas
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Pontos Gerados", value: kpis.earnPts.toLocaleString("pt-BR"), icon: ArrowUpCircle, color: "text-blue-600" },
          { label: "Pontos Resgatados", value: kpis.redeemPts.toLocaleString("pt-BR"), icon: ArrowDownCircle, color: "text-amber-600" },
          { label: "Fat. Geração", value: formatMoney(kpis.earnFee), icon: DollarSign, color: "text-green-600" },
          { label: "Fat. Resgate", value: formatMoney(kpis.redeemFee), icon: DollarSign, color: "text-emerald-600" },
          { label: "Faturamento Total", value: formatMoney(kpis.total), icon: TrendingUp, color: "text-primary" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <k.icon className={`h-4 w-4 ${k.color}`} />
                <span className="text-xs text-muted-foreground">{k.label}</span>
              </div>
              <p className="text-lg font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Faturamento por Marca</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
                <Legend />
                <Bar dataKey="Fat. Geração" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Fat. Resgate" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Evolution chart */}
      {evolutionChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução Mensal do Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={evolutionChart} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="rootColorEarn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rootColorRedeem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
                <Legend />
                <Area type="monotone" dataKey="Fat. Geração" stroke="hsl(var(--chart-1))" fill="url(#rootColorEarn)" strokeWidth={2} />
                <Area type="monotone" dataKey="Fat. Resgate" stroke="hsl(var(--chart-2))" fill="url(#rootColorRedeem)" strokeWidth={2} />
                <Area type="monotone" dataKey="Total" stroke="hsl(var(--primary))" fill="none" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}


      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo por Marca</CardTitle>
        </CardHeader>
        <CardContent>
          {brandSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum evento no período selecionado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead className="text-right">Parceiros</TableHead>
                  <TableHead className="text-right">Pts Gerados</TableHead>
                  <TableHead className="text-right">Pts Resgatados</TableHead>
                  <TableHead className="text-right">Fat. Geração</TableHead>
                  <TableHead className="text-right">Fat. Resgate</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brandSummary.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="text-right">{b.storeCount}</TableCell>
                    <TableCell className="text-right">{b.earnPts.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{b.redeemPts.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{formatMoney(b.earnFee)}</TableCell>
                    <TableCell className="text-right">{formatMoney(b.redeemFee)}</TableCell>
                    <TableCell className="text-right font-bold">{formatMoney(b.total)}</TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{brandSummary.reduce((s, b) => s + b.storeCount, 0)}</TableCell>
                  <TableCell className="text-right">{kpis.earnPts.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right">{kpis.redeemPts.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right">{formatMoney(kpis.earnFee)}</TableCell>
                  <TableCell className="text-right">{formatMoney(kpis.redeemFee)}</TableCell>
                  <TableCell className="text-right">{formatMoney(kpis.total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Active brands configs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Marcas com Ganha-Ganha Ativo</CardTitle>
        </CardHeader>
        <CardContent>
          {(!activeConfigs || activeConfigs.length === 0) ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma marca ativou o módulo Ganha-Ganha.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead className="text-right">Taxa Geração</TableHead>
                  <TableHead className="text-right">Taxa Resgate</TableHead>
                  <TableHead>Modo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeConfigs.map((c: any) => (
                  <TableRow key={c.brand_id}>
                    <TableCell className="font-medium">{(c.brands as any)?.name || c.brand_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-right">{formatMoney(Number(c.fee_per_point_earned))}</TableCell>
                    <TableCell className="text-right">{formatMoney(Number(c.fee_per_point_redeemed))}</TableCell>
                    <TableCell>
                      <Badge variant={c.fee_mode === "CUSTOM" ? "secondary" : "outline"}>
                        {c.fee_mode === "CUSTOM" ? "Personalizado" : "Uniforme"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
