/**
 * Card resumido do ranking da cidade para o dashboard.
 */
import { Trophy, ChevronRight, Medal } from "lucide-react";
import { type RankingEntry, type MinhaColocacao } from "../hook_ranking_cidade";

interface Props {
  ranking: RankingEntry[];
  minhaPosicao: MinhaColocacao | null;
  onAbrir: () => void;
  fontHeading?: string;
}

const MEDAL_COLORS = ["#fbbf24", "#a0a0a0", "#cd7f32"];

export default function CardRankingCidade({ ranking, minhaPosicao, onAbrir, fontHeading }: Props) {
  const top3 = ranking.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-4 space-y-3 cursor-pointer active:scale-[0.98] transition-transform"
      style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      onClick={onAbrir}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(217 91% 60% / 0.12)" }}>
            <Trophy className="h-4 w-4" style={{ color: "hsl(217 91% 60%)" }} />
          </div>
          <span className="text-xs font-bold text-foreground" style={{ fontFamily: fontHeading }}>
            Ranking da Cidade
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Top 3 */}
      <div className="space-y-2">
        {top3.map((entry, i) => (
          <div key={entry.customerId} className="flex items-center gap-2.5">
            <span className="text-sm" style={{ color: MEDAL_COLORS[i] }}>
              {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
            </span>
            <span className="text-xs font-medium text-foreground flex-1 truncate">
              {entry.nickname || entry.driverName}
            </span>
            <span className="text-xs font-bold tabular-nums" style={{ color: "hsl(var(--primary))" }}>
              {entry.totalRides}
            </span>
            <span className="text-[9px] text-muted-foreground">corridas</span>
          </div>
        ))}
      </div>

      {/* Minha posição */}
      {minhaPosicao && (
        <div
          className="rounded-lg p-2.5 flex items-center gap-2"
          style={{ backgroundColor: "hsl(var(--primary) / 0.08)", border: "1px solid hsl(var(--primary) / 0.15)" }}
        >
          <Medal className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
          <span className="text-[11px] font-medium text-foreground">
            Você está em <b className="text-primary">{minhaPosicao.rankPosition}º</b> com {minhaPosicao.totalRides} corridas
          </span>
        </div>
      )}
    </div>
  );
}
