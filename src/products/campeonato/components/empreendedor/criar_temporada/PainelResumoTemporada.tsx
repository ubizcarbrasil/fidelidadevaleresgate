import { CalendarClock, Flag, Swords, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatarDataHora } from "../../../utils/utilitarios_campeonato";
import type {
  AvisoTemporada,
  CalculoTemporadaResultado,
} from "../../../utils/utilitarios_data_final_temporada";

interface SerieAlocacao {
  name: string;
  size: number;
  alocados: number;
  ordem?: Array<{ customer_id: string; driver_name: string | null }>;
}

interface Props {
  totalSelecionados: number;
  series: SerieAlocacao[];
  calculo: CalculoTemporadaResultado | null;
  avisos: AvisoTemporada[];
}

function corCapacidade(atual: number, max: number): string {
  if (atual === 0) return "text-muted-foreground";
  if (atual > max) return "text-destructive";
  if (atual === max) return "text-amber-500";
  return "text-emerald-500";
}

const ICONE_AVISO = {
  erro: AlertTriangle,
  alerta: AlertTriangle,
  info: Info,
} as const;

const COR_AVISO = {
  erro: "text-destructive",
  alerta: "text-amber-500",
  info: "text-muted-foreground",
} as const;

export default function PainelResumoTemporada({
  totalSelecionados,
  series,
  calculo,
  avisos,
}: Props) {
  return (
    <aside className="flex h-full flex-col gap-3 rounded-lg border bg-muted/20 p-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Resumo da temporada
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums">
          {totalSelecionados}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            motoristas
          </span>
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Distribuição por série
        </p>
        {series.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma série definida.</p>
        ) : (
          series.map((s) => (
            <div
              key={s.name}
              className="rounded border border-border bg-card px-2 py-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Série {s.name}</span>
                <span
                  className={cn(
                    "font-mono tabular-nums",
                    corCapacidade(s.alocados, s.size),
                  )}
                >
                  {s.alocados}/{s.size}
                </span>
              </div>
              {s.ordem && s.ordem.length > 0 && (
                <ol className="mt-1 space-y-0.5">
                  {s.ordem.map((m, i) => (
                    <li
                      key={m.customer_id}
                      className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                    >
                      <span className="w-4 shrink-0 text-right font-mono tabular-nums">
                        {i + 1}.
                      </span>
                      <span className="truncate">
                        {m.driver_name ?? "Sem nome"}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))
        )}
      </div>

      {calculo && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Swords className="h-3 w-3" /> Duelos previstos
          </p>
          <div className="rounded border border-border bg-card p-2 text-xs">
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Total (round-robin)
              </span>
              <span className="font-mono font-semibold tabular-nums">
                {calculo.totalDuelos}
              </span>
            </p>
            {calculo.knockoutPhasesUsed.length > 0 && (
              <p className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Mata-mata</span>
                <span className="capitalize">
                  {calculo.knockoutPhasesUsed.join(" → ")}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {calculo && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarClock className="h-3 w-3" /> Cronograma
          </p>
          <ul className="space-y-1 rounded border border-border bg-card p-2 text-[11px]">
            <li>
              <span className="text-muted-foreground">Início:</span>{" "}
              <span className="font-medium">
                {formatarDataHora(calculo.classificationStartsAt.toISOString())}
              </span>
            </li>
            <li>
              <span className="text-muted-foreground">
                Fim Classificação ({calculo.classificationDays}d):
              </span>{" "}
              {formatarDataHora(calculo.classificationEndsAt.toISOString())}
            </li>
            <li>
              <span className="text-muted-foreground">
                Fim Mata-mata ({calculo.knockoutHoursTotal}h):
              </span>{" "}
              {formatarDataHora(calculo.knockoutEndsAt.toISOString())}
            </li>
          </ul>
        </div>
      )}

      {calculo && (
        <div className="rounded-lg border-2 border-primary/40 bg-primary/10 p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <Flag className="h-3 w-3" /> Data final do campeonato
          </p>
          <p className="mt-1 text-sm font-bold leading-tight">
            {formatarDataHora(calculo.knockoutEndsAt.toISOString())}
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Validações
        </p>
        {avisos.length === 0 ? (
          <div className="flex items-start gap-1.5 rounded border border-emerald-500/30 bg-emerald-500/5 p-2 text-[11px] text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
            Tudo certo para criar a temporada.
          </div>
        ) : (
          avisos.map((a, i) => {
            const Icone = ICONE_AVISO[a.tipo];
            return (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-1.5 rounded border border-border bg-card p-2 text-[11px]",
                  COR_AVISO[a.tipo],
                )}
              >
                <Icone className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{a.mensagem}</span>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}