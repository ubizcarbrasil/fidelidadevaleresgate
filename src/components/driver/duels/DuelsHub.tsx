/**
 * Tela principal do módulo de Duelos entre Motoristas.
 */
import React, { useState, useMemo } from "react";
import { ArrowLeft, Swords, Plus, Shield, Clock, Trophy, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { useDuelParticipation, useDriverDuels } from "./hook_duelos";
import DuelCard from "./DuelCard";
import DuelChallengeCard from "./DuelChallengeCard";
import DuelDetailSheet from "./DuelDetailSheet";
import CreateDuelSheet from "./CreateDuelSheet";
import MeuDesempenhoSheet from "./MeuDesempenhoSheet";
import RankingCidadeSheet from "./RankingCidadeSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";

interface Props {
  onBack: () => void;
}

export default function DuelsHub({ onBack }: Props) {
  const { driver } = useDriverSession();
  const { participant, isLoading: loadingPart, toggleParticipation, toggling } = useDuelParticipation();
  const { data: duels, isLoading: loadingDuels } = useDriverDuels();

  const [showCreate, setShowCreate] = useState(false);
  const [showDesempenho, setShowDesempenho] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [selectedDuel, setSelectedDuel] = useState<string | null>(null);

  const isEnabled = participant?.duels_enabled === true;
  const participantId = participant?.id || null;

  const pendingChallenges = useMemo(
    () => (duels || []).filter((d) => d.status === "pending" && d.challenged_id === participantId),
    [duels, participantId]
  );

  const liveDuels = useMemo(
    () => (duels || []).filter((d) => d.status === "live" || d.status === "accepted"),
    [duels]
  );

  const scheduledDuels = useMemo(
    () => (duels || []).filter((d) => d.status === "pending" && d.challenger_id === participantId),
    [duels, participantId]
  );

  const historyDuels = useMemo(
    () => (duels || []).filter((d) => ["finished", "declined", "canceled"].includes(d.status)),
    [duels]
  );

  const selectedDuelData = useMemo(
    () => (duels || []).find((d) => d.id === selectedDuel) || null,
    [duels, selectedDuel]
  );

  if (showCreate) {
    return <CreateDuelSheet onBack={() => setShowCreate(false)} onSuccess={() => setShowCreate(false)} />;
  }

  if (showDesempenho) {
    return <MeuDesempenhoSheet duels={duels} participantId={participantId} onBack={() => setShowDesempenho(false)} />;
  }

  if (selectedDuelData) {
    return <DuelDetailSheet duel={selectedDuelData} participantId={participantId} onBack={() => setSelectedDuel(null)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "hsl(var(--background))" }}>
        <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-xl" style={{ backgroundColor: "hsl(var(--muted))" }}>
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground flex items-center gap-2">
          <Swords className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          Duelos
        </h1>
      </header>

      <div className="flex-1 px-4 pb-8 space-y-5 max-w-lg mx-auto w-full">
        {/* Toggle participation */}
        <div
          className="rounded-xl p-4 flex items-center justify-between"
          style={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: isEnabled ? "hsl(var(--success) / 0.15)" : "hsl(var(--muted))" }}
            >
              <Shield className="h-5 w-5" style={{ color: isEnabled ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Participar dos Duelos</p>
              <p className="text-[11px] text-muted-foreground">
                {isEnabled ? "Você está visível para desafios" : "Ative para participar"}
              </p>
            </div>
          </div>
          {loadingPart ? (
            <Skeleton className="h-6 w-11 rounded-full" />
          ) : (
            <Switch
              checked={isEnabled}
              disabled={toggling}
              onCheckedChange={(val) => toggleParticipation(val)}
            />
          )}
        </div>

        {/* Action buttons */}
        {isEnabled && (
          <div className="flex gap-2">
            <Button onClick={() => setShowCreate(true)} className="flex-1 gap-2">
              <Plus className="h-4 w-4" />
              Desafiar
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDesempenho(true)}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Meu Desempenho
            </Button>
          </div>
        )}

        {/* Pending challenges received */}
        {pendingChallenges.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Swords className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
              Desafios Recebidos
            </h2>
            {pendingChallenges.map((d) => (
              <DuelChallengeCard key={d.id} duel={d} />
            ))}
          </section>
        )}

        {/* Live duels */}
        {liveDuels.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Flame className="h-4 w-4" style={{ color: "hsl(var(--success))" }} />
              Ao Vivo
            </h2>
            {liveDuels.map((d) => (
              <DuelCard key={d.id} duel={d} participantId={participantId} onClick={() => setSelectedDuel(d.id)} />
            ))}
          </section>
        )}

        {/* Scheduled (sent by me, pending) */}
        {scheduledDuels.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: "hsl(var(--info))" }} />
              Aguardando Resposta
            </h2>
            {scheduledDuels.map((d) => (
              <DuelCard key={d.id} duel={d} participantId={participantId} onClick={() => setSelectedDuel(d.id)} />
            ))}
          </section>
        )}

        {/* History */}
        {historyDuels.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
              Histórico
            </h2>
            {historyDuels.map((d) => (
              <DuelCard key={d.id} duel={d} participantId={participantId} onClick={() => setSelectedDuel(d.id)} />
            ))}
          </section>
        )}

        {/* Loading state */}
        {loadingDuels && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingDuels && isEnabled && (duels || []).length === 0 && (
          <div className="text-center py-8">
            <Swords className="h-12 w-12 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground) / 0.3)" }} />
            <p className="text-sm text-muted-foreground">Nenhum duelo ainda</p>
            <p className="text-xs text-muted-foreground mt-1">Desafie um motorista e mostre quem manda! 🥊</p>
          </div>
        )}
      </div>
    </div>
  );
}
