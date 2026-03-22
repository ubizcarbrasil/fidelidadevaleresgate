import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Handshake, DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle, Download, Loader2, Search, Settings } from "lucide-react";
import { useGanhaGanhaConfig } from "@/hooks/useGanhaGanhaConfig";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

function formatMoney(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function GanhaGanhaBillingPage() {
  const { currentBrandId } = useBrandGuard();
  const navigate = useNavigate();
  const { config: ggConfig, isLoading: ggLoading } = useGanhaGanhaConfig();
  const [periodMonth, setPeriodMonth] = useState(getCurrentMonth());
  const [storeFilter, setStoreFilter] = useState<string>("all");




  // Fetch all billing events for period
  const { data: events, isLoading } = useQuery({
    queryKey: ["gg-billing", currentBrandId, periodMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ganha_ganha_billing_events")
        .select("*, stores(name)")
        .eq("brand_id", currentBrandId!)
        .eq("period_month", periodMonth)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentBrandId,
  });

  // Fetch last 6 months of billing for evolution chart
  const { data: evolutionEvents } = useQuery({
    queryKey: ["gg-billing-evolution", currentBrandId],
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
        .eq("brand_id", currentBrandId!)
        .in("period_month", months);
      if (error) throw error;
      return { rows: data, months };
    },
    enabled: !!currentBrandId,
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

  const { data: stores } = useQuery({
    queryKey: ["gg-billing-stores", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .eq("brand_id", currentBrandId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!currentBrandId,
  });

  const filtered = useMemo(() => {
    if (!events) return [];
    if (storeFilter === "all") return events;
    return events.filter((e: any) => e.store_id === storeFilter);
  }, [events, storeFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const earn = filtered.filter((e: any) => e.event_type === "EARN");
    const redeem = filtered.filter((e: any) => e.event_type === "REDEEM");
    return {
      totalPointsEarned: earn.reduce((s: number, e: any) => s + e.points_amount, 0),
      totalPointsRedeemed: redeem.reduce((s: number, e: any) => s + e.points_amount, 0),
      feeEarned: earn.reduce((s: number, e: any) => s + Number(e.fee_total), 0),
      feeRedeemed: redeem.reduce((s: number, e: any) => s + Number(e.fee_total), 0),
      total: filtered.reduce((s: number, e: any) => s + Number(e.fee_total), 0),
    };
  }, [filtered]);

  // Per-store summary
  const storeSummary = useMemo(() => {
    const map: Record<string, { name: string; earnPts: number; redeemPts: number; earnFee: number; redeemFee: number; total: number }> = {};
    (filtered || []).forEach((e: any) => {
      const sid = e.store_id;
      if (!map[sid]) map[sid] = { name: (e.stores as any)?.name || sid, earnPts: 0, redeemPts: 0, earnFee: 0, redeemFee: 0, total: 0 };
      if (e.event_type === "EARN") {
        map[sid].earnPts += e.points_amount;
        map[sid].earnFee += Number(e.fee_total);
      } else {
        map[sid].redeemPts += e.points_amount;
        map[sid].redeemFee += Number(e.fee_total);
      }
      map[sid].total += Number(e.fee_total);
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [filtered]);

  // CSV export
  const exportCsv = () => {
    if (!filtered.length) return;
    const rows = [["Data", "Parceiro", "Tipo", "Pontos", "Taxa/Ponto", "Total"]];
    filtered.forEach((e: any) => {
      rows.push([
        new Date(e.created_at).toLocaleDateString("pt-BR"),
        (e.stores as any)?.name || "",
        e.event_type,
        String(e.points_amount),
        String(e.fee_per_point),
        String(e.fee_total),
      ]);
    });
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ganha-ganha-${periodMonth}.csv`;
    a.click();
  };

  if (isLoading || ggLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ggConfig) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Card className="max-w-md w-full border-dashed">
          <CardContent className="py-10 text-center space-y-4">
            <Settings className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">Módulo Ganha-Ganha não configurado</h3>
            <p className="text-sm text-muted-foreground">
              Ative e configure o módulo Ganha-Ganha para visualizar o faturamento e os eventos de billing.
            </p>
            <Button onClick={() => navigate("/ganha-ganha-config")}>Configurar Ganha-Ganha</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Handshake className="h-6 w-6" /> Painel Financeiro Ganha-Ganha
        </h2>
        <p className="text-muted-foreground">Consumo e faturamento por ponto gerado e resgatado.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Período</Label>
          <Input type="month" value={periodMonth} onChange={e => setPeriodMonth(e.target.value)} className="w-44" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Parceiro</Label>
          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os parceiros</SelectItem>
              {stores?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Pontos Gerados", value: kpis.totalPointsEarned.toLocaleString("pt-BR"), icon: ArrowUpCircle, color: "text-blue-600" },
          { label: "Pontos Resgatados", value: kpis.totalPointsRedeemed.toLocaleString("pt-BR"), icon: ArrowDownCircle, color: "text-amber-600" },
          { label: "Fat. Geração", value: formatMoney(kpis.feeEarned), icon: DollarSign, color: "text-green-600" },
          { label: "Fat. Resgate", value: formatMoney(kpis.feeRedeemed), icon: DollarSign, color: "text-emerald-600" },
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
                  <linearGradient id="colorEarn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRedeem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
                <Legend />
                <Area type="monotone" dataKey="Fat. Geração" stroke="hsl(var(--chart-1))" fill="url(#colorEarn)" strokeWidth={2} />
                <Area type="monotone" dataKey="Fat. Resgate" stroke="hsl(var(--chart-2))" fill="url(#colorRedeem)" strokeWidth={2} />
                <Area type="monotone" dataKey="Total" stroke="hsl(var(--primary))" fill="none" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}


      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo por Parceiro</CardTitle>
        </CardHeader>
        <CardContent>
          {storeSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum evento no período selecionado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parceiro</TableHead>
                  <TableHead className="text-right">Pts Gerados</TableHead>
                  <TableHead className="text-right">Pts Resgatados</TableHead>
                  <TableHead className="text-right">Fat. Geração</TableHead>
                  <TableHead className="text-right">Fat. Resgate</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storeSummary.map(([sid, s]) => (
                  <TableRow
                    key={sid}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setStoreFilter(storeFilter === sid ? "all" : sid)}
                  >
                    <TableCell className="font-medium flex items-center gap-2">
                      {storeFilter === sid && <Badge variant="outline" className="text-xs">Filtrado</Badge>}
                      {s.name}
                    </TableCell>
                    <TableCell className="text-right">{s.earnPts.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{s.redeemPts.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{formatMoney(s.earnFee)}</TableCell>
                    <TableCell className="text-right">{formatMoney(s.redeemFee)}</TableCell>
                    <TableCell className="text-right font-bold">{formatMoney(s.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detailed events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Extrato Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem eventos.</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Pontos</TableHead>
                    <TableHead className="text-right">Taxa/Ponto</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm">{new Date(e.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-sm">{(e.stores as any)?.name}</TableCell>
                      <TableCell>
                        <Badge variant={e.event_type === "EARN" ? "default" : "secondary"}>
                          {e.event_type === "EARN" ? "Geração" : "Resgate"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{e.points_amount}</TableCell>
                      <TableCell className="text-right">{formatMoney(Number(e.fee_per_point))}</TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(Number(e.fee_total))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
