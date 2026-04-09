/**
 * Card de uma aposta lateral aberta ou em negociação.
 */
import React, { useState } from "react";
import { Coins, UserCheck, ArrowRightLeft, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { cleanDriverName, type Duel } from "./hook_duelos";
import { useAcceptSideBet, useCounterProposeSideBet, useRespondSideBetCounter, type SideBet } from "./hook_apostas_duelo";
import { formatPoints } from "@/lib/formatPoints";

interface Props {
  bet: SideBet;
  duel: Duel;
}

export default function ApostaAbertaCard({ bet, duel }: Props) {
  const { driver, refreshDriver } = useDriverSession();
  const acceptBet = useAcceptSideBet();
  const counterPropose = useCounterProposeSideBet();
  const respondCounter = useRespondSideBetCounter();
  const [showCounter, setShowCounter] = useState(false);
  const [counterValue, setCounterValue] = useState("");
  const [showConfirmAccept, setShowConfirmAccept] = useState(false);

  if (!driver) return null;

  const isMyBet = bet.bettor_a_customer_id === driver.id;
  const isCounterTarget = bet.status === "counter_proposed" && isMyBet;
  const canAccept = bet.status === "open" && !isMyBet;

  // Check if driver is a duel participant
  const challengerCid = duel.challenger?.customer_id;
  const challengedCid = duel.challenged?.customer_id;
  const isDuelParticipant = driver.id === challengerCid || driver.id === challengedCid;

  // Get predicted winner name
  const predictedName = bet.bettor_a_predicted_winner === duel.challenger_id
    ? cleanDriverName(duel.challenger?.public_nickname || (duel.challenger as any)?.customers?.name)
    : cleanDriverName(duel.challenged?.public_nickname || (duel.challenged as any)?.customers?.name);

  const handleAccept = async () => {
    const driverName = cleanDriverName(driver.name);
    await acceptBet.mutateAsync({
      betId: bet.id,
      customerId: driver.id,
      duelId: bet.duel_id,
      brandId: driver.brand_id,
      branchId: driver.branch_id,
      nomeAceitante: driverName,
      bettorACustomerId: bet.bettor_a_customer_id,
    });
    refreshDriver();
    setShowConfirmAccept(false);
  };

  const handleCounter = async () => {
    const val = parseInt(counterValue);
    if (!val || val <= 0) return;
    await counterPropose.mutateAsync({ betId: bet.id, customerId: driver.id, counterPoints: val, duelId: bet.duel_id });
    setShowCounter(false);
    setCounterValue("");
  };

  const handleRespondCounter = async (accept: boolean) => {
    await respondCounter.mutateAsync({ betId: bet.id, customerId: driver.id, accept, duelId: bet.duel_id });
    refreshDriver();
  };

  return (
    <div
      className="rounded-xl p-3.5 space-y-2.5"
      style={{
        backgroundColor: "hsl(var(--card))",
        border: bet.status === "matched" ? "1px solid hsl(var(--success) / 0.3)" : "1px solid hsl(var(--border))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))", color: "white" }}>
            🎯
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">
              {isMyBet ? "Sua aposta" : (bet.bettor_a_name || "Apostador")}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Aposta em <strong>{predictedName}</strong>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-black" style={{ color: "hsl(var(--warning))" }}>{formatPoints(bet.bettor_a_points)}</p>
          <p className="text-[10px] text-muted-foreground">pontos</p>
        </div>
      </div>

      {/* Status badges */}
      {bet.status === "matched" && (
        <div className="rounded-lg px-2.5 py-1.5 text-center" style={{ backgroundColor: "hsl(var(--success) / 0.1)" }}>
          <span className="text-[10px] font-bold" style={{ color: "hsl(var(--success))" }}>
            ✅ Aposta fechada — {formatPoints((bet.bettor_a_points || 0) + (bet.bettor_b_points || 0))} pts em jogo
          </span>
        </div>
      )}

      {bet.status === "settled" && (
        <div className="rounded-lg px-2.5 py-1.5 text-center" style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}>
          <span className="text-[10px] font-bold text-muted-foreground">
            {bet.winner_customer_id === driver.id ? "🏆 Você ganhou!" : bet.winner_customer_id ? "❌ Você perdeu" : "🤝 Empate — devolvido"}
          </span>
        </div>
      )}

      {/* Counter proposal received */}
      {isCounterTarget && (
        <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: "hsl(var(--warning) / 0.08)", border: "1px solid hsl(var(--warning) / 0.2)" }}>
          <p className="text-xs font-bold" style={{ color: "hsl(var(--warning))" }}>
            <ArrowRightLeft className="h-3 w-3 inline mr-1" />
            Contraproposta: {formatPoints(bet.counter_proposal_points || 0)} pts
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleRespondCounter(true)}
              disabled={respondCounter.isPending}
              className="flex-1 h-8 text-xs font-bold gap-1"
              style={{ backgroundColor: "hsl(var(--success))" }}
            >
              <Check className="h-3 w-3" /> Aceitar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRespondCounter(false)}
              disabled={respondCounter.isPending}
              className="flex-1 h-8 text-xs font-bold gap-1"
            >
              <X className="h-3 w-3" /> Recusar
            </Button>
          </div>
        </div>
      )}

      {bet.status === "counter_proposed" && !isMyBet && bet.bettor_b_customer_id === driver.id && (
        <div className="rounded-lg px-2.5 py-1.5 text-center" style={{ backgroundColor: "hsl(var(--warning) / 0.08)" }}>
          <span className="text-[10px] font-bold" style={{ color: "hsl(var(--warning))" }}>
            Aguardando resposta da sua contraproposta...
          </span>
        </div>
      )}

      {/* Actions for open bets (not mine, not duel participant) */}
      {canAccept && !isDuelParticipant && (
        <>
          {!showConfirmAccept && !showCounter && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowConfirmAccept(true)}
                className="flex-1 h-9 text-xs font-bold gap-1"
                style={{ background: "linear-gradient(135deg, hsl(var(--success)), hsl(var(--success) / 0.8))" }}
              >
                <UserCheck className="h-3 w-3" /> Aceitar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCounter(true)}
                className="flex-1 h-9 text-xs font-bold gap-1"
              >
                <ArrowRightLeft className="h-3 w-3" /> Contraproposta
              </Button>
            </div>
          )}

          {/* Confirm accept */}
          {showConfirmAccept && (
            <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: "hsl(var(--warning) / 0.08)", border: "1px solid hsl(var(--warning) / 0.2)" }}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--warning))" }} />
                <p className="text-[11px] text-muted-foreground">
                  Ao aceitar, <strong>{formatPoints(bet.bettor_a_points)} pontos</strong> serão reservados imediatamente.
                  Se perder, você perde tudo. 10% do prêmio vai para o vencedor do duelo.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAccept} disabled={acceptBet.isPending} className="flex-1 h-8 text-xs font-bold" style={{ backgroundColor: "hsl(var(--success))" }}>
                  {acceptBet.isPending ? "..." : "Confirmar"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowConfirmAccept(false)} className="flex-1 h-8 text-xs font-bold">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Counter form */}
          {showCounter && (
            <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Seu valor"
                  value={counterValue}
                  onChange={(e) => setCounterValue(e.target.value)}
                  className="h-8 text-xs"
                  min={1}
                />
                <Button size="sm" onClick={handleCounter} disabled={counterPropose.isPending} className="h-8 text-xs font-bold px-4" style={{ backgroundColor: "hsl(var(--primary))" }}>
                  Enviar
                </Button>
              </div>
              <button onClick={() => setShowCounter(false)} className="text-[10px] text-muted-foreground underline">
                Cancelar
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
