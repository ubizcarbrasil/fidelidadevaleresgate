/**
 * Arena ao vivo — visual imersivo de competição com clima de arena esportiva.
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
  Crown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cleanDriverName, type Duel } from "./hook_duelos";
import { formatPoints } from "@/lib/formatPoints";
import { differenceInSeconds } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import PalpitesDuelo from "./PalpitesDuelo";

interface Props {
  duel: Duel;
  onBack: () => void;
}

/* ─────── helpers ─────── */

function formatCountdown(seconds: number) {
  if (seconds <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(seconds / 86400),
    h: Math.floor((seconds % 86400) / 3600),
    m: Math.floor((seconds % 3600) / 60),
    s: seconds % 60,
  };
}

function AvatarArena({ nome, avatar, destaque, lado }: { nome: string; avatar?: string | null; destaque: boolean; lado: "A" | "B" }) {
  const iniciais = nome.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
  const gradA = "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))";
  const gradB = "linear-gradient(135deg, hsl(var(--destructive) / 0.8), hsl(var(--destructive) / 0.5))";

  return (
    <div className="relative">
      <motion.div
        animate={destaque ? { boxShadow: ["0 0 0px hsl(var(--primary) / 0)", "0 0 25px hsl(var(--primary) / 0.4)", "0 0 0px hsl(var(--primary) / 0)"] } : {}}
        transition={destaque ? { duration: 2, repeat: Infinity } : {}}
        className="h-[72px] w-[72px] rounded-full flex items-center justify-center text-xl font-black shrink-0"
        style={{
          background: avatar ? "transparent" : (lado === "A" ? gradA : gradB),
          border: destaque ? "3px solid hsl(var(--primary))" : "3px solid hsl(var(--muted) / 0.5)",
          color: "white",
        }}
      >
        {avatar ? (
          <img src={avatar} alt={nome} className="h-full w-full rounded-full object-cover" />
        ) : (
          <span>{iniciais}</span>
        )}
      </motion.div>
      {destaque && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-xs"
          style={{ background: "linear-gradient(135deg, hsl(var(--warning)), hsl(var(--warning) / 0.7))", boxShadow: "0 2px 8px hsl(var(--warning) / 0.4)" }}
        >
          👑
        </motion.div>
      )}
    </div>
  );
}

function CountdownDigit({ value, label, urgent }: { value: number; label: string; urgent: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-lg px-2.5 py-1.5"
        style={{
          backgroundColor: urgent ? "hsl(var(--destructive) / 0.15)" : "hsl(var(--muted) / 0.5)",
          border: urgent ? "1px solid hsl(var(--destructive) / 0.3)" : "1px solid transparent",
        }}
      >
        <span
          className="text-2xl font-black tabular-nums leading-none"
          style={{ color: urgent ? "hsl(var(--destructive))" : "hsl(var(--foreground))" }}
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[8px] text-muted-foreground uppercase mt-1 font-bold tracking-wider">{label}</span>
    </div>
  );
}

/* ─────── main ─────── */

