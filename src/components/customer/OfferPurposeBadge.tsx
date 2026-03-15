import React from "react";
import { Coins, Gift, RefreshCw } from "lucide-react";

type Purpose = "EARN" | "REDEEM" | "BOTH";

const CONFIG: Record<Purpose, { label: string; bg: string; fg: string; icon: typeof Coins }> = {
  EARN: { label: "Ganhe Pontos", bg: "hsl(142 71% 45% / 0.15)", fg: "hsl(142 71% 35%)", icon: Coins },
  REDEEM: { label: "Resgate", bg: "hsl(45 93% 47% / 0.15)", fg: "hsl(35 80% 40%)", icon: Gift },
  BOTH: { label: "Ganhe & Resgate", bg: "hsl(217 91% 60% / 0.15)", fg: "hsl(217 71% 45%)", icon: RefreshCw },
};

interface Props {
  purpose: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

const OfferPurposeBadge = React.memo(function OfferPurposeBadge({ purpose, size = "sm", className = "" }: Props) {
  const key = (purpose as Purpose) || "REDEEM";
  const cfg = CONFIG[key] || CONFIG.REDEEM;
  const Icon = cfg.icon;

  const sizeClasses = size === "sm"
    ? "text-[9px] px-1.5 py-0.5 gap-0.5"
    : "text-[11px] px-2 py-1 gap-1";

  const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${sizeClasses} ${className}`}
      style={{ backgroundColor: cfg.bg, color: cfg.fg }}
    >
      <Icon className={iconSize} />
      {cfg.label}
    </span>
  );
});

export default OfferPurposeBadge;
