import { useEffect, useState } from "react";
import { Clock, CalendarDays, CheckCircle2 } from "lucide-react";
import type { RodadaResumo } from "../../types/tipos_tabela_duelos";

interface Props {
  rodada: RodadaResumo;
}

function formatarRestante(endsAt: string): string {
  const fim = new Date(endsAt).getTime();
  const agora = Date.now();
  const diff = fim - agora;
  if (diff <= 0) return "encerrada";
  const horas = Math.floor(diff / 3_600_000);
  const min = Math.floor((diff % 3_600_000) / 60_000);
  if (horas >= 24) {
    const dias = Math.floor(horas / 24);
    return `encerra em ${dias}d ${horas % 24}h`;
  }
  if (horas > 0) return `encerra em ${horas}h ${min}m`;
  return `encerra em ${min}m`;
}

function formatarJanela(start: string, end: string): string {
  const fmt: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };
  const s = new Date(start).toLocaleString("pt-BR", fmt);
  const e = new Date(end).toLocaleString("pt-BR", fmt);
  return `${s} → ${e}`;
}

export default function CabecalhoRodada({ rodada }: Props) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (rodada.status !== "em_andamento") return;
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [rodada.status]);

  const Icone =
    rodada.status === "encerrado"
      ? CheckCircle2
      : rodada.status === "em_andamento"
        ? Clock
        : CalendarDays;

  const cor =
    rodada.status === "encerrado"
      ? "text-muted-foreground"
      : rodada.status === "em_andamento"
        ? "text-primary"
        : "text-blue-500";

  return (
    <div className="rounded-md border border-border bg-card/60 px-3 py-2 mb-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground truncate">
          {formatarJanela(rodada.starts_at, rodada.ends_at)}
        </span>
        <span className={`flex items-center gap-1 font-semibold ${cor}`}>
          <Icone className="h-3 w-3" />
          {rodada.status === "em_andamento"
            ? formatarRestante(rodada.ends_at) + (tick === -1 ? "" : "")
            : rodada.status === "aguardando"
              ? "aguardando"
              : "encerrada"}
        </span>
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {rodada.total_matches} confronto{rodada.total_matches === 1 ? "" : "s"}
      </div>
    </div>
  );
}