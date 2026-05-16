import { useEffect, useRef, useState } from "react";
import { Crown, Clock, Hourglass, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { progressoConfronto, statusDoConfronto } from "../utils/utilitarios_chaveamento";
import type { ConfrontoMataMata } from "../types/tipos_campeonato";

interface Props {
  confronto: ConfrontoMataMata;
  destacado?: boolean;
}

const ROTULOS_STATUS = {
  aguardando: { label: "Aguardando", icon: Hourglass, cor: "text-muted-foreground" },
  em_andamento: { label: "Em andamento", icon: Clock, cor: "text-blue-600 dark:text-blue-400" },
  encerrado: { label: "Encerrado", icon: CheckCircle2, cor: "text-emerald-600 dark:text-emerald-400" },
} as const;

export default function CardConfronto({ confronto, destacado }: Props) {
  const status = statusDoConfronto(confronto);
  const meta = ROTULOS_STATUS[status];
  const StatusIcon = meta.icon;
  const { pctA, pctB, neutro } = progressoConfronto(confronto);

  const isWinnerA = confronto.winner_id && confronto.winner_id === confronto.driver_a_id;
  const isWinnerB = confronto.winner_id && confronto.winner_id === confronto.driver_b_id;

  // Destaque visual quando contadores mudam (atualização em tempo real)
  const ridesAnteriores = useRef({ a: confronto.driver_a_rides, b: confronto.driver_b_rides });
  const [ladoPulsando, setLadoPulsando] = useState<"A" | "B" | null>(null);

  useEffect(() => {
    const ant = ridesAnteriores.current;
    let lado: "A" | "B" | null = null;
    if (confronto.driver_a_rides > ant.a) lado = "A";
    else if (confronto.driver_b_rides > ant.b) lado = "B";
    if (lado) {
      setLadoPulsando(lado);
      const id = setTimeout(() => setLadoPulsando(null), 1400);
      ridesAnteriores.current = {
        a: confronto.driver_a_rides,
        b: confronto.driver_b_rides,
      };
      return () => clearTimeout(id);
    }
    ridesAnteriores.current = {
      a: confronto.driver_a_rides,
      b: confronto.driver_b_rides,
    };
  }, [confronto.driver_a_rides, confronto.driver_b_rides]);

  return (
    <div
      className={`rounded-md border bg-card p-3 text-xs transition-colors ${
        destacado ? "border-primary shadow-sm" : "border-border"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Slot {confronto.slot}
        </span>
        <Badge variant="outline" className={`gap-1 border-transparent px-1.5 py-0 text-[10px] ${meta.cor}`}>
          <StatusIcon className="h-3 w-3" /> {meta.label}
        </Badge>
      </div>

      {/* Lado A */}
      <div
        className={`flex items-center justify-between rounded px-2 py-1 transition-colors ${
          isWinnerA ? "bg-emerald-500/10 font-semibold" : ""
        } ${ladoPulsando === "A" ? "animate-pulse bg-primary/15 ring-1 ring-primary/40" : ""}`}
      >
        <span className="flex min-w-0 items-center gap-1 truncate">
          {isWinnerA && <Crown className="h-3 w-3 shrink-0 text-amber-500" />}
          <span className="truncate">
            {confronto.driver_a_name ?? (confronto.driver_a_id ? "—" : "A definir")}
          </span>
        </span>
        <span
          className={`tabular-nums ${
            ladoPulsando === "A" ? "font-semibold text-primary" : "text-muted-foreground"
          }`}
        >
          {confronto.driver_a_rides}
        </span>
      </div>

      {/* Barra de progresso comparativa */}
      <div className="my-1.5">
        <Progress value={neutro ? 50 : pctA} className="h-1" />
      </div>

      {/* Lado B */}
      <div
        className={`flex items-center justify-between rounded px-2 py-1 transition-colors ${
          isWinnerB ? "bg-emerald-500/10 font-semibold" : ""
        } ${ladoPulsando === "B" ? "animate-pulse bg-primary/15 ring-1 ring-primary/40" : ""}`}
      >
        <span className="flex min-w-0 items-center gap-1 truncate">
          {isWinnerB && <Crown className="h-3 w-3 shrink-0 text-amber-500" />}
          <span className="truncate">
            {confronto.driver_b_name ?? (confronto.driver_b_id ? "—" : "A definir")}
          </span>
        </span>
        <span
          className={`tabular-nums ${
            ladoPulsando === "B" ? "font-semibold text-primary" : "text-muted-foreground"
          }`}
        >
          {confronto.driver_b_rides}
        </span>
      </div>

      {!neutro && (
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{pctA}%</span>
          <span>{pctB}%</span>
        </div>
      )}
    </div>
  );
}
