import { Activity, Calendar, Hash, Swords, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROTULOS_RODADA } from "../constants/constantes_campeonato";
import {
  formatarDataHoraEvento,
  rotuloEventType,
  rotuloOponente,
  tempoRelativo,
} from "../utils/utilitarios_log_eventos";
import type { EventoLogConfronto } from "../types/tipos_log_eventos";

interface Props {
  evento: EventoLogConfronto | null;
  posicao: number; // 1-indexado para exibição
  total: number;
}

function LinhaInfo({
  icone,
  rotulo,
  children,
}: {
  icone: React.ReactNode;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icone}
        {rotulo}
      </div>
      <div className="text-sm font-medium text-foreground break-words">{children}</div>
    </div>
  );
}

export default function PainelDetalhesEvento({ evento, posicao, total }: Props) {
  if (!evento) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Activity className="h-4 w-4 text-primary" />
          Detalhes do evento
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Avance a reprodução para visualizar os detalhes de cada evento aplicado ao bracket.
        </p>
      </div>
    );
  }

  const corEvento =
    evento.event_type === "ride_completed"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : evento.event_type === "ride_reverted"
      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
      : "bg-muted text-muted-foreground";

  const copiarBracket = async () => {
    try {
      await navigator.clipboard.writeText(evento.bracket_id);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Detalhes do evento</h4>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {posicao} / {total}
        </Badge>
      </div>

      <div className="mt-3">
        <Badge className={`${corEvento} border-0 text-[11px]`}>
          {rotuloEventType(evento.event_type)}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <LinhaInfo icone={<Calendar className="h-3 w-3" />} rotulo="Timestamp">
          <div>{formatarDataHoraEvento(evento.occurred_at)}</div>
          <div className="text-xs font-normal text-muted-foreground">
            {tempoRelativo(evento.occurred_at)}
          </div>
        </LinhaInfo>

        <LinhaInfo icone={<User className="h-3 w-3" />} rotulo="Motorista">
          <div>{evento.driver_name ?? "—"}</div>
          <div className="text-xs font-normal text-muted-foreground">
            Lado {evento.lado === "desconhecido" ? "—" : evento.lado} · vs {rotuloOponente(evento)}
          </div>
        </LinhaInfo>

        <LinhaInfo icone={<Swords className="h-3 w-3" />} rotulo="Confronto">
          <div>
            {ROTULOS_RODADA[evento.bracket_round]} · Slot {evento.bracket_slot}
          </div>
          <div className="text-xs font-normal text-muted-foreground">
            {evento.driver_a_name ?? "—"} <span className="text-muted-foreground">vs</span>{" "}
            {evento.driver_b_name ?? "—"}
          </div>
        </LinhaInfo>

        <LinhaInfo icone={<Hash className="h-3 w-3" />} rotulo="Bracket ID">
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              {evento.bracket_id.slice(0, 8)}…{evento.bracket_id.slice(-4)}
            </code>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px]"
              onClick={copiarBracket}
            >
              copiar
            </Button>
          </div>
          {evento.event_ref_id && (
            <div className="mt-1 text-[10px] font-normal text-muted-foreground">
              Ref: {evento.event_ref_id}
            </div>
          )}
        </LinhaInfo>
      </div>
    </div>
  );
}