export default function ArenaAoVivo({ duel, onBack }: Props) {
  const [remaining, setRemaining] = useState(0);
  const [, setTick] = useState(0);

  const nomeA = cleanDriverName(duel.challenger?.public_nickname || (duel.challenger as any)?.customers?.name);
  const nomeB = cleanDriverName(duel.challenged?.public_nickname || (duel.challenged as any)?.customers?.name);
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
  const isRetaFinal = remaining > 0 && remaining <= 3600;

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
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Header with gradient accent */}
      <header className="sticky top-0 z-10 relative">
        <div
          className="absolute inset-0"
          style={{
            background: aoVivo
              ? "linear-gradient(180deg, hsl(var(--primary) / 0.08) 0%, transparent 100%)"
              : "hsl(var(--background))",
          }}
        />
        {/* Live indicator line */}
        {aoVivo && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-0 left-0 right-0 h-[1px]"
            style={{ background: "linear-gradient(90deg, transparent, hsl(var(--success)), transparent)" }}
          />
        )}
        <div className="relative flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-xl" style={{ backgroundColor: "hsl(var(--muted))" }}>
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-base font-extrabold text-foreground flex items-center gap-2 tracking-tight">
            <Swords className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
            Arena ao Vivo
          </h1>
          <div className="flex-1" />
          {aoVivo && (
            <Badge className="text-[10px] gap-1 animate-pulse border-0" style={{ backgroundColor: "hsl(var(--success))", color: "white", boxShadow: "0 0 12px hsl(var(--success) / 0.4)" }}>
              <Flame className="w-3 h-3" /> AO VIVO
            </Badge>
          )}
        </div>
      </header>

      <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full space-y-4">

        {/* Reta final warning */}
        <AnimatePresence>
          {isRetaFinal && aoVivo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="rounded-xl p-3 text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(var(--destructive) / 0.15), hsl(var(--warning) / 0.1))",
                border: "1px solid hsl(var(--destructive) / 0.3)",
              }}
            >
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-y-0 w-20 opacity-10"
                style={{ background: "linear-gradient(90deg, transparent, white, transparent)" }}
              />
              <div className="flex items-center justify-center gap-2 relative z-10">
                <Zap className="h-4 w-4" style={{ color: "hsl(var(--destructive))" }} />
                <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "hsl(var(--destructive))" }}>
                  ⚡ Reta Final! Última hora!
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scoreboard Arena */}
        <div
          className="rounded-2xl relative overflow-hidden"
          style={{
            background: aoVivo
              ? "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--success) / 0.04) 100%)"
              : "hsl(var(--card))",
            border: aoVivo ? "1px solid hsl(var(--success) / 0.3)" : "1px solid hsl(var(--border))",
            boxShadow: aoVivo ? "0 8px 40px -12px hsl(var(--success) / 0.2)" : "none",
          }}
        >
          {/* Background VS watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
            <span className="text-[120px] font-black text-foreground rotate-[-12deg]">VS</span>
          </div>

          <div className="p-5 relative z-10">
            {/* Avatars + scores */}
            <div className="flex items-start justify-between">
              {/* Driver A */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <AvatarArena nome={nomeA} avatar={avatarA} destaque={aFrente === "A"} lado="A" />
                <p className="text-xs font-bold text-foreground text-center truncate w-full max-w-[100px]">{nomeA}</p>
                <motion.div
                  key={`a-${ridesA}`}
                  initial={{ scale: 1.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="text-center"
                >
                  <span
                    className="text-5xl font-black tabular-nums leading-none block"
                    style={{ color: aFrente === "A" ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}
                  >
                    <AnimatedCounter value={ridesA} />
                  </span>
                </motion.div>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">corridas</span>
              </div>

              {/* VS center */}
              <div className="flex flex-col items-center gap-1.5 pt-6 px-2">
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--muted)), hsl(var(--muted) / 0.5))" }}>
                  <Swords className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground tracking-[0.2em]">VS</span>
                {diff > 0 && (
                  <motion.div
                    key={diff}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "hsl(var(--warning) / 0.15)" }}
                  >
                    <span className="text-[10px] font-extrabold flex items-center gap-0.5" style={{ color: "hsl(var(--warning))" }}>
                      <TrendingUp className="h-3 w-3" />+{diff}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Driver B */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <AvatarArena nome={nomeB} avatar={avatarB} destaque={aFrente === "B"} lado="B" />
                <p className="text-xs font-bold text-foreground text-center truncate w-full max-w-[100px]">{nomeB}</p>
                <motion.div
                  key={`b-${ridesB}`}
                  initial={{ scale: 1.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="text-center"
                >
                  <span
                    className="text-5xl font-black tabular-nums leading-none block"
                    style={{ color: aFrente === "B" ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}
                  >
                    <AnimatedCounter value={ridesB} />
                  </span>
                </motion.div>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">corridas</span>
              </div>
            </div>

            {/* Comparative bar */}
            <div className="mt-5 space-y-1.5">
              <div className="flex h-3.5 rounded-full overflow-hidden relative" style={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}>
                <motion.div
                  className="rounded-l-full relative"
                  initial={false}
                  animate={{ width: `${barA}%` }}
                  transition={{ type: "spring", stiffness: 80, damping: 20 }}
                  style={{ background: aFrente === "A" ? "linear-gradient(90deg, hsl(var(--primary) / 0.6), hsl(var(--primary)))" : "hsl(var(--muted-foreground) / 0.3)" }}
                />
                <motion.div
                  className="rounded-r-full"
                  initial={false}
                  animate={{ width: `${barB}%` }}
                  transition={{ type: "spring", stiffness: 80, damping: 20 }}
                  style={{ background: aFrente === "B" ? "linear-gradient(90deg, hsl(var(--destructive) / 0.7), hsl(var(--destructive) / 0.9))" : "hsl(var(--muted-foreground) / 0.3)" }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span style={{ color: aFrente === "A" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>{barA}%</span>
                <span style={{ color: aFrente === "B" ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))" }}>{barB}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Countdown */}
        {remaining > 0 && (
          <div
            className="rounded-xl p-4 text-center relative overflow-hidden"
            style={{
              backgroundColor: "hsl(var(--card))",
              border: isRetaFinal ? "1px solid hsl(var(--destructive) / 0.3)" : "1px solid hsl(var(--border))",
            }}
          >
            {isRetaFinal && (
              <motion.div
                animate={{ opacity: [0.05, 0.15, 0.05] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-xl"
                style={{ backgroundColor: "hsl(var(--destructive))" }}
              />
            )}
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <Clock className="h-4 w-4" style={{ color: isRetaFinal ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))" }} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {isRetaFinal ? "⏱ Tempo acabando!" : "Tempo restante"}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                {cd.d > 0 && (
                  <>
                    <CountdownDigit value={cd.d} label="dias" urgent={isRetaFinal} />
                    <span className="text-lg font-bold text-muted-foreground pb-4">:</span>
                  </>
                )}
                <CountdownDigit value={cd.h} label="hrs" urgent={isRetaFinal} />
                <span className="text-lg font-bold text-muted-foreground pb-4">:</span>
                <CountdownDigit value={cd.m} label="min" urgent={isRetaFinal} />
                <span className="text-lg font-bold text-muted-foreground pb-4">:</span>
                <CountdownDigit value={cd.s} label="seg" urgent={isRetaFinal} />
              </div>
            </div>
          </div>
        )}

        {remaining <= 0 && (
          <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}>
            <span className="text-sm font-bold text-muted-foreground">⏱️ Tempo esgotado</span>
          </div>
        )}

        {/* Points at stake */}
        {hasBet && duel.points_reserved && (
          <div
            className="rounded-xl p-4 text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(var(--warning) / 0.12), hsl(var(--warning) / 0.04))",
              border: "1px solid hsl(var(--warning) / 0.3)",
            }}
          >
            <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full blur-2xl opacity-20" style={{ backgroundColor: "hsl(var(--warning))" }} />
            <div className="relative z-10">
              <Coins className="h-6 w-6 mx-auto mb-1" style={{ color: "hsl(var(--warning))" }} />
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Pontos em disputa</p>
              <p className="text-3xl font-black mt-1" style={{ color: "hsl(var(--warning))" }}>
                {formatPoints(totalBet)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">pontos da plataforma</p>
            </div>
          </div>
        )}

        {/* Palpites sociais */}
        {(aoVivo || duel.status === "accepted") && <PalpitesDuelo duel={duel} />}

        {/* Leader status */}
        {aFrente && aoVivo && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl p-3.5 flex items-center gap-3"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.03))",
              border: "1px solid hsl(var(--primary) / 0.2)",
            }}
          >
            <Crown className="h-5 w-5" style={{ color: "hsl(var(--warning))" }} />
            <span className="text-sm font-extrabold" style={{ color: "hsl(var(--primary))" }}>
              {aFrente === "A" ? nomeA : nomeB} está dominando! 🔥
            </span>
          </motion.div>
        )}

        {!aFrente && ridesA > 0 && aoVivo && (
          <div
            className="rounded-xl p-3 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, hsl(var(--muted) / 0.5), hsl(var(--muted) / 0.3))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <span className="text-sm">⚔️</span>
            <span className="text-sm font-bold text-muted-foreground">
              Empate técnico! A disputa tá acirrada 🔥
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
