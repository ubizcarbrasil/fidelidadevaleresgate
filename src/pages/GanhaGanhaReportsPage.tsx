/**
 * GanhaGanhaReportsPage — Sub-fase 5.8
 * ------------------------------------
 * Hub de Relatórios Cashback para root + brand_admin.
 * Filtros de período + breakdowns por loja/cidade/mês + export CSV/PDF.
 * Gateado por business_models_ui_enabled (memória city-flag-resolution-rule).
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, AlertTriangle } from "lucide-react";
import { useBrandInfo } from "@/hooks/useBrandName";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useBusinessModelsUiEnabled } from "@/compartilhados/hooks/hook_business_models_ui_flag";
import {
  useGgReportSummary,
  useGgReportByStore,
  useGgReportByBranch,
  useGgReportByMonth,
} from "@/compartilhados/hooks/hook_relatorios_ganha_ganha";
import { FiltrosRelatorioGg } from "@/features/relatorios_gg/components/filtros_relatorio_gg";
import { KpisRelatorioGg } from "@/features/relatorios_gg/components/kpis_relatorio_gg";
import { TabelaBreakdownGg, fmtTabela } from "@/features/relatorios_gg/components/tabela_breakdown_gg";
import { GraficoTemporalGg } from "@/features/relatorios_gg/components/grafico_temporal_gg";
import { exportGgReportCsv, exportGgReportPdf } from "@/features/relatorios_gg/utils/utilitarios_export_gg";
import { toast } from "sonner";

const { fmtBR, fmtInt } = fmtTabela;

function defaultStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function defaultEnd() {
  return new Date().toISOString().slice(0, 10);
}

export default function GanhaGanhaReportsPage() {
  const { name: brandName, brandId: infoBrandId } = useBrandInfo();
  const { currentBrandId } = useBrandGuard();
  const brandId = currentBrandId || infoBrandId || null;

  const { data: uiEnabled, isLoading: flagLoading } = useBusinessModelsUiEnabled(brandId);

  const [periodStart, setPeriodStart] = useState(defaultStart());
  const [periodEnd, setPeriodEnd] = useState(defaultEnd());
  const year = useMemo(() => new Date(periodEnd).getFullYear(), [periodEnd]);

  const filters = { brandId, periodStart, periodEnd };
  const summaryQ = useGgReportSummary(filters);
  const byStoreQ = useGgReportByStore(filters);
  const byBranchQ = useGgReportByBranch(filters);
  const byMonthQ = useGgReportByMonth(brandId, year);

  useEffect(() => {
    document.title = "Relatórios Cashback";
  }, []);

  const loading = summaryQ.isLoading || byStoreQ.isLoading || byBranchQ.isLoading || byMonthQ.isLoading;

  const handleExport = async (kind: "csv" | "pdf") => {
    if (!summaryQ.data) return;
    const ctx = {
      brandId,
      brandName: brandName || "Marca",
      periodStart,
      periodEnd,
      summary: summaryQ.data,
      byStore: byStoreQ.data ?? [],
      byBranch: byBranchQ.data ?? [],
      byMonth: byMonthQ.data ?? [],
    };
    try {
      if (kind === "csv") await exportGgReportCsv(ctx);
      else await exportGgReportPdf(ctx);
      toast.success(`Relatório ${kind.toUpperCase()} gerado`);
    } catch (e) {
      toast.error(`Falha ao gerar ${kind.toUpperCase()}: ${(e as Error).message}`);
    }
  };

  if (flagLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando…</div>;
  }
  if (uiEnabled !== true) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Relatórios Cashback indisponíveis</p>
              <p className="text-sm text-muted-foreground">
                Esta marca ainda não está com o módulo de Modelos de Negócio habilitado.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios Cashback</h1>
          <p className="text-sm text-muted-foreground">
            Visão consolidada do programa Ganha-Ganha com filtros, breakdowns e export.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")} disabled={loading}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button size="sm" onClick={() => handleExport("pdf")} disabled={loading}>
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <FiltrosRelatorioGg
        periodStart={periodStart}
        periodEnd={periodEnd}
        onPeriodChange={(s, e) => {
          setPeriodStart(s);
          setPeriodEnd(e);
        }}
      />

      <KpisRelatorioGg summary={summaryQ.data} loading={summaryQ.isLoading} />

      <GraficoTemporalGg rows={byMonthQ.data ?? []} loading={byMonthQ.isLoading} year={year} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="store">
            <TabsList>
              <TabsTrigger value="store">Por Loja</TabsTrigger>
              <TabsTrigger value="branch">Por Cidade</TabsTrigger>
              <TabsTrigger value="month">Por Mês</TabsTrigger>
            </TabsList>

            <TabsContent value="store" className="mt-4">
              <TabelaBreakdownGg
                rows={byStoreQ.data ?? []}
                loading={byStoreQ.isLoading}
                colunas={[
                  { header: "Loja", cell: (r) => r.store_name },
                  { header: "Pts G", cell: (r) => fmtInt(r.earn_pts), align: "right" },
                  { header: "Pts R", cell: (r) => fmtInt(r.redeem_pts), align: "right" },
                  { header: "Fat. G", cell: (r) => fmtBR(r.earn_fee), align: "right" },
                  { header: "Fat. R", cell: (r) => fmtBR(r.redeem_fee), align: "right" },
                  { header: "Total", cell: (r) => fmtBR(r.total_fee), align: "right" },
                ]}
              />
            </TabsContent>

            <TabsContent value="branch" className="mt-4">
              <TabelaBreakdownGg
                rows={byBranchQ.data ?? []}
                loading={byBranchQ.isLoading}
                colunas={[
                  { header: "Cidade", cell: (r) => r.branch_city || r.branch_name },
                  { header: "UF", cell: (r) => r.branch_state },
                  { header: "Pontos", cell: (r) => fmtInt(r.total_pts), align: "right" },
                  { header: "Lojas", cell: (r) => fmtInt(r.n_stores), align: "right" },
                  { header: "Total (R$)", cell: (r) => fmtBR(r.total_fee), align: "right" },
                ]}
              />
            </TabsContent>

            <TabsContent value="month" className="mt-4">
              <TabelaBreakdownGg
                rows={byMonthQ.data ?? []}
                loading={byMonthQ.isLoading}
                colunas={[
                  { header: "Mês", cell: (r) => r.month },
                  { header: "Pts G", cell: (r) => fmtInt(r.earn_pts), align: "right" },
                  { header: "Pts R", cell: (r) => fmtInt(r.redeem_pts), align: "right" },
                  { header: "Fat. G", cell: (r) => fmtBR(r.earn_fee), align: "right" },
                  { header: "Fat. R", cell: (r) => fmtBR(r.redeem_fee), align: "right" },
                  { header: "Total", cell: (r) => fmtBR(r.total_fee), align: "right" },
                  { header: "Eventos", cell: (r) => fmtInt(r.n_events), align: "right" },
                ]}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
