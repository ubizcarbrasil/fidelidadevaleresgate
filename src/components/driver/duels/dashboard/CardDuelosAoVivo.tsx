/**
 * Card de duelos ao vivo — visual de arena com glow e tensão competitiva.
 */
import { Swords, Flame, ChevronRight, Crown, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cleanDriverName, type Duel } from "../hook_duelos";
import { formatPoints } from "@/lib/formatPoints";

interface Props {
  duelos: Duel[];
  onAbrirArena?: (duel: Duel) => void;
  fontHeading?: string;
}

export default function CardDuelosAoVivo({ duelos, onAbrirArena, fontHeading }: Props) {
  const aoVivo = duelos.filter((d) => d.status === "live");
  const aceitos = duelos.filter((d) => d.status === "accepted");
  const ativos = [...aoVivo, ...aceitos];

  if (ativos.length === 0) return null;

  const destaque = ativos[0];
  const nomeA = cleanDriverName(destaque.challenger?.public_nickname || (destaque.challenger as any)?.customers?.name);
  const nomeB = cleanDriverName(destaque.challenged?.public_nickname || (destaque.challenged as any)?.customers?.name);
  const ridesA = destaque.challenger_rides_count;
  const ridesB = destaque.challenged_rides_count;
  const lider = ridesA > ridesB ? nomeA : ridesB > ridesA ? nomeB : null;
  const totalBet = (destaque.challenger_points_bet || 0) + (destaque.challenged_points_bet || 0);
  const isLive = destaque.status === "live";

  const inicialA = nomeA.charAt(0).toUpperCase();
  const inicialB = nomeB.charAt(0).toUpperCase();

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="rounded-2xl relative overflow-hidden cursor-pointer"
      style={{
        background: isLive
          ? "linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--success) / 0.06) 100%)"
          : "hsl(var(--card))",
        border: isLive
          ? "1px solid hsl(var(--success) / 0.4)"
          : "1px solid hsl(var(--border))",
        boxShadow: isLive ? "0 4px 30px -8px hsl(var(--success) / 0.25)" : "none",
      }}
      onClick={() => onAbrirArena?.(destaque)}
    >
      {/* Top glow for live */}
      {isLive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-3/4 rounded-full" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--success)), transparent)" }} />
      )}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: isLive ? "linear-gradient(135deg, hsl(var(--success) / 0.2), hsl(var(--primary) / 0.15))" : "hsl(var(--primary) / 0.12)" }}>
              <Swords className="h-4 w-4" style={{ color: isLive ? "hsl(var(--success))" : "hsl(var(--primary))" }} />
            </div>
            <div>
              <span className="text-xs font-extrabold text-foreground tracking-tight" style={{ fontFamily: fontHeading }}>
                Duelos {isLive ? "ao vivo" : "em andamento"}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {ativos.length} disputa{ativos.length !== 1 ? "s" : ""} rolando
              </span>
            </div>
          </div>
          {isLive && (
            <Badge className="text-[9px] gap-1 animate-pulse border-0" style={{ backgroundColor: "hsl(var(--success))", color: "white" }}>
              <Flame className="w-3 h-3" /> LIVE
            </Badge>
          )}
        </div>

        {/* Versus Card */}
        <div
          className="rounded-xl p-3 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--destructive) / 0.04) 100%)" }}
        >
          {/* Diagonal VS line decoration */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
            <span className="text-[80px] font-black text-foreground rotate-[-8deg]">VS</span>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            {/* Driver A */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-black shrink-0" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))", color: "hsl(var(--primary-foreground))" }}>
                {inicialA}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{nomeA}</p>
                <p className="text-xl font-black tabular-nums leading-none" style={{ color: ridesA >= ridesB ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                  {ridesA}
                </p>
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center px-1">
              <span className="text-[10px] font-black text-muted-foreground tracking-widest">VS</span>
              {Math.abs(ridesA - ridesB) > 0 && (
                <span className="text-[9px] font-bold mt-0.5" style={{ color: "hsl(var(--warning))" }}>
                  +{Math.abs(ridesA - ridesB)}
                </span>
              )}
            </div>

            {/* Driver B */}
            <div className="flex-1 flex items-center gap-2 min-w-0 flex-row-reverse">
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-black shrink-0" style={{ background: "linear-gradient(135deg, hsl(var(--destructive) / 0.8), hsl(var(--destructive) / 0.5))", color: "white" }}>
                {inicialB}
              </div>
              <div className="min-w-0 text-right">
                <p className="text-xs font-bold text-foreground truncate">{nomeB}</p>
                <p className="text-xl font-black tabular-nums leading-none" style={{ color: ridesB >= ridesA ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                  {ridesB}
                </p>
              </div>
            </div>
          </div>

          {/* Comparative bar */}
          <div className="mt-2.5 flex h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}>
            <motion.div className="rounded-l-full" initial={false} animate={{ width: `${(ridesA / (ridesA + ridesB || 1)) * 100}%` }} transition={{ type: "spring", stiffness: 100 }} style={{ backgroundColor: "hsl(var(--primary))" }} />
            <motion.div className="rounded-r-full" initial={false} animate={{ width: `${(ridesB / (ridesA + ridesB || 1)) * 100}%` }} transition={{ type: "spring", stiffness: 100 }} style={{ backgroundColor: "hsl(var(--destructive) / 0.7)" }} />
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {lider && (
              <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: "hsl(var(--warning))" }}>
                <Crown className="h-3 w-3" /> {lider}
              </span>
            )}
            {totalBet > 0 && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Zap className="h-3 w-3" /> {formatPoints(totalBet)} pts
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: "hsl(var(--primary))" }}>
            Acompanhar <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
