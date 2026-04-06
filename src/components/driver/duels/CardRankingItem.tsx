import React from "react";
import type { RankingEntry } from "./hook_ranking_cidade";

interface Props {
  entry: RankingEntry;
  isMe: boolean;
  maxRides: number;
}

export default function CardRankingItem({ entry, isMe, maxRides }: Props) {
  const displayName = entry.nickname || entry.driverName;
  const pct = maxRides > 0 ? Math.round((entry.totalRides / maxRides) * 100) : 0;

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{
        backgroundColor: isMe ? "hsl(var(--primary) / 0.10)" : "hsl(var(--card))",
        border: `1px solid ${isMe ? "hsl(var(--primary) / 0.35)" : "hsl(var(--border))"}`,
      }}
    >
      {/* Position */}
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
        style={{
          backgroundColor: isMe ? "hsl(var(--primary) / 0.2)" : "hsl(var(--muted))",
          color: isMe ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
        }}
      >
        {entry.rankPosition}º
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">
          {displayName}
          {isMe && <span className="text-[10px] text-primary ml-1">(você)</span>}
        </p>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full mt-1" style={{ backgroundColor: "hsl(var(--muted))" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: isMe ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)",
            }}
          />
        </div>
      </div>

      {/* Rides */}
      <p className="text-sm font-black text-foreground shrink-0">{entry.totalRides}</p>
    </div>
  );
}
