import { Calendar } from "lucide-react";
import BadgeFaseTemporada from "./badge_fase_temporada";
import { formatarPeriodo } from "../utils/utilitarios_campeonato";
import type { TemporadaCampeonato } from "../types/tipos_campeonato";

interface Props {
  temporada: TemporadaCampeonato;
}

export default function CabecalhoTemporada({ temporada }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">{temporada.name}</h3>
          <BadgeFaseTemporada fase={temporada.phase as any} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Classificação:{" "}
            {formatarPeriodo(temporada.classification_starts_at, temporada.classification_ends_at)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Mata-mata:{" "}
            {formatarPeriodo(temporada.knockout_starts_at, temporada.knockout_ends_at)}
          </span>
        </div>
      </div>
    </div>
  );
}