/**
 * Sheet para criar uma aposta lateral em um duelo.
 */
import React, { useState } from "react";
import { ArrowLeft, AlertTriangle, Coins, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { cleanDriverName, type Duel } from "./hook_duelos";
import { useCreateSideBet } from "./hook_apostas_duelo";
import { formatPoints } from "@/lib/formatPoints";

interface Props {
  duel: Duel;
  onBack: () => void;
}

export default function CriarApostaSheet({ duel, onBack }: Props) {
  const { driver, refreshDriver } = useDriverSession();
  const createBet = useCreateSideBet();
  const [selectedSide, setSelectedSide] = useState<"challenger" | "challenged" | null>(null);
  const [points, setPoints] = useState("");
  const [confirmStep, setConfirmStep] = useState(false);

  const nomeA = cleanDriverName(duel.challenger?.public_nickname || (duel.challenger as any)?.customers?.name);
  const nomeB = cleanDriverName(duel.challenged?.public_nickname || (duel.challenged as any)?.customers?.name);
  const balance = driver?.points_balance || 0;
  const pointsNum = parseInt(points) || 0;
  const isValid = selectedSide && pointsNum > 0 && pointsNum <= balance;

  const participantId = selectedSide === "challenger" ? duel.challenger_id : duel.challenged_id;

  const handleCreate = async () => {
    if (!driver || !selectedSide) return;
    await createBet.mutateAsync({
      duelId: duel.id,
      customerId: driver.id,
      predictedWinnerParticipantId: participantId,
      points: pointsNum,
    });
    refreshDriver();
    onBack();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto" style={{ backgroundColor: "hsl(var(--background))" }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "hsl(var(--background))", borderBottom: "1px solid hsl(var(--border))" }}>
        <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-xl" style={{ backgroundColor: "hsl(var(--muted))" }}>
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-extrabold text-foreground flex items-center gap-2">
          <Target className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          Criar Aposta
        </h1>
      </header>

      <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full space-y-5 pt-4">
        {/* Saldo */}
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))" }}>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Seu saldo</p>
          <p className="text-2xl font-black" style={{ color: "hsl(var(--primary))" }}>{formatPoints(balance)}</p>
          <p className="text-[10px] text-muted-foreground">pontos disponíveis</p>
        </div>

        {/* Escolher lado */}
        <div>
          <p className="text-sm font-bold text-foreground mb-3">Em quem você aposta?</p>
          <div className="grid grid-cols-2 gap-3">
            {(["challenger", "challenged"] as const).map((side) => {
              const nome = side === "challenger" ? nomeA : nomeB;
              const isSelected = selectedSide === side;
              return (
                <button
                  key={side}
                  onClick={() => { setSelectedSide(side); setConfirmStep(false); }}
                  className="rounded-xl p-4 text-center transition-all"
                  style={{
                    backgroundColor: isSelected ? "hsl(var(--primary) / 0.12)" : "hsl(var(--card))",
                    border: isSelected ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                    boxShadow: isSelected ? "0 4px 20px hsl(var(--primary) / 0.15)" : "none",
                  }}
                >
                  <div className="h-12 w-12 rounded-full mx-auto flex items-center justify-center text-lg font-black mb-2" style={{
                    background: side === "challenger"
                      ? "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))"
                      : "linear-gradient(135deg, hsl(var(--destructive) / 0.8), hsl(var(--destructive) / 0.5))",
                    color: "white",
                  }}>
                    {nome.split(" ").slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("")}
                  </div>
                  <p className="text-xs font-bold text-foreground truncate">{nome}</p>
                  {isSelected && <p className="text-[10px] mt-1 font-bold" style={{ color: "hsl(var(--primary))" }}>✓ Selecionado</p>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Valor */}
        {selectedSide && (
          <div>
            <p className="text-sm font-bold text-foreground mb-2">Quantos pontos apostar?</p>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
              <Input
                type="number"
                placeholder="Ex: 100"
                value={points}
                onChange={(e) => { setPoints(e.target.value); setConfirmStep(false); }}
                className="pl-10 text-lg font-bold"
                min={1}
                max={balance}
              />
            </div>
            {pointsNum > balance && (
              <p className="text-xs mt-1 font-medium" style={{ color: "hsl(var(--destructive))" }}>Saldo insuficiente</p>
            )}
            {/* Quick picks */}
            <div className="flex gap-2 mt-2">
              {[50, 100, 200, 500].filter(v => v <= balance).map(v => (
                <button
                  key={v}
                  onClick={() => { setPoints(String(v)); setConfirmStep(false); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Confirmação */}
        {isValid && !confirmStep && (
          <Button
            onClick={() => setConfirmStep(true)}
            className="w-full h-12 text-base font-extrabold"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))" }}
          >
            Continuar
          </Button>
        )}

        {isValid && confirmStep && (
          <div className="space-y-3">
            {/* Warning */}
            <div className="rounded-xl p-4" style={{ background: "linear-gradient(135deg, hsl(var(--warning) / 0.12), hsl(var(--warning) / 0.04))", border: "1px solid hsl(var(--warning) / 0.3)" }}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "hsl(var(--warning))" }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: "hsl(var(--warning))" }}>Atenção — Risco de perda</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ao confirmar, sua aposta ficará aberta para outro motorista aceitar.
                    Quando aceita, <strong>{formatPoints(pointsNum)} pontos</strong> serão reservados imediatamente
                    de ambos os lados. Se perder, você perde todos os pontos apostados.
                    10% do prêmio vai como bônus para o vencedor do duelo.
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Apostando em</span>
                <span className="font-bold text-foreground">{selectedSide === "challenger" ? nomeA : nomeB}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-bold" style={{ color: "hsl(var(--warning))" }}>{formatPoints(pointsNum)} pts</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Prêmio potencial (90%)</span>
                <span className="font-bold" style={{ color: "hsl(var(--success))" }}>{formatPoints(Math.floor(pointsNum * 2 * 0.9))} pts</span>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={createBet.isPending}
              className="w-full h-12 text-base font-extrabold"
              style={{ background: "linear-gradient(135deg, hsl(var(--success)), hsl(var(--success) / 0.8))" }}
            >
              {createBet.isPending ? "Criando..." : "🎯 Confirmar Aposta"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
