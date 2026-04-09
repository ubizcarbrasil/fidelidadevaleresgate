import React from "react";
import { TrendingUp, TrendingDown, Target } from "lucide-react";
import type { RankingApostadorEntry } from "./hook_ranking_apostadores";

interface Props {
  entry: RankingApostadorEntry;
  isMe: boolean;
}

export default function CardRankingApostador({ entry, isMe }: Props) {
  const isPositive = entry.netPoints >= 0;

  return (
    <div
      className="rounded-xl p-3 space-y-2"
      style={{
        backgroundColor: isMe ? "hsl(var(--primary) / 0.10)" : "hsl(var(--card))",
        border: `1px solid ${isMe ? "hsl(var(--primary) / 0.35)" : "hsl(var(--border))"}`,
      }}
    >
      {/* Top row: position + name + net points */}
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
          style={{
            backgroundColor: isMe ? "hsl(var(--primary) / 0.2)" : "hsl(var(--muted))",
            color: isMe ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
          }}
        >
          {entry.rankPosition}º
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">
            {entry.bettorName}
            {isMe && <span className="text-[10px] text-primary ml-1">(você)</span>}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {entry.totalBets} aposta{entry.totalBets !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Net points */}
        <div className="flex items-center gap-1 shrink-0">
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5" style={{ color: "hsl(var(--success))" }} />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" style={{ color: "hsl(var(--destructive))" }} />
          )}
          <span
            className="text-sm font-black"
            style={{ color: isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))" }}
          >
            {isPositive ? "+" : ""}{entry.netPoints} pts
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-[11px]">
        <div className="flex items-center gap-1">
          <Target className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Acerto:</span>
          <span
            className="font-bold"
            style={{
              color: entry.winRate >= 60
                ? "hsl(var(--success))"
                : entry.winRate >= 40
                ? "hsl(var(--warning))"
                : "hsl(var(--destructive))",
            }}
          >
            {entry.winRate}%
          </span>
        </div>
        <span className="text-muted-foreground">•</span>
        <span className="text-muted-foreground">
          <span className="font-semibold" style={{ color: "hsl(var(--success))" }}>{entry.betsWon}V</span>
          {" / "}
          <span className="font-semibold" style={{ color: "hsl(var(--destructive))" }}>{entry.betsLost}D</span>
        </span>
        <span className="text-muted-foreground">•</span>
        <span className="text-muted-foreground">
          +{entry.pointsWon} / -{entry.pointsLost}
        </span>
      </div>
    </div>
  );
}
