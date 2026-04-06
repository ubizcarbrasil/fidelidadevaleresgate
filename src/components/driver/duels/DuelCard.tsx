/**
 * Card resumido de duelo para listas.
 */
import React from "react";
import { Swords, Clock, Trophy, Flag, XCircle, Coins, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Duel } from "./hook_duelos";
import { cleanDriverName } from "./hook_duelos";
import { formatPoints } from "@/lib/formatPoints";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: "Pendente", icon: <Clock className="h-3 w-3" />, color: "hsl(var(--warning))" },
  accepted: { label: "Aceito", icon: <Swords className="h-3 w-3" />, color: "hsl(var(--info))" },
  declined: { label: "Arregou 😅", icon: <Flag className="h-3 w-3" />, color: "hsl(var(--muted-foreground))" },
  live: { label: "Ao Vivo 🔥", icon: <Swords className="h-3 w-3" />, color: "hsl(var(--success))" },
  finished: { label: "Encerrado", icon: <Trophy className="h-3 w-3" />, color: "hsl(var(--primary))" },
  canceled: { label: "Cancelado", icon: <XCircle className="h-3 w-3" />, color: "hsl(var(--destructive))" },
};

interface Props {
  duel: Duel;
  participantId: string | null;
  onClick?: () => void;
}

export default function DuelCard({ duel, participantId, onClick }: Props) {
  const cfg = statusConfig[duel.status] || statusConfig.pending;

  const challengerName = cleanDriverName((duel.challenger as any)?.customers?.name);
  const challengedName = cleanDriverName((duel.challenged as any)?.customers?.name);

  const isChallenger = participantId === duel.challenger_id;
  const opponentName = isChallenger ? challengedName : challengerName;
  const myRides = isChallenger ? duel.challenger_rides_count : duel.challenged_rides_count;
  const theirRides = isChallenger ? duel.challenged_rides_count : duel.challenger_rides_count;

  const hasBet = (duel.challenger_points_bet || 0) > 0;
  const totalBet = (duel.challenger_points_bet || 0) + (duel.challenged_points_bet || 0);
  const isNegotiating = duel.negotiation_status === "counter_proposed";

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl p-3.5 text-left transition-all active:scale-[0.98]"
      style={{
        backgroundColor: "hsl(var(--card))",
        border: duel.status === "live" ? "1px solid hsl(var(--success) / 0.4)" : "1px solid hsl(var(--border))",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4" style={{ color: cfg.color }} />
          <span className="text-sm font-bold text-foreground">vs {opponentName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {hasBet && (
            <Badge
              variant="outline"
              className="text-[10px] gap-1 border-0 px-2 py-0.5"
              style={{ backgroundColor: "hsl(var(--warning) / 0.15)", color: "hsl(var(--warning))" }}
            >
              <Coins className="h-3 w-3" />
              {duel.points_reserved ? formatPoints(totalBet) : formatPoints(duel.challenger_points_bet)} pts
            </Badge>
          )}
          {isNegotiating && (
            <Badge
              variant="outline"
              className="text-[10px] gap-1 border-0 px-2 py-0.5"
              style={{ backgroundColor: "hsl(var(--info) / 0.15)", color: "hsl(var(--info))" }}
            >
              <MessageSquare className="h-3 w-3" />
              Negociando
            </Badge>
          )}
          <Badge
            variant="outline"
            className="text-[10px] gap-1 border-0 px-2 py-0.5"
            style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
          >
            {cfg.icon}
            {cfg.label}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {format(new Date(duel.start_at), "dd/MM HH:mm", { locale: ptBR })} — {format(new Date(duel.end_at), "dd/MM HH:mm", { locale: ptBR })}
        </span>
        {(duel.status === "live" || duel.status === "finished") && (
          <span className="text-xs font-bold" style={{ color: cfg.color }}>
            {myRides} × {theirRides}
          </span>
        )}
      </div>
    </button>
  );
}
