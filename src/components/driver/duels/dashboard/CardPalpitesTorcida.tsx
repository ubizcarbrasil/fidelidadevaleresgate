/**
 * Card de palpites / torcida — visual de torcida organizada.
 */
import { Users, ChevronRight, Megaphone, Target } from "lucide-react";
import { motion } from "framer-motion";
import { type Duel, cleanDriverName } from "../hook_duelos";

interface Props {
  duelos: Duel[];
  onAbrirArena?: (duel: Duel) => void;
  fontHeading?: string;
}

export default function CardPalpitesTorcida({ duelos, onAbrirArena, fontHeading }: Props) {
  const ativos = duelos.filter((d) => d.status === "live" || d.status === "accepted");
  if (ativos.length === 0) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, hsl(var(--card)) 0%, hsl(280 60% 55% / 0.05) 100%)",
        border: "1px solid hsl(280 60% 55% / 0.15)",
      }}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(280 60% 55% / 0.2), hsl(280 60% 55% / 0.08))" }}>
            <Megaphone className="h-4 w-4" style={{ color: "hsl(280 60% 55%)" }} />
          </div>
          <div>
            <span className="text-xs font-extrabold text-foreground tracking-tight" style={{ fontFamily: fontHeading }}>
              Torcida da Cidade
            </span>
            <span className="text-[10px] text-muted-foreground block">
              {ativos.length} disputa{ativos.length !== 1 ? "s" : ""} abertas
            </span>
          </div>
        </div>

        {/* Duel items */}
        <div className="space-y-2">
          {ativos.slice(0, 3).map((d) => {
            const nA = cleanDriverName(d.challenger?.public_nickname || (d.challenger as any)?.customers?.name);
            const nB = cleanDriverName(d.challenged?.public_nickname || (d.challenged as any)?.customers?.name);
            const iA = nA.charAt(0).toUpperCase();
            const iB = nB.charAt(0).toUpperCase();

            return (
              <motion.div
                key={d.id}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl p-2.5 cursor-pointer"
                style={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}
                onClick={() => onAbrirArena?.(d)}
              >
                {/* Mini avatars */}
                <div className="flex items-center -space-x-2">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 z-10" style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderColor: "hsl(var(--card))" }}>
                    {iA}
                  </div>
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black border-2" style={{ backgroundColor: "hsl(var(--destructive) / 0.8)", color: "white", borderColor: "hsl(var(--card))" }}>
                    {iB}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-foreground font-semibold truncate block">
                    {nA} vs {nB}
                  </span>
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: "hsl(var(--primary))" }}>
                    {d.challenger_rides_count} × {d.challenged_rides_count}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" style={{ color: "hsl(280 60% 55%)" }} />
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="text-[10px] text-center font-medium" style={{ color: "hsl(280 60% 55%)" }}>
          🎯 Dê seu palpite e torça pelo seu favorito!
        </p>
      </div>
    </div>
  );
}
