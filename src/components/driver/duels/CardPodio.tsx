import React from "react";
import { Crown, Medal } from "lucide-react";
import type { RankingEntry } from "./hook_ranking_cidade";

const medalColors: Record<number, string> = {
  1: "hsl(45, 100%, 50%)",   // gold
  2: "hsl(0, 0%, 75%)",     // silver
  3: "hsl(30, 60%, 45%)",   // bronze
};

const medalEmoji: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

interface Props {
  entry: RankingEntry;
  isMe: boolean;
}

export default function CardPodio({ entry, isMe }: Props) {
  const isFirst = entry.rankPosition === 1;
  const color = medalColors[entry.rankPosition] || "hsl(var(--muted-foreground))";
  const displayName = entry.nickname || entry.driverName;

  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl p-3 text-center ${isFirst ? "scale-105" : ""}`}
      style={{
        backgroundColor: isMe ? "hsl(var(--primary) / 0.12)" : "hsl(var(--card))",
        border: `1.5px solid ${isMe ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))"}`,
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Medal */}
      <span className="text-2xl">{medalEmoji[entry.rankPosition]}</span>

      {/* Avatar */}
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
        style={{
          backgroundColor: `${color}22`,
          color,
          border: `2px solid ${color}`,
        }}
      >
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </div>

      {/* Name */}
      <p className="text-xs font-bold text-foreground truncate w-full">
        {displayName}
        {isMe && <span className="text-[10px] text-primary ml-1">(você)</span>}
      </p>

      {/* Rides */}
      <p className="text-lg font-black" style={{ color }}>
        {entry.totalRides}
      </p>
      <p className="text-[10px] text-muted-foreground">corridas</p>
    </div>
  );
}
