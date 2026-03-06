import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Loader2, CheckCircle2, Store } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useBrandGuard } from "@/hooks/useBrandGuard";

function formatMoney(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${months[parseInt(mo, 10) - 1]} ${y}`;
}

interface StoreSummary {
  storeId: string;
  storeName: string;
  earnPts: number;
  redeemPts: number;
  earnFee: number;
  redeemFee: number;
  total: number;
  events: Array<{
    date: string;
    type: string;
    points: number;
    feePerPoint: number;
    feeTotal: number;
    referenceType: string;
  }>;
}

export default function GanhaGanhaClosingReportsPage() {
  const { currentBrandId: selectedBrandId } = useBrandGuard();
  const [periodMonth, setPeriodMonth] = useState(getCurrentMonth());
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  const { data: config } = useQuery({
    queryKey: ["gg-config", selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return null;
      const { data } = await supabase
        .from("ganha_ganha_config")
        .select("*")
        .eq("brand_id", selectedBrandId)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
    enabled: !!selectedBrandId,
  });

  const { data: brand } = useQuery({
    queryKey: ["brand-info", selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return null;
      const { data } = await supabase
        .from("brands")
        .select("name")
        .eq("id", selectedBrandId)
        .maybeSingle();
      return data;
    },
    enabled: !!selectedBrandId,
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["gg-closing-events", selectedBrandId, periodMonth],
    queryFn: async () => {
      if (!selectedBrandId) return [];
      const { data, error } = await supabase
        .from("ganha_ganha_billing_events")
        .select("*, stores(name)")
        .eq("brand_id", selectedBrandId)
        .eq("period_month", periodMonth)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBrandId,
  });

  const storeSummaries = useMemo<StoreSummary[]>(() => {
    if (!events) return [];
    const map: Record<string, StoreSummary> = {};
    events.forEach((e: any) => {
      const sid = e.store_id;
      if (!map[sid]) {
        map[sid] = {
          storeId: sid,
          storeName: (e.stores as any)?.name || sid.slice(0, 8),
          earnPts: 0, redeemPts: 0, earnFee: 0, redeemFee: 0, total: 0,
          events: [],
        };
      }
      const feeTotal = Number(e.fee_total);
      if (e.event_type === "EARN") {
        map[sid].earnPts += e.points_amount;
        map[sid].earnFee += feeTotal;
      } else {
        map[sid].redeemPts += e.points_amount;
        map[sid].redeemFee += feeTotal;
      }
      map[sid].total += feeTotal;
      map[sid].events.push({
        date: new Date(e.created_at).toLocaleDateString("pt-BR"),
        type: e.event_type === "EARN" ? "Geração" : "Resgate",
        points: e.points_amount,
        feePerPoint: Number(e.fee_per_point),
        feeTotal,
        referenceType: e.reference_type || "-",
      });
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [events]);

  const totals = useMemo(() => {
    return storeSummaries.reduce(
      (acc, s) => ({
        earnPts: acc.earnPts + s.earnPts,
        redeemPts: acc.redeemPts + s.redeemPts,
        earnFee: acc.earnFee + s.earnFee,
        redeemFee: acc.redeemFee + s.redeemFee,
        total: acc.total + s.total,
      }),
      { earnPts: 0, redeemPts: 0, earnFee: 0, redeemFee: 0, total: 0 }
    );
  }, [storeSummaries]);

  function generateStorePdf(store: StoreSummary) {
    setGeneratingPdf(store.storeId);
    try {
      const doc = new jsPDF();
      const brandName = brand?.name || "Marca";
      const period = monthLabel(periodMonth);

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Fechamento Mensal", 14, 22);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Programa Ganha-Ganha — ${brandName}`, 14, 30);
      doc.text(`Período: ${period}`, 14, 37);
      doc.text(`Parceiro: ${store.storeName}`, 14, 44);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, 14, 51);

      // Divider
      doc.setDrawColor(200);
      doc.line(14, 55, 196, 55);

      // Summary table
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo do Período", 14, 64);

      autoTable(doc, {
        startY: 68,
        head: [["Métrica", "Valor"]],
        body: [
          ["Pontos Gerados", store.earnPts.toLocaleString("pt-BR")],
          ["Pontos Resgatados", store.redeemPts.toLocaleString("pt-BR")],
          ["Faturamento Geração", formatMoney(store.earnFee)],
          ["Faturamento Resgate", formatMoney(store.redeemFee)],
          ["Total a Cobrar", formatMoney(store.total)],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 14, right: 14 },
      });

      // Events detail
      const finalY = (doc as any).lastAutoTable?.finalY || 120;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Extrato Detalhado", 14, finalY + 12);

      autoTable(doc, {
        startY: finalY + 16,
        head: [["Data", "Tipo", "Pontos", "Taxa/Ponto", "Valor Cobrado"]],
        body: store.events.map((ev) => [
          ev.date,
          ev.type,
          ev.points.toLocaleString("pt-BR"),
          formatMoney(ev.feePerPoint),
          formatMoney(ev.feeTotal),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 14, right: 14 },
        foot: [["", "", "", "Total:", formatMoney(store.total)]],
        footStyles: { fillColor: [230, 235, 245], fontStyle: "bold", textColor: [0, 0, 0] },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150);
        doc.text(
          `${brandName} — Programa Ganha-Ganha — Página ${i}/${pageCount}`,
          14,
          doc.internal.pageSize.height - 10
        );
      }

      const fileName = `fechamento-gg-${store.storeName.replace(/\s+/g, "-").toLowerCase()}-${periodMonth}.pdf`;
      doc.save(fileName);
      toast.success(`PDF gerado: ${fileName}`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF");
    } finally {
      setGeneratingPdf(null);
    }
  }

  function generateAllPdfs() {
    storeSummaries.forEach((store) => generateStorePdf(store));
  }

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
          <FileText className="h-6 w-6" /> Relatórios de Fechamento
        </h2>
        <p className="text-muted-foreground">
          Gere relatórios mensais em PDF para envio aos parceiros do programa Ganha-Ganha.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Período</Label>
          <Input type="month" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} className="w-44" />
        </div>
        <Button variant="outline" size="sm" onClick={generateAllPdfs} disabled={storeSummaries.length === 0}>
          <Download className="h-4 w-4 mr-1" /> Gerar Todos os PDFs
        </Button>
        <Badge variant="outline" className="h-8 px-3">
          <Store className="h-3.5 w-3.5 mr-1" />
          {storeSummaries.length} parceiros
        </Badge>
      </div>

      {/* Summary KPIs */}
      {storeSummaries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Parceiros", value: storeSummaries.length.toString() },
            { label: "Pts Gerados", value: totals.earnPts.toLocaleString("pt-BR") },
            { label: "Pts Resgatados", value: totals.redeemPts.toLocaleString("pt-BR") },
            { label: "Fat. Geração", value: formatMoney(totals.earnFee) },
            { label: "Fat. Total", value: formatMoney(totals.total) },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="pt-4 pb-3 px-4">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <p className="text-lg font-bold">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Per-store table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parceiros — {monthLabel(periodMonth)}</CardTitle>
        </CardHeader>
        <CardContent>
          {storeSummaries.length === 0 ? (
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
                  <TableHead className="text-center">PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storeSummaries.map((s) => (
                  <TableRow key={s.storeId}>
                    <TableCell className="font-medium">{s.storeName}</TableCell>
                    <TableCell className="text-right">{s.earnPts.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{s.redeemPts.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{formatMoney(s.earnFee)}</TableCell>
                    <TableCell className="text-right">{formatMoney(s.redeemFee)}</TableCell>
                    <TableCell className="text-right font-bold">{formatMoney(s.total)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => generateStorePdf(s)}
                        disabled={generatingPdf === s.storeId}
                      >
                        {generatingPdf === s.storeId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{totals.earnPts.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right">{totals.redeemPts.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right">{formatMoney(totals.earnFee)}</TableCell>
                  <TableCell className="text-right">{formatMoney(totals.redeemFee)}</TableCell>
                  <TableCell className="text-right">{formatMoney(totals.total)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!config && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>O módulo Ganha-Ganha não está ativo para esta marca.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
