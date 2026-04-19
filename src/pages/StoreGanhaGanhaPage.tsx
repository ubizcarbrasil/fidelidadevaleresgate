/**
 * StoreGanhaGanhaPage — Sub-fase 5.8
 * ----------------------------------
 * Visão de auto-serviço da loja parceira (store_admin).
 * Filtros simples + KPIs + tabela mensal + export CSV.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGgReportSummary,
  useGgReportByMonth,
} from "@/compartilhados/hooks/hook_relatorios_ganha_ganha";
import { FiltrosRelatorioGg } from "@/features/relatorios_gg/components/filtros_relatorio_gg";
import { KpisRelatorioGg } from "@/features/relatorios_gg/components/kpis_relatorio_gg";
import { TabelaBreakdownGg, fmtTabela } from "@/features/relatorios_gg/components/tabela_breakdown_gg";
import { exportGgReportCsv } from "@/features/relatorios_gg/utils/utilitarios_export_gg";
import { toast } from "sonner";

const { fmtBR, fmtInt } = fmtTabela;

function defaultStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function defaultEnd() {
  return new Date().toISOString().slice(0, 10);
}

export default function StoreGanhaGanhaPage() {
  const { user } = useAuth();
  const [periodStart, setPeriodStart] = useState(defaultStart());
  const [periodEnd, setPeriodEnd] = useState(defaultEnd());

  useEffect(() => {
    document.title = "Cashback — Minha Loja";
  }, []);

  const { data: store, isLoading: loadingStore } = useQuery({
    queryKey: ["store-of-user", user?.id] as const,
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, brand_id")
        .eq("owner_user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const filters = {
    brandId: store?.brand_id ?? null,
    periodStart,
    periodEnd,
    storeId: store?.id ?? null,
  };
  const summaryQ = useGgReportSummary(filters);
  const year = new Date(periodEnd).getFullYear();
  const byMonthQ = useGgReportByMonth(store?.brand_id ?? null, year);

  const handleExportCsv = async () => {
    if (!summaryQ.data || !store) return;
    try {
      await exportGgReportCsv({
        brandId: store.brand_id,
        brandName: store.name,
        periodStart,
        periodEnd,
        summary: summaryQ.data,
        byStore: [],
        byBranch: [],
        byMonth: byMonthQ.data ?? [],
      });
      toast.success("CSV gerado");
    } catch (e) {
      toast.error(`Falha: ${(e as Error).message}`);
    }
  };

  if (loadingStore) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando…</div>;
  }
  if (!store) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Loja não encontrada</p>
              <p className="text-sm text-muted-foreground">
                Esta conta não está vinculada como proprietária de uma loja parceira.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cashback — {store.name}</h1>
          <p className="text-sm text-muted-foreground">Suas emissões e resgates Cashback.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={summaryQ.isLoading}>
          <Download className="h-4 w-4 mr-2" /> CSV
        </Button>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mês a mês</CardTitle>
        </CardHeader>
        <CardContent>
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
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
