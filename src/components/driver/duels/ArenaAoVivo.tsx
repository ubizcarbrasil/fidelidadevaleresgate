/**
 * Arena ao vivo — emulador visual de competição para duelos em andamento.
 * Exibe placar grande, barra comparativa, cronômetro e destaques visuais.
 */
import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  Flame,
  Clock,
  Swords,
  Coins,
  Zap,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cleanDriverName, type Duel } from "./hook_duelos";
import { formatPoints } from "@/lib/formatPoints";
import { differenceInSeconds } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  duel: Duel;
  onBack: () => void;
}

/* ─────── helpers ─────── */

function formatCountdown(seconds: number): { d: number; h: number; m: number; s: number } {
  if (seconds <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(seconds / 86400),
    h: Math.floor((seconds % 86400) / 3600),
    m: Math.floor((seconds % 3600) / 60),
    s: seconds % 60,
  };
}

function AvatarArena({ nome, avatar, destaque }: { nome: string; avatar?: string | null; destaque: boolean }) {
  const iniciais = nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

  return (
    <div
      className="relative h-16 w-16 rounded-full flex items-center justify-center text-xl font-black shrink-0 transition-all"
      style={{
        backgroundColor: destaque ? "hsl(var(--primary) / 0.2)" : "hsl(var(--muted))",
        border: destaque ? "2px solid hsl(var(--primary))" : "2px solid transparent",
        boxShadow: destaque ? "0 0 20px hsl(var(--primary) / 0.3)" : "none",
      }}
    >
      {avatar ? (
        <img src={avatar} alt={nome} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span style={{ color: destaque ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
          {iniciais}
        </span>
      )}
      {destaque && (
        <div
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px]"
          style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          👑
        </div>
      )}
    </div>
  );
}

function CountdownDigit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-2xl font-black tabular-nums leading-none"
        style={{ color: "hsl(var(--foreground))" }}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[9px] text-muted-foreground uppercase mt-0.5">{label}</span>
    </div>
  );
}

/* ─────── main ─────── */

