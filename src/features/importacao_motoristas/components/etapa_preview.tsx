import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Upload, ArrowLeft, Loader2 } from "lucide-react";
import type { LinhaPlanilha, ResumoMapeamento } from "../types/tipos_importacao";

interface Props {
  linhas: LinhaPlanilha[];
  resumo: ResumoMapeamento | null;
  enviando: boolean;
  onVoltar: () => void;
  onConfirmar: () => void;
}

export default function EtapaPreview({ linhas, resumo, enviando, onVoltar, onConfirmar }: Props) {
  const colunas = linhas[0] ? Object.keys(linhas[0]).slice(0, 6) : [];
  const previewRows = linhas.slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md border border-border p-3">
          <p className="text-xs text-muted-foreground">Linhas</p>
          <p className="text-lg font-semibold">{linhas.length}</p>
        </div>
        <div className="rounded-md border border-border p-3">
          <p className="text-xs text-muted-foreground">Colunas detectadas</p>
          <p className="text-lg font-semibold">{resumo?.total_colunas ?? 0}</p>
        </div>
        <div className="rounded-md border border-border p-3">
          <p className="text-xs text-muted-foreground">Mapeadas</p>
          <p className="text-lg font-semibold text-primary">{resumo?.colunas_mapeadas ?? 0}</p>
        </div>
      </div>

      {resumo && resumo.colunas_ignoradas.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
            <ChevronDown className="h-3 w-3" />
            {resumo.colunas_ignoradas.length} colunas ignoradas (sem mapeamento conhecido)
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="flex flex-wrap gap-1">
              {resumo.colunas_ignoradas.map((c) => (
                <Badge key={c} variant="outline" className="text-[10px] font-normal">
                  {c}
                </Badge>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Pré-visualização (primeiras 8 linhas)</p>
        <ScrollArea className="h-48 rounded-md border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left text-muted-foreground font-normal">#</th>
                {colunas.map((c) => (
                  <th key={c} className="px-2 py-1.5 text-left font-medium truncate max-w-[120px]">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, i) => (
                <tr key={i} className="border-t border-border/50">
                  <td className="px-2 py-1 text-muted-foreground">{i + 2}</td>
                  {colunas.map((c) => (
                    <td key={c} className="px-2 py-1 truncate max-w-[120px]">{row[c] || "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-xs text-warning-foreground">
        Ao confirmar: <strong>{linhas.length}</strong> linha(s) serão processadas. Motoristas existentes serão atualizados (match por CPF, telefone ou nome). Campos vazios na planilha <strong>não</strong> sobrescrevem dados existentes.
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onVoltar} disabled={enviando}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Button onClick={onConfirmar} disabled={enviando}>
          {enviando ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
          Importar {linhas.length} linhas
        </Button>
      </div>
    </div>
  );
}
