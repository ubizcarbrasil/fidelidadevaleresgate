import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { ResultadoImportacao } from "../types/tipos_importacao";

interface Props {
  resultado: ResultadoImportacao | null;
  totalLinhas: number;
  jobId?: string | null;
  /** Chamado quando o usuário toca em "Atualizar status" (consulta manual). */
  onAtualizar?: () => Promise<void> | void;
  /** Chamado quando o usuário toca em "Continuar em segundo plano". */
  onContinuarSegundoPlano?: () => void;
}

export default function EtapaProgresso({
  resultado,
  totalLinhas,
  jobId,
  onAtualizar,
  onContinuarSegundoPlano,
}: Props) {
  const [atualizando, setAtualizando] = useState(false);
  const total = resultado?.total_rows || totalLinhas;
  const processed = resultado?.processed_rows || 0;
  const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
  const jobCurto = (resultado?.job_id || jobId || "").slice(0, 8);

  const handleAtualizar = async () => {
    if (!onAtualizar) return;
    setAtualizando(true);
    try {
      await onAtualizar();
    } finally {
      setAtualizando(false);
    }
  };

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
            <p className="text-base font-semibold text-primary">{resultado.created_count}</p>
          </div>
          <div className="rounded-md border border-border p-2">
            <p className="text-[10px] text-muted-foreground uppercase">Atualizados</p>
            <p className="text-base font-semibold text-primary">{resultado.updated_count}</p>
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

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        {onAtualizar && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleAtualizar}
            disabled={atualizando}
          >
            {atualizando ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
            )}
            Atualizar status
          </Button>
        )}
        {onContinuarSegundoPlano && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={onContinuarSegundoPlano}
          >
            <MinusCircle className="h-3.5 w-3.5 mr-1" />
            Continuar em segundo plano
          </Button>
        )}
      </div>

      {jobCurto && (
        <p className="text-center text-[10px] text-muted-foreground font-mono">
          ID: {jobCurto}
        </p>
      )}
    </div>
  );
}
