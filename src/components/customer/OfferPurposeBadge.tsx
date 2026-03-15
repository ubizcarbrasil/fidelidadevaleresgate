import React from "react";
import { Coins, Gift, RefreshCw } from "lucide-react";

type Purpose = "EARN" | "REDEEM" | "BOTH";

const CONFIG: Record<Purpose, { label: string; bgClass: string; fgClass: string; icon: typeof Coins }> = {
  EARN: { label: "Ganhe Pontos", bgClass: "bg-success/15", fgClass: "text-success", icon: Coins },
  REDEEM: { label: "Resgate", bgClass: "bg-warning/15", fgClass: "text-warning", icon: Gift },
  BOTH: { label: "Ganhe & Resgate", bgClass: "bg-primary/15", fgClass: "text-primary", icon: RefreshCw },
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
      className={`inline-flex items-center rounded-full font-bold ${cfg.bgClass} ${cfg.fgClass} ${sizeClasses} ${className}`}
    >
      <Icon className={iconSize} />
      {cfg.label}
    </span>
  );
});

export default OfferPurposeBadge;
