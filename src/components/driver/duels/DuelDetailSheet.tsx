/**
 * Detalhe de um duelo — placar, countdown, vencedor, pontos em jogo.
 */
import React, { useEffect, useState } from "react";
import { ArrowLeft, Swords, Trophy, Timer, Crown, Coins, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Duel } from "./hook_duelos";
import { resolveParticipantName, resolveParticipantAvatar, cleanDriverName, useFinalizeDuel } from "./hook_duelos";
import { useDuelRating } from "./hook_avaliacao_duelo";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { formatPoints } from "@/lib/formatPoints";
import { format, differenceInSeconds, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import AvaliacaoDueloSheet from "./AvaliacaoDueloSheet";

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
  const { driver } = useDriverSession();
  const { mutate: finalize, isPending: finalizing } = useFinalizeDuel();
  const [remaining, setRemaining] = useState(0);
  const [showRating, setShowRating] = useState(false);

  const isChallenger = participantId === duel.challenger_id;
  const opponentCustomerId = isChallenger
    ? (duel.challenged as any)?.customer_id
    : (duel.challenger as any)?.customer_id;

  const { data: existingRating } = useDuelRating(
    duel.status === "finished" ? duel.id : null,
    driver?.id || null
  );

  const challengerName = resolveParticipantName(duel.challenger);
  const challengedName = resolveParticipantName(duel.challenged);
  const challengerAvatar = resolveParticipantAvatar(duel.challenger);
  const challengedAvatar = resolveParticipantAvatar(duel.challenged);

  const opponentName = isChallenger ? challengedName : challengerName;
  const winnerId = duel.winner_id;
  const hasBet = (duel.challenger_points_bet || 0) > 0;
  const totalBet = (duel.challenger_points_bet || 0) + (duel.challenged_points_bet || 0);

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
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "hsl(var(--background))" }}>
        <button onClick={onBack} className="shrink-0 h-9 w-9 flex items-center justify-center rounded-xl" style={{ backgroundColor: "hsl(var(--muted))" }}>
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground flex items-center gap-2 truncate">
          <Swords className="h-5 w-5 shrink-0" style={{ color: "hsl(var(--primary))" }} />
          Detalhe do Duelo
        </h1>
      </header>

      <div className="flex-1 px-4 pb-8 space-y-5 w-full">
        {/* Status + countdown */}
        {(duel.status === "live" || duel.status === "accepted") && remaining > 0 && (
          <div className="text-center py-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Timer className="h-5 w-5" style={{ color: "hsl(var(--warning))" }} />
              <span className="text-sm font-medium text-muted-foreground">Tempo restante</span>
            </div>
            <span className="text-3xl font-extrabold" style={{ color: "hsl(var(--primary))" }}>
              {formatCountdown(remaining)}
            </span>
          </div>
        )}

        {/* Points at stake */}
        {hasBet && duel.points_reserved && (
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: "linear-gradient(135deg, hsl(var(--warning) / 0.1), hsl(var(--warning) / 0.05))",
              border: "1px solid hsl(var(--warning) / 0.3)",
            }}
          >
            <Coins className="h-6 w-6 mx-auto mb-1" style={{ color: "hsl(var(--warning))" }} />
            <p className="text-xs text-muted-foreground">Pontos em disputa</p>
            <p className="text-2xl font-extrabold" style={{ color: "hsl(var(--warning))" }}>
              {formatPoints(totalBet)} pts
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {formatPoints(duel.challenger_points_bet)} pts de cada lado • Pontos reservados 🔒
            </p>
          </div>
        )}

        {hasBet && !duel.points_reserved && duel.status === "pending" && (
          <div
            className="rounded-xl p-3 text-center"
            style={{ backgroundColor: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}
          >
            <p className="text-xs text-muted-foreground">Aposta proposta: <strong>{formatPoints(duel.challenger_points_bet)} pts</strong> cada</p>
            <p className="text-[10px] text-muted-foreground">Aguardando acordo para reservar pontos</p>
          </div>
        )}

        {/* Scoreboard */}
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-start">
            <div className="flex-1 min-w-0 text-center">
              <p className="text-[11px] text-muted-foreground mb-0.5">Desafiante</p>
              <p className="text-xs font-bold text-foreground leading-tight line-clamp-2 px-1">{challengerName}</p>
              <p className="text-4xl font-extrabold mt-2" style={{ color: winnerId === duel.challenger_id ? "hsl(var(--success))" : "hsl(var(--foreground))" }}>
                {duel.challenger_rides_count}
              </p>
              <p className="text-[10px] text-muted-foreground">corridas</p>
              {winnerId === duel.challenger_id && (
                <Crown className="h-5 w-5 mx-auto mt-1" style={{ color: "hsl(var(--warning))" }} />
              )}
            </div>

            <div className="shrink-0 flex items-center justify-center pt-8 px-2">
              <span className="text-lg font-extrabold text-muted-foreground">×</span>
            </div>

            <div className="flex-1 min-w-0 text-center">
              <p className="text-[11px] text-muted-foreground mb-0.5">Desafiado</p>
              <p className="text-xs font-bold text-foreground leading-tight line-clamp-2 px-1">{challengedName}</p>
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
              <>
                <p className="text-sm font-bold text-foreground">
                  🏆 {winnerId === duel.challenger_id ? challengerName : challengedName} venceu!
                </p>
                {hasBet && duel.points_settled && (
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--success))" }}>
                    Prêmio: +{formatPoints(totalBet)} pts
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-foreground">🤝 Empate!</p>
                {hasBet && duel.points_settled && (
                  <p className="text-xs mt-1 text-muted-foreground">
                    Pontos devolvidos: {formatPoints(duel.challenger_points_bet)} pts para cada
                  </p>
                )}
              </>
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

        {/* Rate opponent button */}
        {duel.status === "finished" && driver?.id && opponentCustomerId && !existingRating && (
          <Button
            onClick={() => setShowRating(true)}
            variant="outline"
            className="w-full gap-2"
          >
            <Star className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
            Avaliar Adversário
          </Button>
        )}

        {duel.status === "finished" && existingRating && (
          <div
            className="flex items-center justify-center gap-2 rounded-xl p-3"
            style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
          >
            <CheckCircle className="h-4 w-4" style={{ color: "hsl(var(--success))" }} />
            <span className="text-sm text-muted-foreground">Avaliação enviada ⭐ {(existingRating as any).rating}/5</span>
          </div>
        )}
      </div>

      {/* Rating sheet */}
      {showRating && driver?.id && opponentCustomerId && (
        <AvaliacaoDueloSheet
          duelId={duel.id}
          raterCustomerId={driver.id}
          ratedCustomerId={opponentCustomerId}
          opponentName={opponentName}
          onBack={() => setShowRating(false)}
          onSuccess={() => setShowRating(false)}
        />
      )}
    </div>
  );
}
