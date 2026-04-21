import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { EventoLogConfronto } from "../types/tipos_log_eventos";
import {
  exportarLogCsv,
  exportarLogPdf,
  type ResumoFiltrosExport,
} from "../utils/utilitarios_exportacao_log";

interface Props {
  eventos: EventoLogConfronto[];
  resumo: ResumoFiltrosExport;
  desabilitado?: boolean;
}

export default function BotaoExportarLog({ eventos, resumo, desabilitado }: Props) {
  const semDados = desabilitado || eventos.length === 0;

  const exportar = (formato: "csv" | "pdf") => {
    try {
      if (formato === "csv") exportarLogCsv(eventos, resumo);
      else exportarLogPdf(eventos, resumo);
      toast.success(`Exportação concluída (${formato.toUpperCase()})`, {
        description: `${resumo.total} evento(s) exportado(s).`,
      });
    } catch (err) {
      console.error("[exportar log]", err);
      toast.error("Falha ao exportar", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" disabled={semDados}>
          <Download className="h-3.5 w-3.5" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">
          {resumo.total} evento(s) filtrado(s)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => exportar("csv")} className="gap-2 text-xs">
          <FileSpreadsheet className="h-4 w-4" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportar("pdf")} className="gap-2 text-xs">
          <FileText className="h-4 w-4" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}