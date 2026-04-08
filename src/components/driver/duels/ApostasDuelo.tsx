/**
 * Seção de apostas laterais na Arena ao Vivo.
 */
import React, { useState, useMemo } from "react";
import { Target, Plus, Coins, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { useSideBets } from "./hook_apostas_duelo";
import ApostaAbertaCard from "./ApostaAbertaCard";
import CriarApostaSheet from "./CriarApostaSheet";
import { formatPoints } from "@/lib/formatPoints";
import type { Duel } from "./hook_duelos";

interface Props {
  duel: Duel;
}

export default function ApostasDuelo({ duel }: Props) {
  const { driver } = useDriverSession();
  const { data: bets = [], isLoading } = useSideBets(duel.id);
  const [showCreate, setShowCreate] = useState(false);

  const isDuelParticipant = driver && (
    driver.id === duel.challenger?.customer_id ||
    driver.id === duel.challenged?.customer_id
  );

  const duelActive = duel.status === "live" || duel.status === "accepted";

  const { openBets, myBets, matchedBets } = useMemo(() => {
    const open: typeof bets = [];
    const mine: typeof bets = [];
    const matched: typeof bets = [];
    for (const b of bets) {
      if (b.status === "open" || b.status === "counter_proposed") {
        if (driver && (b.bettor_a_customer_id === driver.id || b.bettor_b_customer_id === driver.id)) {
          mine.push(b);
        } else {
          open.push(b);
        }
      } else if (b.status === "matched") {
        if (driver && (b.bettor_a_customer_id === driver.id || b.bettor_b_customer_id === driver.id)) {
          mine.push(b);
        } else {
          matched.push(b);
        }
      } else if (b.status === "settled" && driver && (b.bettor_a_customer_id === driver.id || b.bettor_b_customer_id === driver.id)) {
        mine.push(b);
      }
    }
    return { openBets: open, myBets: mine, matchedBets: matched };
  }, [bets, driver]);

  const totalMatched = bets
    .filter(b => b.status === "matched" || b.status === "settled")
    .reduce((acc, b) => acc + (b.bettor_a_points || 0) + (b.bettor_b_points || 0), 0);

  if (showCreate) {
    return <CriarApostaSheet duel={duel} onBack={() => setShowCreate(false)} />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
          <h3 className="text-sm font-extrabold text-foreground">Apostas da Galera</h3>
        </div>
        {totalMatched > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: "hsl(var(--warning) / 0.1)" }}>
            <Coins className="h-3 w-3" style={{ color: "hsl(var(--warning))" }} />
            <span className="text-[10px] font-bold" style={{ color: "hsl(var(--warning))" }}>{formatPoints(totalMatched)} em jogo</span>
          </div>
        )}
      </div>

      {/* Create button */}
      {driver && !isDuelParticipant && duelActive && (
        <Button
          onClick={() => setShowCreate(true)}
          variant="outline"
          className="w-full h-10 text-xs font-bold gap-2"
          style={{ borderColor: "hsl(var(--primary) / 0.3)", color: "hsl(var(--primary))" }}
        >
          <Plus className="h-3.5 w-3.5" /> Criar Aposta
        </Button>
      )}

      {isDuelParticipant && (
        <div className="rounded-lg px-3 py-2 text-center" style={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}>
          <p className="text-[10px] text-muted-foreground font-medium">
            Participantes do duelo não podem apostar
          </p>
        </div>
      )}

      {/* My bets */}
      {myBets.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Minhas apostas</p>
          {myBets.map(b => <ApostaAbertaCard key={b.id} bet={b} duel={duel} />)}
        </div>
      )}

      {/* Open bets */}
      {openBets.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
            <Users className="h-3 w-3" /> Apostas disponíveis
          </p>
          {openBets.map(b => <ApostaAbertaCard key={b.id} bet={b} duel={duel} />)}
        </div>
      )}

      {/* Matched bets (others) */}
      {matchedBets.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Apostas fechadas</p>
          {matchedBets.map(b => <ApostaAbertaCard key={b.id} bet={b} duel={duel} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && bets.length === 0 && (
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "hsl(var(--muted) / 0.2)" }}>
          <Target className="h-6 w-6 mx-auto mb-1 text-muted-foreground opacity-40" />
          <p className="text-xs text-muted-foreground">Nenhuma aposta ainda. Seja o primeiro!</p>
        </div>
      )}
    </div>
  );
}
