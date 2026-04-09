/**
 * Card de desafio recebido — aceitar, contraproposta ou recusar.
 */
import React, { useState } from "react";
import { Swords, ShieldCheck, Flag, MessageSquare, Coins, Wallet, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Duel } from "./hook_duelos";
import { resolveParticipantName, resolveParticipantAvatar, useRespondDuel, useCounterPropose } from "./hook_duelos";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { formatPoints } from "@/lib/formatPoints";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ConfirmacaoAceiteDuelo from "./ConfirmacaoAceiteDuelo";

interface Props {
  duel: Duel;
}

export default function DuelChallengeCard({ duel }: Props) {
  const { driver } = useDriverSession();
  const { mutate: respond, isPending: responding } = useRespondDuel();
  const { mutate: counterPropose, isPending: proposing } = useCounterPropose();
  const [showCounter, setShowCounter] = useState(false);
  const [counterValue, setCounterValue] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const challengerName = resolveParticipantName(duel.challenger);
  const challengerAvatar = resolveParticipantAvatar(duel.challenger);
  const hasBet = duel.challenger_points_bet > 0;
  const balance = driver?.points_balance ?? 0;
  const counterNum = parseInt(counterValue) || 0;

  const handleCounterSubmit = () => {
    if (counterNum <= 0) return;
    counterPropose({
      duelId: duel.id,
      counterPoints: counterNum,
      opponentCustomerId: (duel.challenger as any)?.customer_id,
    });
  };

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        backgroundColor: "hsl(var(--card))",
        border: "1px solid hsl(var(--warning) / 0.4)",
      }}
    >
      <div className="flex items-center gap-2">
        {challengerAvatar ? (
          <img src={challengerAvatar} alt={challengerName} className="h-8 w-8 rounded-full object-cover shrink-0" />
        ) : (
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "hsl(var(--warning) / 0.15)" }}
          >
            <Swords className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Desafio de {challengerName}</p>
          <p className="text-[11px] text-muted-foreground">
            {format(new Date(duel.start_at), "dd/MM HH:mm", { locale: ptBR })} — {format(new Date(duel.end_at), "dd/MM HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      {hasBet && (
        <div
          className="rounded-lg p-3 space-y-1"
          style={{ backgroundColor: "hsl(var(--warning) / 0.08)", border: "1px solid hsl(var(--warning) / 0.2)" }}
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Coins className="h-3.5 w-3.5" /> Aposta proposta
            </span>
            <span className="font-bold" style={{ color: "hsl(var(--warning))" }}>
              {formatPoints(duel.challenger_points_bet)} pts
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Você precisará colocar</span>
            <span className="font-bold text-foreground">{formatPoints(duel.challenger_points_bet)} pts</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total em disputa</span>
            <span className="font-extrabold" style={{ color: "hsl(var(--primary))" }}>
              {formatPoints(duel.challenger_points_bet * 2)} pts
            </span>
          </div>
          <div className="flex items-center gap-1 pt-1">
            <Wallet className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Seu saldo: {formatPoints(balance)} pts</span>
          </div>
        </div>
      )}

      {!hasBet && (
        <p className="text-xs text-muted-foreground">
          Quem fizer mais corridas no período vence! Topa o desafio? 🥊
        </p>
      )}

      {!showCounter ? (
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => hasBet ? setShowConfirm(true) : respond({ duelId: duel.id, accept: true, challengerCustomerId: (duel.challenger as any)?.customer_id, challengerName })}
            disabled={responding || proposing || (hasBet && balance < duel.challenger_points_bet)}
            className="w-full gap-1.5"
            size="sm"
          >
            <ShieldCheck className="h-4 w-4" />
            {hasBet ? `Aceitar (${formatPoints(duel.challenger_points_bet)} pts)` : "Aceitar"}
          </Button>
          <div className="flex gap-2">
            {hasBet && (
              <Button
                onClick={() => setShowCounter(true)}
                disabled={responding || proposing}
                variant="secondary"
                className="flex-1 gap-1.5"
                size="sm"
              >
                <MessageSquare className="h-4 w-4" />
                Contraproposta
              </Button>
            )}
            <Button
              onClick={() => respond({ duelId: duel.id, accept: false, challengerCustomerId: (duel.challenger as any)?.customer_id, challengerName })}
              disabled={responding || proposing}
              variant="outline"
              className="flex-1 gap-1.5"
              size="sm"
            >
              <Flag className="h-4 w-4" />
              Arregar 🐔
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={balance}
              placeholder="Valor da contraproposta"
              value={counterValue}
              onChange={(e) => setCounterValue(e.target.value)}
              className="flex-1 rounded-xl bg-muted border-0"
            />
            <Button
              onClick={handleCounterSubmit}
              disabled={proposing || counterNum <= 0 || counterNum > balance}
              size="sm"
              className="gap-1"
            >
              <Send className="h-3.5 w-3.5" />
              Enviar
            </Button>
          </div>
          <button onClick={() => setShowCounter(false)} className="text-xs text-muted-foreground underline">
            Cancelar
          </button>
        </div>
      )}
      {hasBet && (
        <ConfirmacaoAceiteDuelo
          open={showConfirm}
          onOpenChange={setShowConfirm}
          onConfirm={() => {
            setShowConfirm(false);
            respond({ duelId: duel.id, accept: true, challengerCustomerId: (duel.challenger as any)?.customer_id, challengerName });
          }}
          opponentName={challengerName}
          startAt={duel.start_at}
          endAt={duel.end_at}
          pointsBet={duel.challenger_points_bet}
          isPending={responding}
        />
      )}
    </div>
  );
}
