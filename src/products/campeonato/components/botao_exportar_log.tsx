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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  motivoBloqueio?: string | null;
}

export default function BotaoExportarLog({
  eventos,
  resumo,
  desabilitado,
  motivoBloqueio,
}: Props) {
  const semDados = eventos.length === 0;
  const bloqueado = Boolean(desabilitado) || semDados;
  const motivoFinal =
    motivoBloqueio ?? (semDados ? "Nenhum evento corresponde aos filtros aplicados." : null);

  const exportar = (formato: "csv" | "pdf") => {
    if (bloqueado) {
      toast.error("Não é possível exportar", {
        description: motivoFinal ?? "Verifique os filtros aplicados.",
      });
      return;
    }
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

  // Quando bloqueado, mostramos um botão "desabilitado" (visual) que ainda
  // dispara o toast explicativo no clique, com Tooltip indicando o motivo.
  if (bloqueado) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs opacity-60"
              aria-disabled="true"
              onClick={() =>
                toast.error("Não é possível exportar", {
                  description: motivoFinal ?? "Verifique os filtros aplicados.",
                })
              }
            >
              <Download className="h-3.5 w-3.5" />
              Exportar
            </Button>
          </TooltipTrigger>
          {motivoFinal && (
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              {motivoFinal}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
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