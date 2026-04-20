import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import type { ResultadoImportacao } from "../types/tipos_importacao";

interface Props {
  resultado: ResultadoImportacao | null;
  totalLinhas: number;
}

export default function EtapaProgresso({ resultado, totalLinhas }: Props) {
  const total = resultado?.total_rows || totalLinhas;
  const processed = resultado?.processed_rows || 0;
  const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  return (
    <div className="space-y-4 py-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <div>
          <p className="text-base font-semibold">Importando motoristas...</p>
          <p className="text-sm text-muted-foreground">
            {processed} de {total} linhas processadas
          </p>
        </div>
      </div>

      <Progress value={pct} className="h-2" />
      <p className="text-center text-xs text-muted-foreground">{pct}%</p>

      {resultado && (
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-md border border-border p-2">
            <p className="text-[10px] text-muted-foreground uppercase">Criados</p>
            <p className="text-base font-semibold text-blue-500">{resultado.created_count}</p>
          </div>
          <div className="rounded-md border border-border p-2">
            <p className="text-[10px] text-muted-foreground uppercase">Atualizados</p>
            <p className="text-base font-semibold text-green-500">{resultado.updated_count}</p>
          </div>
          <div className="rounded-md border border-border p-2">
            <p className="text-[10px] text-muted-foreground uppercase">Ignorados</p>
            <p className="text-base font-semibold text-muted-foreground">{resultado.skipped_count}</p>
          </div>
          <div className="rounded-md border border-border p-2">
            <p className="text-[10px] text-muted-foreground uppercase">Erros</p>
            <p className="text-base font-semibold text-destructive">{resultado.error_count}</p>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Pode fechar esta janela — a importação continua no servidor.
      </p>
    </div>
  );
}
