import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, BarChart3, ShieldAlert, TrendingUp, LineChart as LineChartIcon, Tag, icons, Store, ShoppingBag, Package } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";

type ReportType = "redemptions" | "earning_events" | "customers" | "vouchers" | "affiliate_clicks" | "coupon_performance" | "catalog_orders" | "product_redemptions";

const REPORT_OPTIONS: { value: ReportType; label: string }[] = [
  { value: "redemptions", label: "Resgates" },
  { value: "earning_events", label: "Acúmulos de Pontos" },
  { value: "customers", label: "Clientes" },
  { value: "vouchers", label: "Vouchers" },
  { value: "affiliate_clicks", label: "Cliques em Achadinhos" },
  { value: "coupon_performance", label: "Performance por Cupom" },
  { value: "catalog_orders", label: "Vendas do Catálogo" },
  { value: "product_redemptions", label: "Resgates de Produtos" },
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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground">Gere, analise e exporte relatórios</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="data">Dados & CSV</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="segments">Segmentos</TabsTrigger>
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

          {reportType === "catalog_orders" && data && data.length > 0 && (
            <CatalogOrdersSummary data={data} />
          )}

          {reportType === "product_redemptions" && data && data.length > 0 && (
            <ProductRedemptionSummary data={data} />
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

        <TabsContent value="segments" className="space-y-6 mt-4">
          <SegmentReportsTab brandId={currentBrandId} dateFrom={dateFrom} dateTo={dateTo} />
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

// --- Catalog Orders Summary ---
function CatalogOrdersSummary({ data }: { data: Record<string, any>[] }) {
  const totalOrders = data.length;
  const pending = data.filter(r => r["Status"] === "PENDING").length;
  const confirmed = data.filter(r => r["Status"] === "CONFIRMED").length;
  const totalRevenue = data.reduce((s, r) => s + (parseFloat(String(r["Total (R$)"]).replace(",", ".")) || 0), 0);
  const totalPoints = data.reduce((s, r) => s + (Number(r["Pontos Estimados"]) || 0), 0);
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card><CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">Total Pedidos</p>
        <p className="text-2xl font-bold">{totalOrders}</p>
        <p className="text-xs text-muted-foreground mt-1">Pendentes: {pending} · Confirmados: {confirmed}</p>
      </CardContent></Card>
      <Card><CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">Faturamento</p>
        <p className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
      </CardContent></Card>
      <Card><CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">Ticket Médio</p>
        <p className="text-2xl font-bold">R$ {avgTicket.toFixed(2)}</p>
      </CardContent></Card>
      <Card><CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">Pontos Distribuídos</p>
        <p className="text-2xl font-bold">{totalPoints.toLocaleString("pt-BR")}</p>
      </CardContent></Card>
      <Card className="border-primary/30 bg-primary/5"><CardContent className="pt-4">
        <p className="text-xs text-muted-foreground flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> Taxa Confirmação</p>
        <p className="text-2xl font-bold">{totalOrders > 0 ? ((confirmed / totalOrders) * 100).toFixed(0) : 0}%</p>
      </CardContent></Card>
    </div>
  );
}

// --- Product Redemption Summary ---
function ProductRedemptionSummary({ data }: { data: Record<string, any>[] }) {
  const total = data.length;
  const pending = data.filter(r => r["Status"] === "PENDING").length;
  const approved = data.filter(r => r["Status"] === "APPROVED").length;
  const shipped = data.filter(r => r["Status"] === "SHIPPED").length;
  const delivered = data.filter(r => r["Status"] === "DELIVERED").length;
  const rejected = data.filter(r => r["Status"] === "REJECTED").length;
  const totalPoints = data.reduce((s, r) => s + (Number(r["Pontos"]) || 0), 0);
  const drivers = data.filter(r => r["Origem"] === "motorista").length;
  const customers = data.filter(r => r["Origem"] === "cliente").length;
  const driverPct = total > 0 ? ((drivers / total) * 100).toFixed(0) : "0";
  const customerPct = total > 0 ? ((customers / total) * 100).toFixed(0) : "0";

  // Top 5 products
  const productCounts: Record<string, number> = {};
  for (const r of data) {
    const title = r["Produto"] || "Desconhecido";
    productCounts[title] = (productCounts[title] || 0) + 1;
  }
  const top5 = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Total de Pedidos</p>
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {pending > 0 && <span className="text-destructive font-medium">{pending} pendentes</span>}
            {pending > 0 && delivered > 0 && " · "}
            {delivered > 0 && `${delivered} entregues`}
          </p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Pontos Gastos</p>
          <p className="text-2xl font-bold">{totalPoints.toLocaleString("pt-BR")}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Por Status</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {pending > 0 && <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-500">Pendente {pending}</Badge>}
            {approved > 0 && <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-500">Aprovado {approved}</Badge>}
            {shipped > 0 && <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-500">Comprado {shipped}</Badge>}
            {delivered > 0 && <Badge variant="outline" className="text-xs border-green-500/50 text-green-500">Concluído {delivered}</Badge>}
            {rejected > 0 && <Badge variant="outline" className="text-xs border-destructive/50 text-destructive">Rejeitado {rejected}</Badge>}
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Origem</p>
          <p className="text-sm font-medium mt-1">🚗 Motorista: {driverPct}%</p>
          <p className="text-sm font-medium">👤 Cliente: {customerPct}%</p>
        </CardContent></Card>
        <Card className="border-primary/30 bg-primary/5"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Package className="h-3 w-3" /> Top Produto</p>
          <p className="text-sm font-bold truncate mt-1">{top5[0]?.[0] || "—"}</p>
          <p className="text-xs text-muted-foreground">{top5[0]?.[1] || 0} resgates</p>
        </CardContent></Card>
      </div>

      {top5.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top 5 Produtos Mais Resgatados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {top5.map(([title, count], i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[70%]">{i + 1}. {title}</span>
                  <Badge variant="secondary">{count}x</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
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

// --- Segment Icon Helper ---
function kebabToPascal(name: string): string {
  return name.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

function SegmentIconPreview({ name, className = "h-4 w-4" }: { name: string | null; className?: string }) {
  if (!name) return <Store className={className + " text-muted-foreground"} />;
  const Icon = (icons as Record<string, any>)[kebabToPascal(name)];
  if (!Icon) return <Store className={className + " text-muted-foreground"} />;
  return <Icon className={className} />;
}

// --- Segment Reports Tab ---
function SegmentReportsTab({ brandId, dateFrom, dateTo }: { brandId: string | null; dateFrom: string; dateTo: string }) {
  const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
  const to = new Date(dateTo); to.setHours(23, 59, 59, 999);

  const { data: segmentData, isLoading } = useQuery({
    queryKey: ["segment-reports", dateFrom, dateTo, brandId],
    queryFn: async () => {
      // 1. Fetch stores with segments
      let storesQ = supabase
        .from("stores")
        .select("id, taxonomy_segment_id, taxonomy_segments(id, name, icon_name, taxonomy_categories(name))")
        .eq("is_active", true)
        .not("taxonomy_segment_id", "is", null);
      if (brandId) storesQ = storesQ.eq("brand_id", brandId);
      const { data: storesData } = await storesQ.limit(1000);
      if (!storesData?.length) return [];

      // Build segment map
      const segMap = new Map<string, {
        id: string; name: string; icon_name: string | null; category: string;
        stores: number; storeIds: string[];
        offers: number; redemptions: number; revenue: number; points: number;
      }>();

      for (const s of storesData) {
        const seg = s.taxonomy_segments as any;
        if (!seg) continue;
        const existing = segMap.get(seg.id);
        if (existing) {
          existing.stores++;
          existing.storeIds.push(s.id);
        } else {
          segMap.set(seg.id, {
            id: seg.id,
            name: seg.name,
            icon_name: seg.icon_name || null,
            category: seg.taxonomy_categories?.name || "",
            stores: 1,
            storeIds: [s.id],
            offers: 0, redemptions: 0, revenue: 0, points: 0,
          });
        }
      }

      // 2. Fetch offers count per store
      const allStoreIds = storesData.map((s) => s.id);
      let offersQ = supabase
        .from("offers")
        .select("id, store_id")
        .in("store_id", allStoreIds.slice(0, 200))
        .eq("is_active", true);
      if (brandId) offersQ = offersQ.eq("brand_id", brandId);
      const { data: offersData } = await offersQ.limit(1000);

      if (offersData) {
        for (const o of offersData) {
          for (const seg of segMap.values()) {
            if (seg.storeIds.includes(o.store_id)) {
              seg.offers++;
              break;
            }
          }
        }
      }

      // 3. Fetch redemptions in period
      let redQ = supabase
        .from("redemptions")
        .select("id, offer_id, purchase_value, credit_value_applied, status, offers(store_id)")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .eq("status", "USED");
      if (brandId) redQ = redQ.eq("brand_id", brandId);
      const { data: redData } = await redQ.limit(1000);

      if (redData) {
        for (const r of redData) {
          const storeId = (r.offers as any)?.store_id;
          if (!storeId) continue;
          for (const seg of segMap.values()) {
            if (seg.storeIds.includes(storeId)) {
              seg.redemptions++;
              seg.revenue += Number(r.purchase_value || 0);
              break;
            }
          }
        }
      }

      // 4. Fetch earning events in period
      let earnQ = supabase
        .from("earning_events")
        .select("store_id, points_earned")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .in("store_id", allStoreIds.slice(0, 200));
      if (brandId) earnQ = earnQ.eq("brand_id", brandId);
      const { data: earnData } = await earnQ.limit(1000);

      if (earnData) {
        for (const e of earnData) {
          for (const seg of segMap.values()) {
            if (seg.storeIds.includes(e.store_id)) {
              seg.points += e.points_earned;
              break;
            }
          }
        }
      }

      return Array.from(segMap.values())
        .sort((a, b) => b.redemptions - a.redemptions);
    },
  });

  const chartData = useMemo(() => {
    if (!segmentData?.length) return [];
    return segmentData.slice(0, 10).map((s) => ({
      name: s.name.length > 14 ? s.name.slice(0, 12) + "…" : s.name,
      Resgates: s.redemptions,
      "Vendas R$": Math.round(s.revenue),
    }));
  }, [segmentData]);

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );

  if (!segmentData?.length) return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">
        <Tag className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="font-medium">Nenhum segmento com dados no período</p>
        <p className="text-sm mt-1">Certifique-se de que lojas estão classificadas por segmento</p>
      </CardContent>
    </Card>
  );

  const totalStores = segmentData.reduce((s, v) => s + v.stores, 0);
  const totalOffers = segmentData.reduce((s, v) => s + v.offers, 0);
  const totalRedemptions = segmentData.reduce((s, v) => s + v.redemptions, 0);
  const totalRevenue = segmentData.reduce((s, v) => s + v.revenue, 0);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Segmentos Ativos</p>
          <p className="text-2xl font-bold">{segmentData.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{totalStores} lojas classificadas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Ofertas Ativas</p>
          <p className="text-2xl font-bold">{totalOffers}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Resgates no Período</p>
          <p className="text-2xl font-bold">{totalRedemptions}</p>
        </CardContent></Card>
        <Card className="border-primary/30 bg-primary/5"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Vendas Geradas</p>
          <p className="text-2xl font-bold">R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Resgates e Vendas por Segmento (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                />
                <Legend />
                <Bar dataKey="Resgates" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                <Bar dataKey="Vendas R$" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" /> Detalhamento por Segmento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Lojas</TableHead>
                  <TableHead className="text-right">Ofertas</TableHead>
                  <TableHead className="text-right">Resgates</TableHead>
                  <TableHead className="text-right">Pontos</TableHead>
                  <TableHead className="text-right">Vendas (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segmentData.map((seg) => (
                  <TableRow key={seg.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <SegmentIconPreview name={seg.icon_name} className="h-4 w-4" />
                        {seg.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{seg.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{seg.stores}</TableCell>
                    <TableCell className="text-right">{seg.offers}</TableCell>
                    <TableCell className="text-right font-medium">{seg.redemptions}</TableCell>
                    <TableCell className="text-right">{seg.points.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {seg.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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

  // Catalog orders over time (daily)
  const { data: catalogByDay, isLoading: loadingC } = useQuery({
    queryKey: ["chart-catalog-orders", dateFrom, dateTo, brandId],
    queryFn: async () => {
      let q = supabase
        .from("catalog_cart_orders")
        .select("created_at, status, total_amount, points_earned_estimate")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: true })
        .limit(1000);
      if (brandId) q = q.eq("brand_id", brandId);
      const { data } = await q;
      if (!data) return [];
      const byDay: Record<string, { date: string; pedidos: number; faturamento: number; pontos: number; confirmados: number }> = {};
      for (const r of data) {
        const day = r.created_at.slice(0, 10);
        if (!byDay[day]) byDay[day] = { date: day, pedidos: 0, faturamento: 0, pontos: 0, confirmados: 0 };
        byDay[day].pedidos++;
        byDay[day].faturamento += Number(r.total_amount);
        byDay[day].pontos += r.points_earned_estimate || 0;
        if (r.status === "CONFIRMED") byDay[day].confirmados++;
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
                      label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
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

      {/* Catalog Orders chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" /> Vendas do Catálogo por Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingC ? <Skeleton className="h-64 w-full" /> :
            !catalogByDay?.length ? (
              <p className="text-muted-foreground text-sm text-center py-12">Sem pedidos de catálogo no período</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={catalogByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickFormatter={formatTick} className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    labelFormatter={(v) => `Data: ${formatTick(v as string)}`}
                    formatter={(value: any, name: any) => [
                      name === "Faturamento R$" ? `R$ ${Number(value).toFixed(2)}` : value,
                      name,
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="pedidos" name="Pedidos" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="confirmados" name="Confirmados" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="faturamento" name="Faturamento R$" stroke={CHART_COLORS[5]} strokeWidth={2} dot={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
        </CardContent>
      </Card>

      {/* Product Redemption Charts */}
      <ProductRedemptionCharts brandId={brandId} dateFrom={dateFrom} dateTo={dateTo} />
    </div>
  );
}

// --- Product Redemption Charts ---
function ProductRedemptionCharts({ brandId, dateFrom, dateTo }: { brandId: string | null; dateFrom: string; dateTo: string }) {
  const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
  const to = new Date(dateTo); to.setHours(23, 59, 59, 999);

  const { data: prodOrders, isLoading } = useQuery({
    queryKey: ["chart-product-redemptions", dateFrom, dateTo, brandId],
    queryFn: async () => {
      let q = supabase
        .from("product_redemption_orders")
        .select("id, status, order_source, points_spent, deal_snapshot_json, created_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: true })
        .limit(1000);
      if (brandId) q = q.eq("brand_id", brandId);
      const { data } = await q;
      return data || [];
    },
  });

  const byDay = useMemo(() => {
    if (!prodOrders?.length) return [];
    const map: Record<string, { date: string; total: number; motorista: number; cliente: number }> = {};
    for (const r of prodOrders) {
      const day = (r.created_at || "").slice(0, 10);
      if (!map[day]) map[day] = { date: day, total: 0, motorista: 0, cliente: 0 };
      map[day].total++;
      if (r.order_source === "driver") map[day].motorista++;
      else map[day].cliente++;
    }
    return Object.values(map);
  }, [prodOrders]);

  const statusDist = useMemo(() => {
    if (!prodOrders?.length) return [];
    const counts: Record<string, number> = {};
    for (const r of prodOrders) {
      const s = r.status || "PENDING";
      counts[s] = (counts[s] || 0) + 1;
    }
    const labels: Record<string, string> = { PENDING: "Pendente", APPROVED: "Aprovado", SHIPPED: "Comprado", DELIVERED: "Concluído", REJECTED: "Rejeitado" };
    return Object.entries(counts).map(([k, v]) => ({ name: labels[k] || k, value: v }));
  }, [prodOrders]);

  const topProducts = useMemo(() => {
    if (!prodOrders?.length) return [];
    const counts: Record<string, number> = {};
    for (const r of prodOrders) {
      const snap = r.deal_snapshot_json as any;
      const title = snap?.title || "Desconhecido";
      const shortTitle = title.length > 30 ? title.slice(0, 28) + "…" : title;
      counts[shortTitle] = (counts[shortTitle] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, resgates]) => ({ name, resgates }));
  }, [prodOrders]);

  const formatTick = (d: string) => {
    const parts = d.split("-");
    return `${parts[2]}/${parts[1]}`;
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!prodOrders?.length) return null;

  const STATUS_COLORS = [CHART_COLORS[4], CHART_COLORS[0], CHART_COLORS[5], CHART_COLORS[3], CHART_COLORS[1]];

  return (
    <>
      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" /> Resgates de Produtos por Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tickFormatter={formatTick} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                labelFormatter={(v) => `Data: ${formatTick(v as string)}`}
              />
              <Legend />
              <Bar dataKey="motorista" name="Motorista" stackId="a" fill={CHART_COLORS[4]} radius={[0, 0, 0, 0]} />
              <Bar dataKey="cliente" name="Cliente" stackId="a" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Status dos Resgates de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusDist}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  paddingAngle={4} dataKey="value"
                  label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {statusDist.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Top 10 Produtos Resgatados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis type="category" dataKey="name" width={140} className="text-xs" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                />
                <Bar dataKey="resgates" name="Resgates" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
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
    case "catalog_orders": {
      let q = supabase
        .from("catalog_cart_orders")
        .select("id, status, customer_name, customer_cpf, total_amount, points_earned_estimate, created_at, points_confirmed_at, store_id, stores(name)")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);
      if (currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data } = await q;
      return (data || []).map(r => ({
        "Loja": (r.stores as any)?.name || r.store_id?.slice(0, 8) || "—",
        "Cliente": r.customer_name || "—",
        "CPF": r.customer_cpf || "—",
        "Total (R$)": Number(r.total_amount).toFixed(2),
        "Pontos Estimados": r.points_earned_estimate || 0,
        "Status": r.status,
        "Data": formatDate(r.created_at),
        "Confirmado em": r.points_confirmed_at ? formatDate(r.points_confirmed_at) : "—",
      }));
    }
    case "product_redemptions": {
      let q = supabase
        .from("product_redemption_orders")
        .select("id, status, order_source, points_spent, deal_snapshot_json, customer_name, customer_cpf, customer_phone, delivery_address, delivery_number, delivery_city, delivery_state, delivery_cep, tracking_code, created_at, reviewed_at, branch_id, branches(name)")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);
      if (currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data } = await q;
      return (data || []).map((r: any) => {
        const snap = r.deal_snapshot_json as any;
        return {
          "Data": formatDate(r.created_at),
          "Produto": snap?.title || "—",
          "Cliente": r.customer_name || "—",
          "CPF": r.customer_cpf || "—",
          "Telefone": r.customer_phone || "—",
          "Origem": r.order_source === "driver" ? "motorista" : "cliente",
          "Pontos": r.points_spent || 0,
          "Status": r.status || "PENDING",
          "Cidade": r.branches?.name || r.delivery_city || "—",
          "Endereço": `${r.delivery_address || ""}, ${r.delivery_number || ""} - ${r.delivery_city || ""} / ${r.delivery_state || ""}`,
          "CEP": r.delivery_cep || "—",
          "Rastreio": r.tracking_code || "—",
          "Link ML": snap?.affiliate_url || snap?.origin_url || "—",
          "Revisado em": r.reviewed_at ? formatDate(r.reviewed_at) : "—",
        };
      });
    }
    default: return [];
  }
}
