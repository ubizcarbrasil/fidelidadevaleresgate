/**
 * Detalhe de um duelo — placar, countdown, vencedor.
 */
import React, { useEffect, useState } from "react";
import { ArrowLeft, Swords, Trophy, Timer, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Duel } from "./hook_duelos";
import { cleanDriverName, useFinalizeDuel } from "./hook_duelos";
import { format, differenceInSeconds, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  duel: Duel;
  participantId: string | null;
  onBack: () => void;
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Encerrado";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default function DuelDetailSheet({ duel, participantId, onBack }: Props) {
  const { mutate: finalize, isPending: finalizing } = useFinalizeDuel();
  const [remaining, setRemaining] = useState(0);

  const challengerName = cleanDriverName((duel.challenger as any)?.customers?.name);
  const challengedName = cleanDriverName((duel.challenged as any)?.customers?.name);

  const isChallenger = participantId === duel.challenger_id;
  const winnerId = duel.winner_id;

  useEffect(() => {
    if (duel.status !== "live" && duel.status !== "accepted") return;
    const tick = () => {
      const end = new Date(duel.end_at);
      setRemaining(Math.max(0, differenceInSeconds(end, new Date())));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [duel.end_at, duel.status]);

  const canFinalize = (duel.status === "live" || duel.status === "accepted") && isPast(new Date(duel.end_at));

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-auto"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "hsl(var(--background))" }}>
        <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-xl" style={{ backgroundColor: "hsl(var(--muted))" }}>
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground flex items-center gap-2">
          <Swords className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          Detalhe do Duelo
        </h1>
      </header>

      <div className="flex-1 px-4 pb-8 space-y-6 max-w-lg mx-auto w-full">
        {/* Status + countdown */}
        {(duel.status === "live" || duel.status === "accepted") && remaining > 0 && (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Timer className="h-5 w-5" style={{ color: "hsl(var(--warning))" }} />
              <span className="text-sm font-medium text-muted-foreground">Tempo restante</span>
            </div>
            <span className="text-3xl font-extrabold" style={{ color: "hsl(var(--primary))" }}>
              {formatCountdown(remaining)}
            </span>
          </div>
        )}

        {/* Scoreboard */}
        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div className="flex items-center justify-between">
            {/* Challenger */}
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground mb-1">Desafiante</p>
              <p className="text-sm font-bold text-foreground truncate">{challengerName}</p>
              <p className="text-4xl font-extrabold mt-2" style={{ color: winnerId === duel.challenger_id ? "hsl(var(--success))" : "hsl(var(--foreground))" }}>
                {duel.challenger_rides_count}
              </p>
              <p className="text-[10px] text-muted-foreground">corridas</p>
              {winnerId === duel.challenger_id && (
                <Crown className="h-5 w-5 mx-auto mt-1" style={{ color: "hsl(var(--warning))" }} />
              )}
            </div>

            {/* VS divider */}
            <div className="px-3">
              <span className="text-lg font-extrabold text-muted-foreground">×</span>
            </div>

            {/* Challenged */}
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground mb-1">Desafiado</p>
              <p className="text-sm font-bold text-foreground truncate">{challengedName}</p>
              <p className="text-4xl font-extrabold mt-2" style={{ color: winnerId === duel.challenged_id ? "hsl(var(--success))" : "hsl(var(--foreground))" }}>
                {duel.challenged_rides_count}
              </p>
              <p className="text-[10px] text-muted-foreground">corridas</p>
              {winnerId === duel.challenged_id && (
                <Crown className="h-5 w-5 mx-auto mt-1" style={{ color: "hsl(var(--warning))" }} />
              )}
            </div>
          </div>
        </div>

        {/* Winner banner */}
        {duel.status === "finished" && (
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--success) / 0.1))",
              border: "1px solid hsl(var(--primary) / 0.3)",
            }}
          >
            <Trophy className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--warning))" }} />
            {winnerId ? (
              <p className="text-sm font-bold text-foreground">
                🏆 {winnerId === duel.challenger_id ? challengerName : challengedName} venceu!
              </p>
            ) : (
              <p className="text-sm font-bold text-foreground">🤝 Empate!</p>
            )}
          </div>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Início</span>
            <span className="font-medium text-foreground">{format(new Date(duel.start_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Fim</span>
            <span className="font-medium text-foreground">{format(new Date(duel.end_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
          </div>
        </div>

        {/* Finalize button */}
        {canFinalize && (
          <Button onClick={() => finalize({
            duelId: duel.id,
            brandId: duel.brand_id,
            challengerCustomerId: (duel.challenger as any)?.customer_id || "",
            challengedCustomerId: (duel.challenged as any)?.customer_id || "",
            challengerParticipantId: duel.challenger_id,
            challengedParticipantId: duel.challenged_id,
            challengerName: cleanDriverName((duel.challenger as any)?.customers?.name),
            challengedName: cleanDriverName((duel.challenged as any)?.customers?.name),
          })} disabled={finalizing} className="w-full gap-2">
            <Trophy className="h-4 w-4" />
            Apurar Resultado
          </Button>
        )}
      </div>
    </div>
  );
}
