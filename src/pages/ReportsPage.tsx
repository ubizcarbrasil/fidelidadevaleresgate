import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, BarChart3, ShieldAlert, TrendingUp, LineChart as LineChartIcon } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";

type ReportType = "redemptions" | "earning_events" | "customers" | "vouchers" | "affiliate_clicks" | "coupon_performance";

const REPORT_OPTIONS: { value: ReportType; label: string }[] = [
  { value: "redemptions", label: "Resgates" },
  { value: "earning_events", label: "Acúmulos de Pontos" },
  { value: "customers", label: "Clientes" },
  { value: "vouchers", label: "Vouchers" },
  { value: "affiliate_clicks", label: "Cliques em Achadinhos" },
  { value: "coupon_performance", label: "Performance por Cupom" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

function downloadCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) { toast.error("Sem dados para exportar"); return; }
  const keys = Object.keys(rows[0]);
  const header = keys.join(",");
  const body = rows.map(r => keys.map(k => {
    const v = r[k];
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
  }).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exportado com sucesso!");
}

export default function ReportsPage() {
  const { currentBrandId } = useBrandGuard();
  const [activeTab, setActiveTab] = useState("data");
  const [reportType, setReportType] = useState<ReportType>("redemptions");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery({
    queryKey: ["report", reportType, dateFrom, dateTo, currentBrandId],
    queryFn: () => fetchReport(reportType, dateFrom, dateTo, currentBrandId),
  });

  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
  const previewRows = data?.slice(0, 20) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground">Gere, analise e exporte relatórios</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="data">Dados & CSV</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="antifraud">Anti-fraude</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-6 mt-4">
          <ReportFilters
            reportType={reportType}
            setReportType={setReportType}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            isLoading={isLoading}
            dataLength={data?.length || 0}
            onExport={() => data && downloadCSV(data, reportType)}
          />

          {reportType === "coupon_performance" && data && data.length > 0 && (
            <CouponPerformanceSummary data={data} />
          )}

          <ReportTable
            isLoading={isLoading}
            columns={columns}
            previewRows={previewRows}
            totalRows={data?.length || 0}
          />
        </TabsContent>

        <TabsContent value="charts" className="space-y-6 mt-4">
          <ChartsTab brandId={currentBrandId} dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="antifraud" className="space-y-6 mt-4">
          <AntiFraudReport brandId={currentBrandId} dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Report Filters ---
function ReportFilters({
  reportType, setReportType, dateFrom, setDateFrom, dateTo, setDateTo,
  isLoading, dataLength, onExport,
}: {
  reportType: ReportType; setReportType: (v: ReportType) => void;
  dateFrom: string; setDateFrom: (v: string) => void;
  dateTo: string; setDateTo: (v: string) => void;
  isLoading: boolean; dataLength: number; onExport: () => void;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2 min-w-[200px]">
            <Label>Tipo de Relatório</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REPORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data Final</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            {isLoading ? "Carregando..." : `${dataLength} registros`}
          </div>
          <Button onClick={onExport} disabled={dataLength === 0} className="gap-2 ml-auto">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Report Table ---
function ReportTable({ isLoading, columns, previewRows, totalRows }: {
  isLoading: boolean; columns: string[]; previewRows: Record<string, any>[]; totalRows: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Prévia ({previewRows.length} de {totalRows})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : totalRows === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum registro encontrado no período</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(c => <TableHead key={c}>{c}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, i) => (
                  <TableRow key={i}>
                    {columns.map(c => (
                      <TableCell key={c} className="text-sm whitespace-nowrap max-w-[200px] truncate">
                        {String(row[c])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Coupon Performance Summary ---
function CouponPerformanceSummary({ data }: { data: Record<string, any>[] }) {
  const totalPending = data.reduce((s, r) => s + (Number(r["PENDING"]) || 0), 0);
  const totalUsed = data.reduce((s, r) => s + (Number(r["USED"]) || 0), 0);
  const totalExpired = data.reduce((s, r) => s + (Number(r["EXPIRED"]) || 0), 0);
  const totalCredit = data.reduce((s, r) => s + (parseFloat(String(r["Crédito Aplicado"]).replace(",", ".")) || 0), 0);
  const totalPurchase = data.reduce((s, r) => s + (parseFloat(String(r["Vendas (R$)"]).replace(",", ".")) || 0), 0);
  const netGain = totalPurchase - totalCredit;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card><CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">Resgates USED</p>
        <p className="text-2xl font-bold">{totalUsed}</p>
        <p className="text-xs text-muted-foreground mt-1">PENDING: {totalPending} · EXPIRED: {totalExpired}</p>
      </CardContent></Card>
      <Card><CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">Crédito Aplicado</p>
        <p className="text-2xl font-bold text-destructive">R$ {totalCredit.toFixed(2)}</p>
      </CardContent></Card>
      <Card><CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">Vendas Geradas</p>
        <p className="text-2xl font-bold">R$ {totalPurchase.toFixed(2)}</p>
      </CardContent></Card>
      <Card className="border-primary/30 bg-primary/5"><CardContent className="pt-4">
        <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Ganho Líquido</p>
        <p className="text-2xl font-bold">{netGain >= 0 ? "+" : ""}R$ {netGain.toFixed(2)}</p>
      </CardContent></Card>
    </div>
  );
}

// --- Anti-fraud Report ---
function AntiFraudReport({ brandId, dateFrom, dateTo }: { brandId: string | null; dateFrom: string; dateTo: string }) {
  const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
  const to = new Date(dateTo); to.setHours(23, 59, 59, 999);

  // Duplicate receipt codes
  const { data: duplicateReceipts, isLoading: loadingReceipts } = useQuery({
    queryKey: ["antifraud-receipts", dateFrom, dateTo, brandId],
    queryFn: async () => {
      let q = supabase
        .from("earning_events")
        .select("receipt_code, store_id, brand_id, created_at")
        .not("receipt_code", "is", null)
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);
      if (brandId) q = q.eq("brand_id", brandId);
      const { data } = await q;
      if (!data) return [];
      // Find duplicates
      const counts: Record<string, { count: number; store_id: string; first: string }> = {};
      for (const r of data) {
        const key = r.receipt_code!;
        if (!counts[key]) counts[key] = { count: 0, store_id: r.store_id, first: r.created_at };
        counts[key].count++;
      }
      return Object.entries(counts)
        .filter(([_, v]) => v.count > 1)
        .map(([code, v]) => ({ "Recibo": code, "Usos": v.count, "Loja ID": v.store_id.slice(0, 8), "Primeiro uso": formatDate(v.first) }));
    },
  });

  // Stores with high earning volume (top 10 by points)
  const { data: topStores, isLoading: loadingStores } = useQuery({
    queryKey: ["antifraud-top-stores", dateFrom, dateTo, brandId],
    queryFn: async () => {
      let q = supabase
        .from("earning_events")
        .select("store_id, points_earned, purchase_value")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .limit(1000);
      if (brandId) q = q.eq("brand_id", brandId);
      const { data } = await q;
      if (!data) return [];
      const agg: Record<string, { points: number; events: number; purchase: number }> = {};
      for (const r of data) {
        if (!agg[r.store_id]) agg[r.store_id] = { points: 0, events: 0, purchase: 0 };
        agg[r.store_id].points += r.points_earned;
        agg[r.store_id].events++;
        agg[r.store_id].purchase += Number(r.purchase_value);
      }
      return Object.entries(agg)
        .sort(([, a], [, b]) => b.points - a.points)
        .slice(0, 10)
        .map(([id, v]) => ({
          "Loja ID": id.slice(0, 8) + "...",
          "Eventos": v.events,
          "Pontos Emitidos": v.points,
          "Valor Compras": `R$ ${v.purchase.toFixed(2)}`,
        }));
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            Receipt Codes Duplicados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingReceipts ? <Skeleton className="h-20 w-full" /> :
            !duplicateReceipts?.length ? (
              <p className="text-muted-foreground text-sm text-center py-6">Nenhum receipt_code duplicado encontrado no período ✓</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(duplicateReceipts[0]).map(c => <TableHead key={c}>{c}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duplicateReceipts.map((row, i) => (
                      <TableRow key={i} className="bg-destructive/5">
                        {Object.values(row).map((v, j) => <TableCell key={j} className="text-sm">{String(v)}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top 10 Lojas por Volume de Pontos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStores ? <Skeleton className="h-20 w-full" /> :
            !topStores?.length ? (
              <p className="text-muted-foreground text-sm text-center py-6">Nenhum dado de acúmulo no período</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(topStores[0]).map(c => <TableHead key={c}>{c}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topStores.map((row, i) => (
                      <TableRow key={i}>
                        {Object.values(row).map((v, j) => <TableCell key={j} className="text-sm">{String(v)}</TableCell>)}
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

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--accent-foreground))",
  "hsl(142 76% 36%)",
  "hsl(38 92% 50%)",
  "hsl(262 83% 58%)",
];

function ChartsTab({ brandId, dateFrom, dateTo }: { brandId: string | null; dateFrom: string; dateTo: string }) {
  const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
  const to = new Date(dateTo); to.setHours(23, 59, 59, 999);

  // Redemptions over time (daily)
  const { data: redemptionsByDay, isLoading: loadingR } = useQuery({
    queryKey: ["chart-redemptions", dateFrom, dateTo, brandId],
    queryFn: async () => {
      let q = supabase
        .from("redemptions")
        .select("created_at, status")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: true })
        .limit(1000);
      if (brandId) q = q.eq("brand_id", brandId);
      const { data } = await q;
      if (!data) return [];
      const byDay: Record<string, { date: string; total: number; used: number; pending: number }> = {};
      for (const r of data) {
        const day = r.created_at.slice(0, 10);
        if (!byDay[day]) byDay[day] = { date: day, total: 0, used: 0, pending: 0 };
        byDay[day].total++;
        if (r.status === "USED") byDay[day].used++;
        if (r.status === "PENDING") byDay[day].pending++;
      }
      return Object.values(byDay);
    },
  });

  // Points earned over time (daily)
  const { data: pointsByDay, isLoading: loadingP } = useQuery({
    queryKey: ["chart-points", dateFrom, dateTo, brandId],
    queryFn: async () => {
      let q = supabase
        .from("earning_events")
        .select("created_at, points_earned, purchase_value")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: true })
        .limit(1000);
      if (brandId) q = q.eq("brand_id", brandId);
      const { data } = await q;
      if (!data) return [];
      const byDay: Record<string, { date: string; pontos: number; compras: number }> = {};
      for (const r of data) {
        const day = r.created_at.slice(0, 10);
        if (!byDay[day]) byDay[day] = { date: day, pontos: 0, compras: 0 };
        byDay[day].pontos += r.points_earned;
        byDay[day].compras += Number(r.purchase_value);
      }
      return Object.values(byDay);
    },
  });

  // Coupon status distribution (pie)
  const statusDistribution = useMemo(() => {
    if (!redemptionsByDay?.length) return [];
    const totals = redemptionsByDay.reduce(
      (acc, d) => ({ used: acc.used + d.used, pending: acc.pending + d.pending, other: acc.other + (d.total - d.used - d.pending) }),
      { used: 0, pending: 0, other: 0 }
    );
    return [
      { name: "Usados", value: totals.used },
      { name: "Pendentes", value: totals.pending },
      { name: "Outros", value: totals.other },
    ].filter(d => d.value > 0);
  }, [redemptionsByDay]);

  const formatTick = (d: string) => {
    const parts = d.split("-");
    return `${parts[2]}/${parts[1]}`;
  };

  return (
    <div className="space-y-6">
      {/* Redemptions line chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LineChartIcon className="h-4 w-4" /> Resgates por Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingR ? <Skeleton className="h-64 w-full" /> :
            !redemptionsByDay?.length ? (
              <p className="text-muted-foreground text-sm text-center py-12">Sem dados no período</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={redemptionsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickFormatter={formatTick} className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    labelFormatter={(v) => `Data: ${formatTick(v as string)}`}
                  />
                  <Legend />
                  <Bar dataKey="used" name="Usados" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pendentes" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Points line chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Pontos Emitidos por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingP ? <Skeleton className="h-64 w-full" /> :
              !pointsByDay?.length ? (
                <p className="text-muted-foreground text-sm text-center py-12">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={pointsByDay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tickFormatter={formatTick} className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      labelFormatter={(v) => `Data: ${formatTick(v as string)}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="pontos" name="Pontos" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="compras" name="Compras R$" stroke={CHART_COLORS[3]} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Distribuição de Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingR ? <Skeleton className="h-64 w-full" /> :
              !statusDistribution.length ? (
                <p className="text-muted-foreground text-sm text-center py-12">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusDistribution.map((_, i) => (
                        <Cell key={i} fill={[CHART_COLORS[3], CHART_COLORS[4], CHART_COLORS[2]][i]} />
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

// --- Fetch report data ---
async function fetchReport(reportType: ReportType, dateFrom: string, dateTo: string, currentBrandId: string | null) {
  const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
  const to = new Date(dateTo); to.setHours(23, 59, 59, 999);

  switch (reportType) {
    case "redemptions": {
      let q = supabase
        .from("redemptions")
        .select("id, token, status, created_at, used_at, purchase_value, customer_cpf")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);
      if (currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data } = await q;
      return (data || []).map(r => ({
        ID: r.id, Token: r.token, Status: r.status,
        "Criado em": formatDate(r.created_at),
        "Usado em": r.used_at ? formatDate(r.used_at) : "—",
        "Valor compra": r.purchase_value ?? "—",
        CPF: r.customer_cpf || "—",
      }));
    }
    case "earning_events": {
      let q = supabase
        .from("earning_events")
        .select("id, points_earned, money_earned, purchase_value, source, status, created_at, receipt_code")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);
      if (currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data } = await q;
      return (data || []).map(r => ({
        ID: r.id, Pontos: r.points_earned, "Valor R$": Number(r.money_earned).toFixed(2),
        "Valor compra": Number(r.purchase_value).toFixed(2), Fonte: r.source, Status: r.status,
        Data: formatDate(r.created_at), Recibo: r.receipt_code || "—",
      }));
    }
    case "customers": {
      let q = supabase
        .from("customers")
        .select("id, name, phone, points_balance, money_balance, is_active, created_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);
      if (currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data } = await q;
      return (data || []).map(r => ({
        ID: r.id, Nome: r.name, Telefone: r.phone || "—",
        Pontos: r.points_balance, "Saldo R$": Number(r.money_balance).toFixed(2),
        Ativo: r.is_active ? "Sim" : "Não", "Cadastro": formatDate(r.created_at),
      }));
    }
    case "vouchers": {
      const { data } = await supabase
        .from("vouchers")
        .select("id, code, title, discount_type, discount_percent, discount_fixed_value, status, current_uses, max_uses, created_at, expires_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);
      return (data || []).map(r => ({
        Código: r.code, Título: r.title,
        Tipo: r.discount_type === "FIXED" ? "Valor Fixo" : r.discount_type === "FREE_SHIPPING" ? "Frete Grátis" : "Percentual",
        Desconto: r.discount_type === "FIXED" ? `R$ ${Number(r.discount_fixed_value).toFixed(2)}` : `${r.discount_percent}%`,
        Status: r.status, "Usos": `${r.current_uses}/${r.max_uses}`,
        Criado: formatDate(r.created_at),
        Expira: r.expires_at ? formatDate(r.expires_at) : "—",
      }));
    }
    case "affiliate_clicks": {
      const { data } = await supabase
        .from("affiliate_clicks")
        .select("id, deal_id, clicked_at, ip_address")
        .gte("clicked_at", from.toISOString())
        .lte("clicked_at", to.toISOString())
        .order("clicked_at", { ascending: false })
        .limit(500);
      return (data || []).map(r => ({
        ID: r.id, "Deal ID": r.deal_id,
        Data: formatDate(r.clicked_at), IP: r.ip_address || "—",
      }));
    }
    case "coupon_performance": {
      let q = supabase
        .from("redemptions")
        .select("offer_id, status, credit_value_applied, purchase_value")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .limit(1000);
      if (currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data: redemptions } = await q;
      if (!redemptions?.length) return [];

      // Fetch offer titles
      const offerIds = [...new Set(redemptions.map(r => r.offer_id))];
      const { data: offers } = await supabase
        .from("offers")
        .select("id, title")
        .in("id", offerIds);
      const offerMap = new Map((offers || []).map(o => [o.id, o.title]));

      // Aggregate per offer
      const agg: Record<string, { title: string; PENDING: number; USED: number; EXPIRED: number; CANCELED: number; credit: number; purchase: number }> = {};
      for (const r of redemptions) {
        if (!agg[r.offer_id]) {
          agg[r.offer_id] = { title: offerMap.get(r.offer_id) || r.offer_id.slice(0, 8), PENDING: 0, USED: 0, EXPIRED: 0, CANCELED: 0, credit: 0, purchase: 0 };
        }
        const s = r.status as string;
        if (s in agg[r.offer_id]) (agg[r.offer_id] as any)[s]++;
        agg[r.offer_id].credit += Number(r.credit_value_applied || 0);
        agg[r.offer_id].purchase += Number(r.purchase_value || 0);
      }

      return Object.values(agg).map(v => ({
        "Cupom": v.title,
        "PENDING": v.PENDING,
        "USED": v.USED,
        "EXPIRED": v.EXPIRED,
        "Crédito Aplicado": v.credit.toFixed(2),
        "Vendas (R$)": v.purchase.toFixed(2),
        "Ganho Líquido": (v.purchase - v.credit).toFixed(2),
      }));
    }
    default: return [];
  }
}
