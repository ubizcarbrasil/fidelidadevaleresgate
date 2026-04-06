/**
 * Card compacto do ranking — design de pódio vertical.
 */
import { Trophy, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { type RankingEntry, type MinhaColocacao } from "../hook_ranking_cidade";

interface Props {
  ranking: RankingEntry[];
  minhaPosicao: MinhaColocacao | null;
  onAbrir: () => void;
  fontHeading?: string;
}

const PODIUM = ["🥇", "🥈", "🥉"];

export default function CardRankingCidade({ ranking, minhaPosicao, onAbrir, fontHeading }: Props) {
  const top3 = ranking.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      className="rounded-2xl p-3.5 flex flex-col cursor-pointer"
      style={{
        background: "linear-gradient(160deg, hsl(var(--card)) 0%, hsl(217 91% 60% / 0.06) 100%)",
        border: "1px solid hsl(217 91% 60% / 0.2)",
      }}
      onClick={onAbrir}
    >
      <div className="flex items-center gap-1.5 mb-2.5">
        <Trophy className="h-4 w-4" style={{ color: "hsl(217 91% 60%)" }} />
        <span className="text-[11px] font-extrabold text-foreground tracking-tight" style={{ fontFamily: fontHeading }}>
          Ranking
        </span>
      </div>

      <div className="space-y-1.5 flex-1">
        {top3.map((entry, i) => (
          <div key={entry.customerId} className="flex items-center gap-1.5">
            <span className="text-xs">{PODIUM[i]}</span>
            <span className="text-[10px] font-medium text-foreground flex-1 truncate">
              {entry.nickname || entry.driverName}
            </span>
            <span className="text-[10px] font-black tabular-nums" style={{ color: "hsl(var(--primary))" }}>
              {entry.totalRides}
            </span>
          </div>
        ))}
      </div>

      {minhaPosicao && (
        <div className="mt-2 pt-2 border-t flex items-center gap-1" style={{ borderColor: "hsl(var(--border))" }}>
          <span className="text-[9px] text-muted-foreground">Você:</span>
          <span className="text-[10px] font-extrabold" style={{ color: "hsl(var(--primary))" }}>
            {minhaPosicao.rankPosition}º
          </span>
        </div>
      )}
    </motion.div>
  );
}
