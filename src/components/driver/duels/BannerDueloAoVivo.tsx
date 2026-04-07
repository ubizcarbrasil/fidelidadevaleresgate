/**
 * Banner flutuante que sinaliza duelos ao vivo na cidade.
 * Visível para TODOS os motoristas, independente de participação.
 */
import { useState } from "react";
import { Swords, Flame, ChevronRight, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useDuelosCidade } from "./hook_duelos_publicos";
import ArenaAoVivo from "./ArenaAoVivo";
import { cleanDriverName, type Duel } from "./hook_duelos";

interface Props {
  branchId: string | undefined;
  fontHeading?: string;
}

export default function BannerDueloAoVivo({ branchId, fontHeading }: Props) {
  const { data: duelos } = useDuelosCidade(branchId);
  const [arenaDuel, setArenaDuel] = useState<Duel | null>(null);

  const aoVivo = (duelos || []).filter((d) => d.status === "live" || d.status === "accepted");
  if (aoVivo.length === 0 && !arenaDuel) return null;

  if (arenaDuel) {
    const updated = (duelos || []).find((d) => d.id === arenaDuel.id) || arenaDuel;
    return <ArenaAoVivo duel={updated} onBack={() => setArenaDuel(null)} />;
  }

  const destaque = aoVivo[0];
  const nomeA = cleanDriverName(
    destaque.challenger?.public_nickname || destaque.challenger?.customers?.name
  );
  const nomeB = cleanDriverName(
    destaque.challenged?.public_nickname || destaque.challenged?.customers?.name
  );
  const ridesA = destaque.challenger_rides_count;
  const ridesB = destaque.challenged_rides_count;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="px-5 pt-3"
      >
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{
            background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--success) / 0.08) 100%)",
            border: "1px solid hsl(var(--success) / 0.4)",
            boxShadow: "0 4px 24px -6px hsl(var(--success) / 0.25)",
          }}
        >
          {/* Top glow line */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-3/4 rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, hsl(var(--success)), transparent)" }}
          />

          <div className="p-3 flex items-center gap-3">
            {/* Ícone pulsante */}
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 animate-pulse"
              style={{
                background: "linear-gradient(135deg, hsl(var(--success) / 0.25), hsl(var(--primary) / 0.15))",
              }}
            >
              <Swords className="h-5 w-5" style={{ color: "hsl(var(--success))" }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Badge
                  className="text-[9px] gap-0.5 animate-pulse border-0 px-1.5 py-0"
                  style={{ backgroundColor: "hsl(var(--success))", color: "white" }}
                >
                  <Flame className="w-2.5 h-2.5" /> AO VIVO
                </Badge>
                {aoVivo.length > 1 && (
                  <span className="text-[9px] text-muted-foreground">
                    +{aoVivo.length - 1} duelo{aoVivo.length > 2 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-foreground truncate" style={{ fontFamily: fontHeading }}>
                {nomeA}
                <span className="text-muted-foreground font-medium mx-1">
                  {ridesA} × {ridesB}
                </span>
                {nomeB}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => setArenaDuel(destaque)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-transform active:scale-95"
                style={{
                  backgroundColor: "hsl(var(--primary) / 0.15)",
                  color: "hsl(var(--primary))",
                }}
              >
                <Target className="w-3 h-3" />
                Palpitar
              </button>
              <button
                onClick={() => setArenaDuel(destaque)}
                className="flex items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-white transition-transform active:scale-95"
                style={{ backgroundColor: "hsl(var(--success))" }}
              >
                Ver
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
