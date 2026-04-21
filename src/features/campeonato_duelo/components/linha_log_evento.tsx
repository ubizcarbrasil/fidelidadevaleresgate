import { ArrowRight, Car, RotateCcw, Swords } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ROTULOS_RODADA } from "../constants/constantes_campeonato";
import {
  formatarDataHoraEvento,
  rotuloEventType,
  rotuloOponente,
  tempoRelativo,
} from "../utils/utilitarios_log_eventos";
import type { EventoLogConfronto } from "../types/tipos_log_eventos";

interface Props {
  evento: EventoLogConfronto;
  novo?: boolean;
}

export default function LinhaLogEvento({ evento, novo }: Props) {
  const isReverted = evento.event_type === "ride_reverted";
  const Icone = isReverted ? RotateCcw : Car;
  const oponente = rotuloOponente(evento);

  return (
    <div
      className={`flex flex-col gap-1.5 rounded-md border bg-card px-3 py-2 text-xs transition-colors md:flex-row md:items-center md:justify-between ${
        novo ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30" : "border-border"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            isReverted
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          }`}
          aria-hidden
        >
          <Icone className="h-3.5 w-3.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate font-medium text-foreground">
              {evento.driver_name ?? "Motorista desconhecido"}
            </span>
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              {rotuloEventType(evento.event_type)}
            </Badge>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
            <Swords className="h-3 w-3" />
            <span>{ROTULOS_RODADA[evento.bracket_round]}</span>
            <span>·</span>
            <span>Slot {evento.bracket_slot}</span>
            <ArrowRight className="h-3 w-3" />
            <span className="truncate">vs {oponente}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start text-[11px] text-muted-foreground md:items-end">
        <span className="font-medium text-foreground">{tempoRelativo(evento.occurred_at)}</span>
        <span className="tabular-nums">{formatarDataHoraEvento(evento.occurred_at)}</span>
      </div>
    </div>
  );
}