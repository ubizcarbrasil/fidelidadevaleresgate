/**
 * Card de desempenho pessoal — visual de ficha competitiva.
 */
import { useMemo } from "react";
import { Swords, Star, ChevronRight, TrendingUp, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { type Duel } from "../hook_duelos";
import { type Reputacao } from "../hook_avaliacao_duelo";

interface Props {
  duels: Duel[];
  participantId: string | null;
  reputacao: Reputacao | null;
  onAbrir: () => void;
  fontHeading?: string;
}

export default function CardDesempenhoPessoal({ duels, participantId, reputacao, onAbrir, fontHeading }: Props) {
  const stats = useMemo(() => {
    const finalizados = duels.filter((d) => d.status === "finished");
    const total = finalizados.length;
    const vitorias = finalizados.filter((d) => d.winner_id === participantId).length;
    const derrotas = finalizados.filter((d) => d.winner_id && d.winner_id !== participantId).length;
    const empates = total - vitorias - derrotas;
    const winRate = total > 0 ? Math.round((vitorias / total) * 100) : 0;
    return { total, vitorias, derrotas, empates, winRate };
  }, [duels, participantId]);

  if (stats.total === 0 && !reputacao) return null;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="rounded-2xl relative overflow-hidden cursor-pointer"
      style={{
        background: "linear-gradient(160deg, hsl(var(--card)) 0%, hsl(142 71% 45% / 0.05) 100%)",
        border: "1px solid hsl(142 71% 45% / 0.2)",
      }}
      onClick={onAbrir}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(142 71% 45% / 0.2), hsl(142 71% 45% / 0.08))" }}>
              <Shield className="h-4 w-4" style={{ color: "hsl(142 71% 45%)" }} />
            </div>
            <div>
              <span className="text-xs font-extrabold text-foreground tracking-tight" style={{ fontFamily: fontHeading }}>
                Meu Desempenho
              </span>
              {stats.total > 0 && (
                <span className="text-[10px] text-muted-foreground block">
                  {stats.winRate}% de aproveitamento
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-1">
          <StatPill label="Duelos" value={stats.total} cor="hsl(var(--foreground))" bg="hsl(var(--muted) / 0.5)" />
          <StatPill label="Vitórias" value={stats.vitorias} cor="hsl(142 71% 45%)" bg="hsl(142 71% 45% / 0.1)" />
          <StatPill label="Derrotas" value={stats.derrotas} cor="hsl(0 72% 51%)" bg="hsl(0 72% 51% / 0.1)" />
          <StatPill label="Empates" value={stats.empates} cor="hsl(var(--muted-foreground))" bg="hsl(var(--muted) / 0.5)" />
        </div>

        {/* Reputation */}
        {reputacao && reputacao.total_ratings > 0 && (
          <div className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: "hsl(var(--warning) / 0.08)" }}>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-3 w-3"
                  style={{
                    color: i < Math.round(reputacao.avg_rating) ? "hsl(var(--warning))" : "hsl(var(--muted))",
                    fill: i < Math.round(reputacao.avg_rating) ? "hsl(var(--warning))" : "transparent",
                  }}
                />
              ))}
            </div>
            <span className="text-xs font-bold" style={{ color: "hsl(var(--warning))" }}>
              {reputacao.avg_rating.toFixed(1)}
            </span>
            <span className="text-[9px] text-muted-foreground">
              ({reputacao.total_ratings})
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatPill({ label, value, cor, bg }: { label: string; value: number; cor: string; bg: string }) {
  return (
    <div className="rounded-lg py-2 flex flex-col items-center" style={{ backgroundColor: bg }}>
      <span className="text-base font-black tabular-nums leading-none" style={{ color: cor }}>
        {value}
      </span>
      <span className="text-[8px] font-medium text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</span>
    </div>
  );
}