export default function ArenaAoVivo({ duel, onBack }: Props) {
  const [remaining, setRemaining] = useState(0);
  const [, setTick] = useState(0);

  const nomeA = cleanDriverName(
    duel.challenger?.public_nickname || (duel.challenger as any)?.customers?.name
  );
  const nomeB = cleanDriverName(
    duel.challenged?.public_nickname || (duel.challenged as any)?.customers?.name
  );
  const avatarA = (duel.challenger as any)?.avatar_url;
  const avatarB = (duel.challenged as any)?.avatar_url;

  const ridesA = duel.challenger_rides_count;
  const ridesB = duel.challenged_rides_count;
  const total = ridesA + ridesB || 1;
  const barA = Math.round((ridesA / total) * 100);
  const barB = 100 - barA;
  const diff = Math.abs(ridesA - ridesB);
  const aFrente = ridesA > ridesB ? "A" : ridesB > ridesA ? "B" : null;

  const hasBet = (duel.challenger_points_bet || 0) > 0;
  const totalBet = (duel.challenger_points_bet || 0) + (duel.challenged_points_bet || 0);

  const aoVivo = duel.status === "live";
  const isRetaFinal = remaining > 0 && remaining <= 3600; // last hour

  // Countdown tick
  useEffect(() => {
    const tick = () => {
      const end = new Date(duel.end_at);
      setRemaining(Math.max(0, differenceInSeconds(end, new Date())));
      setTick((t) => t + 1);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [duel.end_at]);

  const cd = useMemo(() => formatCountdown(remaining), [remaining]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-auto"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: "hsl(var(--background))" }}
      >
        <button
          onClick={onBack}
          className="h-9 w-9 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: "hsl(var(--muted))" }}
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground flex items-center gap-2">
          <Swords className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          Arena ao Vivo
        </h1>
        <div className="flex-1" />
        {aoVivo && (
          <Badge
            className="text-[10px] gap-1 animate-pulse"
            style={{ backgroundColor: "hsl(var(--success))", color: "white" }}
          >
            <Flame className="w-3 h-3" /> AO VIVO
          </Badge>
        )}
      </header>

      <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full space-y-5">

        {/* Reta final warning */}
        <AnimatePresence>
          {isRetaFinal && aoVivo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl p-3 text-center"
              style={{
                background: "linear-gradient(135deg, hsl(var(--destructive) / 0.15), hsl(var(--warning) / 0.1))",
                border: "1px solid hsl(var(--destructive) / 0.3)",
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <Zap className="h-4 w-4" style={{ color: "hsl(var(--destructive))" }} />
                <span className="text-xs font-bold" style={{ color: "hsl(var(--destructive))" }}>
                  RETA FINAL! 🔥
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scoreboard Arena */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(180deg, hsl(var(--card)), hsl(var(--card) / 0.8))",
            border: aoVivo
              ? "1px solid hsl(var(--success) / 0.4)"
              : "1px solid hsl(var(--border))",
            boxShadow: aoVivo ? "0 0 30px -10px hsl(var(--success) / 0.2)" : "none",
          }}
        >
          {/* Avatars + scores */}
          <div className="flex items-center justify-between">
            {/* Driver A */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <AvatarArena nome={nomeA} avatar={avatarA} destaque={aFrente === "A"} />
              <p className="text-xs font-medium text-foreground text-center truncate w-full max-w-[100px]">
                {nomeA}
              </p>
              <motion.p
                key={`a-${ridesA}`}
                initial={{ scale: 1.3, color: "hsl(var(--primary))" }}
                animate={{ scale: 1, color: aFrente === "A" ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}
                className="text-5xl font-black tabular-nums leading-none"
              >
                <AnimatedCounter value={ridesA} />
              </motion.p>
              <span className="text-[10px] text-muted-foreground">corridas</span>
            </div>

            {/* VS center */}
            <div className="flex flex-col items-center gap-1 px-2">
              <Swords className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs font-black text-muted-foreground">VS</span>
              {diff > 0 && (
                <Badge
                  variant="outline"
                  className="text-[9px] gap-0.5 border-0 px-1.5"
                  style={{
                    backgroundColor: "hsl(var(--warning) / 0.15)",
                    color: "hsl(var(--warning))",
                  }}
                >
                  <TrendingUp className="h-3 w-3" />
                  +{diff}
                </Badge>
              )}
            </div>

            {/* Driver B */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <AvatarArena nome={nomeB} avatar={avatarB} destaque={aFrente === "B"} />
              <p className="text-xs font-medium text-foreground text-center truncate w-full max-w-[100px]">
                {nomeB}
              </p>
              <motion.p
                key={`b-${ridesB}`}
                initial={{ scale: 1.3, color: "hsl(var(--primary))" }}
                animate={{ scale: 1, color: aFrente === "B" ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}
                className="text-5xl font-black tabular-nums leading-none"
              >
                <AnimatedCounter value={ridesB} />
              </motion.p>
              <span className="text-[10px] text-muted-foreground">corridas</span>
            </div>
          </div>

          {/* Comparative bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex h-3 rounded-full overflow-hidden" style={{ backgroundColor: "hsl(var(--muted))" }}>
              <motion.div
                className="rounded-l-full"
                initial={false}
                animate={{ width: `${barA}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                style={{
                  backgroundColor: aFrente === "A" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)",
                }}
              />
              <motion.div
                className="rounded-r-full"
                initial={false}
                animate={{ width: `${barB}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                style={{
                  backgroundColor: aFrente === "B" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)",
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{barA}%</span>
              <span>{barB}%</span>
            </div>
          </div>
        </div>

        {/* Countdown */}
        {remaining > 0 && (
          <div
            className="rounded-xl p-4 text-center"
            style={{
              backgroundColor: "hsl(var(--card))",
              border: isRetaFinal
                ? "1px solid hsl(var(--destructive) / 0.4)"
                : "1px solid hsl(var(--border))",
            }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Clock className="h-4 w-4" style={{ color: isRetaFinal ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))" }} />
              <span className="text-xs font-medium text-muted-foreground">Tempo restante</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              {cd.d > 0 && (
                <>
                  <CountdownDigit value={cd.d} label="dias" />
                  <span className="text-xl font-bold text-muted-foreground">:</span>
                </>
              )}
              <CountdownDigit value={cd.h} label="hrs" />
              <span className="text-xl font-bold text-muted-foreground">:</span>
              <CountdownDigit value={cd.m} label="min" />
              <span className="text-xl font-bold text-muted-foreground">:</span>
              <CountdownDigit value={cd.s} label="seg" />
            </div>
          </div>
        )}

        {remaining <= 0 && (
          <div
            className="rounded-xl p-3 text-center"
            style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
          >
            <span className="text-sm text-muted-foreground">⏱️ Tempo esgotado</span>
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
            <Coins className="h-5 w-5 mx-auto mb-1" style={{ color: "hsl(var(--warning))" }} />
            <p className="text-[11px] text-muted-foreground">Total em disputa</p>
            <p className="text-2xl font-extrabold" style={{ color: "hsl(var(--warning))" }}>
              {formatPoints(totalBet)} pts
            </p>
          </div>
        )}

        {/* Leader status */}
        {aFrente && aoVivo && (
          <div
            className="rounded-xl p-3 flex items-center justify-center gap-2"
            style={{
              backgroundColor: "hsl(var(--primary) / 0.08)",
              border: "1px solid hsl(var(--primary) / 0.2)",
            }}
          >
            <span className="text-sm">👑</span>
            <span className="text-sm font-bold" style={{ color: "hsl(var(--primary))" }}>
              {aFrente === "A" ? nomeA : nomeB} está na frente!
            </span>
          </div>
        )}

        {!aFrente && ridesA > 0 && aoVivo && (
          <div
            className="rounded-xl p-3 flex items-center justify-center gap-2"
            style={{
              backgroundColor: "hsl(var(--muted) / 0.5)",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <span className="text-sm">⚔️</span>
            <span className="text-sm font-medium text-muted-foreground">
              Empate técnico! A disputa segue acirrada
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
