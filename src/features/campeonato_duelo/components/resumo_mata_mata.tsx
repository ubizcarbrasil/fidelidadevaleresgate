import { Trophy, Clock, Hourglass, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ORDEM_RODADAS, ROTULOS_RODADA } from "../constants/constantes_campeonato";
import { rodadaAtivaDaFase, resumoRodada } from "../utils/utilitarios_chaveamento";
import type { ConfrontoMataMata, TemporadaCampeonato } from "../types/tipos_campeonato";

interface Props {
  temporada: TemporadaCampeonato;
  confrontos: ConfrontoMataMata[];
}

export default function ResumoMataMata({ temporada, confrontos }: Props) {
  const rodadaAtiva = rodadaAtivaDaFase(temporada.phase);
  const totalConfrontos = confrontos.length;
  const encerrados = confrontos.filter((c) => c.winner_id).length;
  const emAndamento = confrontos.filter(
    (c) => !c.winner_id && c.driver_a_id && c.driver_b_id,
  ).length;
  const aguardando = totalConfrontos - encerrados - emAndamento;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card className="flex items-center gap-3 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Trophy className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Rodada atual
          </div>
          <div className="truncate text-sm font-semibold">
            {rodadaAtiva ? ROTULOS_RODADA[rodadaAtiva] : "—"}
          </div>
        </div>
      </Card>

      <Card className="flex items-center gap-3 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Encerrados
          </div>
          <div className="text-sm font-semibold tabular-nums">{encerrados}</div>
        </div>
      </Card>

      <Card className="flex items-center gap-3 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Clock className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Em andamento
          </div>
          <div className="text-sm font-semibold tabular-nums">{emAndamento}</div>
        </div>
      </Card>

      <Card className="flex items-center gap-3 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Hourglass className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Aguardando
          </div>
          <div className="text-sm font-semibold tabular-nums">{aguardando}</div>
        </div>
      </Card>

      {/* Linha de progresso por rodada */}
      <div className="col-span-2 md:col-span-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {ORDEM_RODADAS.map((r) => {
            const resumo = resumoRodada(r, confrontos);
            const ativa = rodadaAtiva === r;
            return (
              <div
                key={r}
                className={`rounded-md border p-2 text-xs ${
                  ativa
                    ? "border-primary bg-primary/5"
                    : resumo.completo
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border"
                }`}
              >
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="font-medium">{ROTULOS_RODADA[r]}</span>
                  {ativa && (
                    <span className="text-[10px] font-semibold uppercase text-primary">
                      atual
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {resumo.encerrados}/{resumo.total} encerrados
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
