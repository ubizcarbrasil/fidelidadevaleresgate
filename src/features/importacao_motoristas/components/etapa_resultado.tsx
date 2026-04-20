import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Download, RotateCcw } from "lucide-react";
import type { ResultadoImportacao } from "../types/tipos_importacao";

interface Props {
  resultado: ResultadoImportacao;
  onNovaImportacao: () => void;
  onFechar: () => void;
}

function baixarErrosCsv(resultado: ResultadoImportacao) {
  const linhas = ["linha,nome,motivo"];
  resultado.errors_json.forEach((e) => {
    const nome = (e.nome || "").replace(/"/g, '""');
    const motivo = e.motivo.replace(/"/g, '""').replace(/\n/g, " ");
    linhas.push(`${e.linha},"${nome}","${motivo}"`);
  });
  const blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `erros_importacao_${resultado.job_id.slice(0, 8)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EtapaResultado({ resultado, onNovaImportacao, onFechar }: Props) {
  const houveErro = resultado.error_count > 0;
  const sucesso = resultado.created_count + resultado.updated_count;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2 text-center py-2">
        {houveErro && sucesso === 0 ? (
          <AlertTriangle className="h-10 w-10 text-destructive" />
        ) : (
          <CheckCircle2 className="h-10 w-10 text-primary" />
        )}
        <h3 className="text-base font-semibold">
          {houveErro && sucesso === 0 ? "Importação falhou" : "Importação concluída"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {sucesso} motorista(s) processados com sucesso
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 justify-center py-1.5">
          {resultado.created_count} criados
        </Badge>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 justify-center py-1.5">
          {resultado.updated_count} atualizados
        </Badge>
        <Badge variant="outline" className="bg-muted text-muted-foreground justify-center py-1.5">
          {resultado.skipped_count} ignorados
        </Badge>
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 justify-center py-1.5">
          {resultado.error_count} erros
        </Badge>
      </div>

      {houveErro && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Erros encontrados</p>
            <Button size="sm" variant="outline" onClick={() => baixarErrosCsv(resultado)}>
              <Download className="h-3.5 w-3.5 mr-1" /> Baixar CSV
            </Button>
          </div>
          <ScrollArea className="h-40 rounded-md border border-border p-2">
            <div className="space-y-1 text-xs">
              {resultado.errors_json.slice(0, 100).map((e, i) => (
                <div key={i} className="flex items-start gap-2 py-0.5">
                  <span className="text-muted-foreground shrink-0">L{e.linha}</span>
                  <span className="font-medium truncate max-w-[120px]">{e.nome || "—"}</span>
                  <span className="text-destructive flex-1">{e.motivo}</span>
                </div>
              ))}
              {resultado.errors_json.length > 100 && (
                <p className="text-muted-foreground pt-1">...mostrando 100 de {resultado.errors_json.length}. Baixe o CSV para ver todos.</p>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="flex justify-between gap-2 pt-2">
        <Button variant="outline" onClick={onNovaImportacao}>
          <RotateCcw className="h-4 w-4 mr-1" /> Nova importação
        </Button>
        <Button onClick={onFechar}>Fechar</Button>
      </div>
    </div>
  );
}
