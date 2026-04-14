import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useRelatorioCorridas } from "./hooks/hook_relatorio_corridas";
import { exportarRelatorioCsv } from "./utils/utilitarios_export_csv";
import KpisRelatorio from "./components/kpis_relatorio";
import TabelaCidades from "./components/tabela_cidades";
import GraficoCorridasCidade from "./components/grafico_corridas_cidade";

export default function PaginaRelatorioCorridas() {
  const { rows, isLoading, totais } = useRelatorioCorridas();

  const handleExport = () => {
    if (rows.length === 0) {
      toast.info("Nenhum dado para exportar.");
      return;
    }
    exportarRelatorioCsv(rows);
    toast.success("CSV exportado com sucesso!");
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title="Relatório de Corridas e Pontos"
          description="Visão consolidada por cidade com comparativo mensal."
        />
        <Button size="sm" variant="outline" onClick={handleExport} disabled={isLoading || rows.length === 0}>
          <Download className="h-4 w-4 mr-1" />
          Exportar CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[320px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      ) : (
        <>
          <KpisRelatorio {...totais} />
          <GraficoCorridasCidade rows={rows} />
          <TabelaCidades rows={rows} />
        </>
      )}
    </div>
  );
}
