/**
 * Tela de criação de desafio — seleção múltipla de adversários, período e aposta de pontos.
 */
import React, { useState, useMemo } from "react";
import { ArrowLeft, Swords, Search, Calendar, Clock, Send, Coins, Wallet, User, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useDuelOpponents, useCreateDuelsBatch, useDriverCompetitiveProfile, resolveParticipantName, resolveParticipantAvatar } from "./hook_duelos";
import type { DuelParticipant } from "./hook_duelos";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { formatPoints } from "@/lib/formatPoints";
import { format } from "date-fns";
import PerfilCompetitivoSheet from "./PerfilCompetitivoSheet";

interface Props {
  onBack: () => void;
  onSuccess: () => void;
  duracaoMinimaHoras?: number;
}

export default function CreateDuelSheet({ onBack, onSuccess, duracaoMinimaHoras = 1 }: Props) {
  const { driver } = useDriverSession();
  const { data: opponents, isLoading } = useDuelOpponents();
  const createBatch = useCreateDuelsBatch();
  const [search, setSearch] = useState("");
  const [selectedOpponents, setSelectedOpponents] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [pointsBet, setPointsBet] = useState("");
  const [step, setStep] = useState<"select" | "schedule" | "bet" | "confirm">("select");
  const [viewingProfile, setViewingProfile] = useState<DuelParticipant | null>(null);

  const filtered = (opponents || []).filter((o) => {
    if (!search.trim()) return true;
    const name = resolveParticipantName(o);
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const selectedCount = selectedOpponents.size;
  const canSchedule = selectedCount > 0;

  // Schedule validation
  const startAt = startDate && startTime ? new Date(`${startDate}T${startTime}`) : null;
  const endAt = endDate && endTime ? new Date(`${endDate}T${endTime}`) : null;
  const now = new Date();
  const startInFuture = startAt ? startAt > now : false;
  const durationHours = startAt && endAt ? (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60) : 0;
  const durationValid = durationHours >= duracaoMinimaHoras;
  const canConfirmSchedule = startAt && endAt && startInFuture && startAt < endAt && durationValid;

  // Bet validation
  const balance = driver?.points_balance ?? 0;
  const betValue = parseInt(pointsBet) || 0;
  const totalRequired = betValue * selectedCount;
  const betValid = betValue >= 0 && totalRequired <= balance;

  const handleToggleOpponent = (customerId: string) => {
    setSelectedOpponents((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) next.delete(customerId);
      else next.add(customerId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedCount === filtered.length) {
      setSelectedOpponents(new Set());
    } else {
      setSelectedOpponents(new Set(filtered.map((o) => o.customer_id)));
    }
  };

  const handleSubmit = () => {
    if (!startAt || !endAt || selectedCount === 0) return;
    createBatch.mutate(
      {
        challengedCustomerIds: Array.from(selectedOpponents),
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        pointsBet: betValue,
      },
      { onSuccess: () => onSuccess() }
    );
  };

  const handleBack = () => {
    if (step === "schedule") setStep("select");
    else if (step === "bet") setStep("schedule");
    else if (step === "confirm") setStep("bet");
    else onBack();
  };

  const today = format(new Date(), "yyyy-MM-dd");

  const selectedOpponentsList = useMemo(
    () => (opponents || []).filter((o) => selectedOpponents.has(o.customer_id)),
    [opponents, selectedOpponents]
  );

  if (viewingProfile) {
    return (
      <PerfilCompetitivoSheet
        participant={viewingProfile}
        onBack={() => setViewingProfile(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto" style={{ backgroundColor: "hsl(var(--background))" }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "hsl(var(--background))" }}>
        <button onClick={handleBack} className="h-9 w-9 flex items-center justify-center rounded-xl" style={{ backgroundColor: "hsl(var(--muted))" }}>
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground flex items-center gap-2">
          <Swords className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          {step === "select" && "Escolha os Adversários"}
          {step === "schedule" && "Período do Duelo"}
          {step === "bet" && "Pontos em Disputa"}
          {step === "confirm" && "Confirmar Desafios"}
        </h1>
      </header>

      <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full">
        {/* Step 1: Select opponents (multi) */}
        {step === "select" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar motorista..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-muted border-0"
              />
            </div>

            {filtered.length > 1 && (
              <button
                onClick={handleSelectAll}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: "hsl(var(--primary))" }}
              >
                {selectedCount === filtered.length ? "Desmarcar todos" : `Selecionar todos (${filtered.length})`}
              </button>
            )}

            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum motorista disponível para duelo na sua cidade</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((op) => (
                  <OpponentCard
                    key={op.id}
                    participant={op}
                    isSelected={selectedOpponents.has(op.customer_id)}
                    onToggle={() => handleToggleOpponent(op.customer_id)}
                    onViewProfile={() => setViewingProfile(op)}
                  />
                ))}
              </div>
            )}

            {/* Floating selection bar */}
            {canSchedule && (
              <div className="sticky bottom-4 mt-4">
                <Button onClick={() => setStep("schedule")} className="w-full gap-2 shadow-lg">
                  <Calendar className="h-4 w-4" />
                  Definir Período ({selectedCount} adversário{selectedCount > 1 ? "s" : ""})
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === "schedule" && (
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Início do Duelo
              </label>
              <div className="flex gap-2">
                <Input type="date" min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 rounded-xl bg-muted border-0" />
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-28 rounded-xl bg-muted border-0" />
              </div>
              {startAt && !startInFuture && (
                <p className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--destructive))" }}>
                  <AlertCircle className="h-3 w-3" /> Data de início deve ser no futuro
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Fim do Duelo
              </label>
              <div className="flex gap-2">
                <Input type="date" min={startDate || today} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 rounded-xl bg-muted border-0" />
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-28 rounded-xl bg-muted border-0" />
              </div>
            </div>

            {startAt && endAt && startAt < endAt && !durationValid && (
              <p className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--destructive))" }}>
                <AlertCircle className="h-3 w-3" /> Duração mínima: {duracaoMinimaHoras}h
              </p>
            )}

            {startAt && endAt && durationValid && startInFuture && (
              <p className="text-xs text-muted-foreground">
                Duração: {durationHours.toFixed(1)}h
              </p>
            )}

            {canConfirmSchedule && (
              <Button onClick={() => setStep("bet")} className="w-full gap-2">
                <Coins className="h-4 w-4" />
                Definir Aposta
              </Button>
            )}
          </div>
        )}

        {/* Step 3: Bet */}
        {step === "bet" && (
          <div className="space-y-5 pt-2">
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            >
              <Wallet className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
              <div>
                <p className="text-xs text-muted-foreground">Seu saldo disponível</p>
                <p className="text-lg font-bold text-foreground">{formatPoints(balance)} pts</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Coins className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
                Quantos pontos você aposta por duelo?
              </label>
              <Input
                type="number"
                min={0}
                max={Math.floor(balance / selectedCount)}
                placeholder="Ex: 100"
                value={pointsBet}
                onChange={(e) => setPointsBet(e.target.value)}
                className="rounded-xl bg-muted border-0 text-lg font-bold"
              />

              {/* Dynamic calculation */}
              <div
                className="rounded-xl p-3 space-y-1.5 mt-2"
                style={{ backgroundColor: "hsl(var(--muted))" }}
              >
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Aposta por duelo</span>
                  <span className="font-medium text-foreground">{formatPoints(betValue)} pts</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Qtd de duelos</span>
                  <span className="font-medium text-foreground">{selectedCount}</span>
                </div>
                <div className="border-t pt-1.5 flex justify-between text-sm" style={{ borderColor: "hsl(var(--border))" }}>
                  <span className="font-semibold text-foreground">Total reservado</span>
                  <span
                    className="font-bold"
                    style={{ color: totalRequired > balance ? "hsl(var(--destructive))" : "hsl(var(--primary))" }}
                  >
                    {formatPoints(totalRequired)} pts
                  </span>
                </div>
              </div>

              {totalRequired > balance && (
                <p className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--destructive))" }}>
                  <AlertCircle className="h-3 w-3" /> Saldo insuficiente para {selectedCount} duelos
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {betValue > 0
                  ? `Cada adversário precisará colocar ${formatPoints(betValue)} pts. Total por duelo: ${formatPoints(betValue * 2)} pts`
                  : "Deixe 0 para duelos simbólicos (sem pontos em jogo)"}
              </p>
            </div>

            <Button onClick={() => setStep("confirm")} disabled={!betValid} className="w-full gap-2">
              Revisar Desafios
            </Button>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === "confirm" && (
          <div className="space-y-5 pt-2">
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            >
              <h3 className="text-sm font-bold text-foreground text-center">
                Resumo — {selectedCount} Desafio{selectedCount > 1 ? "s" : ""}
              </h3>

              {/* Opponents list */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedOpponentsList.map((op) => {
                  const name = resolveParticipantName(op);
                  const avatar = resolveParticipantAvatar(op);
                  return (
                    <div key={op.customer_id} className="flex items-center gap-2 py-1">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden"
                        style={{ backgroundColor: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
                      >
                        {avatar ? (
                          <img src={avatar} alt={name} className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-sm text-foreground truncate">{name}</span>
                      <Swords className="h-3 w-3 ml-auto shrink-0" style={{ color: "hsl(var(--primary))" }} />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Início</span>
                  <span className="font-medium text-foreground">{startAt ? format(startAt, "dd/MM/yyyy HH:mm") : "—"}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Fim</span>
                  <span className="font-medium text-foreground">{endAt ? format(endAt, "dd/MM/yyyy HH:mm") : "—"}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Duração</span>
                  <span className="font-medium text-foreground">{durationHours.toFixed(1)}h</span>
                </div>
              </div>

              {betValue > 0 && (
                <div
                  className="rounded-xl p-3 space-y-1"
                  style={{ backgroundColor: "hsl(var(--warning) / 0.1)", border: "1px solid hsl(var(--warning) / 0.3)" }}
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Aposta por duelo</span>
                    <span className="font-bold text-foreground">{formatPoints(betValue)} pts</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantidade</span>
                    <span className="font-bold text-foreground">{selectedCount} duelos</span>
                  </div>
                  <div className="border-t pt-1 mt-1 flex justify-between text-sm" style={{ borderColor: "hsl(var(--warning) / 0.3)" }}>
                    <span className="font-bold" style={{ color: "hsl(var(--warning))" }}>Total reservado</span>
                    <span className="font-extrabold" style={{ color: "hsl(var(--warning))" }}>{formatPoints(totalRequired)} pts</span>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground text-center">
                {betValue > 0
                  ? "Os pontos serão reservados quando cada adversário aceitar. O vencedor leva tudo! 🏆"
                  : "Quem completar mais corridas no período vence! 🏆"}
              </p>
            </div>

            <Button onClick={handleSubmit} disabled={createBatch.isPending} className="w-full gap-2">
              <Send className="h-4 w-4" />
              {createBatch.isPending
                ? "Enviando..."
                : `Enviar ${selectedCount} Desafio${selectedCount > 1 ? "s" : ""} 🥊`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Card de adversário com checkbox multi-select */
function OpponentCard({
  participant,
  isSelected,
  onToggle,
  onViewProfile,
}: {
  participant: DuelParticipant;
  isSelected: boolean;
  onToggle: () => void;
  onViewProfile: () => void;
}) {
  const displayName = resolveParticipantName(participant);
  const avatar = resolveParticipantAvatar(participant);
  const subtitle = participant.public_nickname ? (participant.display_name || null) : null;
  const { data: profile } = useDriverCompetitiveProfile(participant.customer_id);

  return (
    <div
      className="w-full flex items-center gap-3 rounded-xl p-3 transition-all"
      style={{
        backgroundColor: isSelected ? "hsl(var(--primary) / 0.1)" : "hsl(var(--card))",
        border: isSelected ? "1px solid hsl(var(--primary) / 0.4)" : "1px solid hsl(var(--border))",
      }}
    >
      <button onClick={onToggle} className="flex items-center gap-3 flex-1 text-left">
        <div className="shrink-0">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle()}
            className="pointer-events-none"
          />
        </div>
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden"
          style={{ backgroundColor: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
        >
          {avatar ? (
            <img src={avatar} alt={displayName} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
          {profile && profile.total_duels > 0 && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                {profile.wins}V {profile.losses}D
              </span>
              <span className="text-[10px] text-muted-foreground">
                {profile.win_rate}% win
              </span>
              {profile.current_streak > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: "hsl(var(--warning) / 0.1)", color: "hsl(var(--warning))" }}>
                  🔥 {profile.current_streak}
                </span>
              )}
            </div>
          )}
        </div>
        {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--primary))" }} />}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: "hsl(var(--muted))" }}
        title="Ver perfil competitivo"
      >
        <User className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
