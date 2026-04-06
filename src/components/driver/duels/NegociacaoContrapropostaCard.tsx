/**
 * Card exibido quando o motorista recebe uma contraproposta de pontos.
 */
import React, { useState } from "react";
import { MessageSquare, ShieldCheck, XCircle, Coins, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Duel } from "./hook_duelos";
import { cleanDriverName, useRespondCounterProposal } from "./hook_duelos";
import { formatPoints } from "@/lib/formatPoints";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ConfirmacaoAceiteDuelo from "./ConfirmacaoAceiteDuelo";

interface Props {
  duel: Duel;
  participantId: string | null;
}

export default function NegociacaoContrapropostaCard({ duel, participantId }: Props) {
  const { mutate: respondCounter, isPending } = useRespondCounterProposal();
  const [showConfirm, setShowConfirm] = useState(false);

  const isChallenger = participantId === duel.challenger_id;
  const opponentName = isChallenger
    ? cleanDriverName((duel.challenged as any)?.customers?.name)
    : cleanDriverName((duel.challenger as any)?.customers?.name);
  const opponentCustomerId = isChallenger
    ? (duel.challenged as any)?.customer_id
    : (duel.challenger as any)?.customer_id;

  const originalBet = duel.challenger_points_bet;
  const counterBet = duel.counter_proposal_points || 0;

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        backgroundColor: "hsl(var(--card))",
        border: "1px solid hsl(var(--info) / 0.4)",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "hsl(var(--info) / 0.15)" }}
        >
          <MessageSquare className="h-4 w-4" style={{ color: "hsl(var(--info))" }} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Contraproposta de {opponentName}</p>
          <p className="text-[11px] text-muted-foreground">
            {format(new Date(duel.start_at), "dd/MM HH:mm", { locale: ptBR })} — {format(new Date(duel.end_at), "dd/MM HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div
        className="rounded-lg p-3 flex items-center justify-between"
        style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
      >
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Sua proposta</p>
          <p className="text-sm font-bold text-foreground flex items-center gap-1">
            <Coins className="h-3.5 w-3.5" style={{ color: "hsl(var(--warning))" }} />
            {formatPoints(originalBet)} pts
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Contraproposta</p>
          <p className="text-sm font-bold flex items-center gap-1" style={{ color: "hsl(var(--info))" }}>
            <Coins className="h-3.5 w-3.5" />
            {formatPoints(counterBet)} pts
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Se aceitar, cada lado aposta <strong>{formatPoints(counterBet)} pts</strong>. Total em disputa: <strong>{formatPoints(counterBet * 2)} pts</strong>
      </p>

      <div className="flex gap-2">
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={isPending}
          className="flex-1 gap-1.5"
          size="sm"
        >
          <ShieldCheck className="h-4 w-4" />
          Aceitar ({formatPoints(counterBet)} pts)
        </Button>
        <Button
          onClick={() => respondCounter({ duelId: duel.id, accept: false, opponentCustomerId })}
          disabled={isPending}
          variant="outline"
          className="flex-1 gap-1.5"
          size="sm"
        >
          <XCircle className="h-4 w-4" />
          Recusar e Encerrar
        </Button>
      </div>

      <ConfirmacaoAceiteDuelo
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={() => {
          setShowConfirm(false);
          respondCounter({ duelId: duel.id, accept: true, opponentCustomerId });
        }}
        opponentName={opponentName}
        startAt={duel.start_at}
        endAt={duel.end_at}
        pointsBet={counterBet}
        isPending={isPending}
      />
    </div>
  );
}
