/**
 * Tela de criação de desafio — seleção de adversário, período e aposta de pontos.
 */
import React, { useState } from "react";
import { ArrowLeft, Swords, Search, Calendar, Clock, Send, Coins, Wallet, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDuelOpponents, useCreateDuel, cleanDriverName, useDriverCompetitiveProfile } from "./hook_duelos";
import type { DuelParticipant } from "./hook_duelos";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { formatPoints } from "@/lib/formatPoints";
import { format } from "date-fns";
import PerfilCompetitivoSheet from "./PerfilCompetitivoSheet";

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

export default function CreateDuelSheet({ onBack, onSuccess }: Props) {
  const { driver } = useDriverSession();
  const { data: opponents, isLoading } = useDuelOpponents();
  const createDuel = useCreateDuel();
  const [search, setSearch] = useState("");
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [pointsBet, setPointsBet] = useState("");
  const [step, setStep] = useState<"select" | "schedule" | "bet" | "confirm">("select");

  const filtered = (opponents || []).filter((o) => {
    if (!search.trim()) return true;
    const name = cleanDriverName((o.customers as any)?.name);
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const selectedOpponentData = opponents?.find((o) => o.customer_id === selectedOpponent);
  const opponentName = cleanDriverName((selectedOpponentData?.customers as any)?.name);

  const canSchedule = selectedOpponent !== null;
  const startAt = startDate && startTime ? new Date(`${startDate}T${startTime}`) : null;
  const endAt = endDate && endTime ? new Date(`${endDate}T${endTime}`) : null;
  const canConfirmSchedule = startAt && endAt && startAt < endAt;

  const balance = driver?.points_balance ?? 0;
  const betValue = parseInt(pointsBet) || 0;
  const betValid = betValue >= 0 && betValue <= balance;

  const handleSubmit = () => {
    if (!selectedOpponent || !startAt || !endAt) return;
    createDuel.mutate(
      {
        challengedCustomerId: selectedOpponent,
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto" style={{ backgroundColor: "hsl(var(--background))" }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "hsl(var(--background))" }}>
        <button onClick={handleBack} className="h-9 w-9 flex items-center justify-center rounded-xl" style={{ backgroundColor: "hsl(var(--muted))" }}>
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground flex items-center gap-2">
          <Swords className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          {step === "select" && "Escolha o Adversário"}
          {step === "schedule" && "Período do Duelo"}
          {step === "bet" && "Pontos em Disputa"}
          {step === "confirm" && "Confirmar Desafio"}
        </h1>
      </header>

      <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full">
        {/* Step 1: Select opponent */}
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

            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum motorista disponível para duelo na sua cidade</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((op) => {
                  const name = cleanDriverName((op.customers as any)?.name);
                  const isSelected = selectedOpponent === op.customer_id;
                  return (
                    <button
                      key={op.id}
                      onClick={() => setSelectedOpponent(op.customer_id)}
                      className="w-full flex items-center gap-3 rounded-xl p-3 transition-all"
                      style={{
                        backgroundColor: isSelected ? "hsl(var(--primary) / 0.1)" : "hsl(var(--card))",
                        border: isSelected ? "1px solid hsl(var(--primary) / 0.4)" : "1px solid hsl(var(--border))",
                      }}
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-foreground">{name}</p>
                        <p className="text-[11px] text-muted-foreground">{op.public_nickname || "Motorista"}</p>
                      </div>
                      {isSelected && <Swords className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />}
                    </button>
                  );
                })}
              </div>
            )}

            {canSchedule && (
              <Button onClick={() => setStep("schedule")} className="w-full gap-2 mt-4">
                <Calendar className="h-4 w-4" />
                Definir Período
              </Button>
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
                Quantos pontos você aposta?
              </label>
              <Input
                type="number"
                min={0}
                max={balance}
                placeholder="Ex: 100"
                value={pointsBet}
                onChange={(e) => setPointsBet(e.target.value)}
                className="rounded-xl bg-muted border-0 text-lg font-bold"
              />
              {betValue > balance && (
                <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>
                  Saldo insuficiente
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {betValue > 0
                  ? `O adversário precisará colocar ${formatPoints(betValue)} pts também. Total em disputa: ${formatPoints(betValue * 2)} pts`
                  : "Deixe 0 para um duelo simbólico (sem pontos em jogo)"}
              </p>
            </div>

            <Button onClick={() => setStep("confirm")} disabled={!betValid} className="w-full gap-2">
              Revisar Desafio
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
              <h3 className="text-sm font-bold text-foreground text-center">Resumo do Desafio</h3>

              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Você</p>
                  <Swords className="h-6 w-6 mx-auto my-1" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <span className="text-lg font-extrabold text-muted-foreground">VS</span>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{opponentName}</p>
                  <Swords className="h-6 w-6 mx-auto my-1" style={{ color: "hsl(var(--destructive))" }} />
                </div>
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
              </div>

              {betValue > 0 && (
                <div
                  className="rounded-xl p-3 space-y-1"
                  style={{ backgroundColor: "hsl(var(--warning) / 0.1)", border: "1px solid hsl(var(--warning) / 0.3)" }}
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Seus pontos</span>
                    <span className="font-bold text-foreground">{formatPoints(betValue)} pts</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pontos do adversário</span>
                    <span className="font-bold text-foreground">{formatPoints(betValue)} pts</span>
                  </div>
                  <div className="border-t pt-1 mt-1 flex justify-between text-sm" style={{ borderColor: "hsl(var(--warning) / 0.3)" }}>
                    <span className="font-bold" style={{ color: "hsl(var(--warning))" }}>Total em disputa</span>
                    <span className="font-extrabold" style={{ color: "hsl(var(--warning))" }}>{formatPoints(betValue * 2)} pts</span>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground text-center">
                {betValue > 0
                  ? "Os pontos serão reservados quando o adversário aceitar. O vencedor leva tudo! 🏆"
                  : "Quem completar mais corridas no período vence! 🏆"}
              </p>
            </div>

            <Button onClick={handleSubmit} disabled={createDuel.isPending} className="w-full gap-2">
              <Send className="h-4 w-4" />
              {createDuel.isPending ? "Enviando..." : "Enviar Desafio 🥊"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
