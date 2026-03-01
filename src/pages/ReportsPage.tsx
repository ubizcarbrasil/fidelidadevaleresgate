import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrandGuard } from "@/hooks/useBrandGuard";

type ReportType = "redemptions" | "earning_events" | "customers" | "vouchers" | "affiliate_clicks";

const REPORT_OPTIONS: { value: ReportType; label: string }[] = [
  { value: "redemptions", label: "Resgates" },
  { value: "earning_events", label: "Acúmulos de Pontos" },
  { value: "customers", label: "Clientes" },
  { value: "vouchers", label: "Vouchers" },
  { value: "affiliate_clicks", label: "Cliques em Achadinhos" },
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
  const { currentBrandId, applyBrandFilter } = useBrandGuard();
  const [reportType, setReportType] = useState<ReportType>("redemptions");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery({
    queryKey: ["report", reportType, dateFrom, dateTo, currentBrandId],
    queryFn: async () => {
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
        default: return [];
      }
    },
  });

  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
  const previewRows = data?.slice(0, 20) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground">Gere e exporte relatórios em CSV</p>
        </div>
        <Button
          onClick={() => data && downloadCSV(data, reportType)}
          disabled={!data || data.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

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
              {isLoading ? "Carregando..." : `${data?.length || 0} registros`}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Prévia ({previewRows.length} de {data?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : data?.length === 0 ? (
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
    </div>
  );
}
