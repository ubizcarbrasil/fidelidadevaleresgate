/**
 * Feed de atividade de duelos da cidade — timeline social visível para todos.
 */
import { Swords, Flag, Trophy, Flame, Clock, UserPlus, Handshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { resolveParticipantName, type Duel } from "./hook_duelos";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  duelos: Duel[];
  onOpenDuel?: (duel: Duel) => void;
  fontHeading?: string;
}

const iconPorStatus: Record<string, { icon: React.ReactNode; cor: string; label: string }> = {
  pending: { icon: <UserPlus className="h-3.5 w-3.5" />, cor: "hsl(var(--warning))", label: "Desafio enviado" },
  accepted: { icon: <Handshake className="h-3.5 w-3.5" />, cor: "hsl(var(--info))", label: "Desafio aceito" },
  live: { icon: <Flame className="h-3.5 w-3.5" />, cor: "hsl(var(--success))", label: "Ao vivo" },
  finished: { icon: <Trophy className="h-3.5 w-3.5" />, cor: "hsl(var(--primary))", label: "Resultado" },
  declined: { icon: <Flag className="h-3.5 w-3.5" />, cor: "hsl(var(--muted-foreground))", label: "Arregou 😅" },
};

function descricaoEvento(d: Duel): string {
  const nomeA = resolveParticipantName(d.challenger);
  const nomeB = resolveParticipantName(d.challenged);

  switch (d.status) {
    case "pending":
      return `${nomeA} desafiou ${nomeB} para um duelo!`;
    case "accepted":
      return `${nomeB} aceitou o duelo de ${nomeA}! 💪`;
    case "live":
      return `${nomeA} vs ${nomeB} — duelo rolando agora!`;
    case "finished": {
      if (!d.winner_id) return `${nomeA} vs ${nomeB} — Empate! 🤝`;
      const vencedor = d.winner_id === d.challenger_id ? nomeA : nomeB;
      return `${vencedor} venceu o duelo! 🏆`;
    }
    case "declined":
      return `${nomeB} arregou do duelo contra ${nomeA}! 😅`;
    default:
      return `${nomeA} vs ${nomeB}`;
  }
}

function tempoRelativo(data: string): string {
  return formatDistanceToNow(new Date(data), { addSuffix: true, locale: ptBR });
}

export default function FeedAtividadeCidade({ duelos, onOpenDuel, fontHeading }: Props) {
  if (duelos.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2
        className="text-sm font-bold text-foreground flex items-center gap-2"
        style={fontHeading ? { fontFamily: fontHeading } : undefined}
      >
        <Swords className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
        Atividade da Cidade
      </h2>
      <p className="text-[11px] text-muted-foreground -mt-1">
        Últimos 30 dias de duelos na sua cidade
      </p>

      <div className="space-y-1.5">
        {duelos.map((d) => {
          const cfg = iconPorStatus[d.status] || iconPorStatus.pending;
          const isClickable = d.status === "live" || d.status === "finished" || d.status === "accepted";

          return (
            <button
              key={d.id}
              onClick={() => isClickable && onOpenDuel?.(d)}
              disabled={!isClickable}
              className="w-full flex items-start gap-3 rounded-xl p-3 text-left transition-all disabled:cursor-default"
              style={{
                backgroundColor: "hsl(var(--card))",
                border: d.status === "live"
                  ? "1px solid hsl(var(--success) / 0.4)"
                  : "1px solid hsl(var(--border) / 0.5)",
              }}
            >
              {/* Ícone lateral */}
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${cfg.cor}20`, color: cfg.cor }}
              >
                {cfg.icon}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Badge
                    variant="outline"
                    className="text-[9px] gap-0.5 border-0 px-1.5 py-0"
                    style={{ backgroundColor: `${cfg.cor}20`, color: cfg.cor }}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </Badge>
                  {d.status === "live" && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "hsl(var(--success))" }} />
                  )}
                </div>
                <p className="text-xs text-foreground leading-snug">
                  {descricaoEvento(d)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {tempoRelativo(d.created_at)}
                  </span>
                  {(d.status === "live" || d.status === "finished") && (
                    <span className="text-[10px] font-bold tabular-nums" style={{ color: cfg.cor }}>
                      {d.challenger_rides_count} × {d.challenged_rides_count}
                    </span>
                  )}
                </div>
              </div>

              {/* Seta para duelos clicáveis */}
              {isClickable && (
                <span className="text-[10px] text-muted-foreground mt-2 shrink-0">›</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}