import React from "react";
import { Sparkles, Tag, Star, Percent, Zap, Gift, Heart, Award, type LucideIcon } from "lucide-react";
import type { BadgeConfig } from "@/hooks/useBrandTheme";
import { useOfferCardConfig } from "@/hooks/useOfferCardConfig";

const ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  tag: Tag,
  star: Star,
  percent: Percent,
  zap: Zap,
  gift: Gift,
  heart: Heart,
  award: Award,
};

interface OfferBadgeProps {
  discountPercent: number;
  offerBadgeConfig?: BadgeConfig | null;
  brandBadgeConfig?: BadgeConfig | null;
  primaryColor: string;
  className?: string;
  size?: "sm" | "md";
  couponType?: string;
  valueRescue?: number;
  minPurchase?: number;
}

const OfferBadge = React.memo(function OfferBadge({
  discountPercent,
  offerBadgeConfig,
  brandBadgeConfig,
  primaryColor,
  className = "",
  size = "md",
  couponType,
  valueRescue = 0,
  minPurchase = 0,
}: OfferBadgeProps) {
  const { getBadgeConfig } = useOfferCardConfig();

  if (discountPercent <= 0 && valueRescue <= 0) return null;

  const offerType = couponType === "PRODUCT" ? "product" as const : "store" as const;
  const configBadge = getBadgeConfig(offerType);

  const config: BadgeConfig = {
    ...{ bg_color: primaryColor, text_color: "#FFFFFF", icon: "sparkles" },
    ...(configBadge.bg_color ? configBadge : {}),
    ...(brandBadgeConfig || {}),
    ...(offerBadgeConfig || {}),
  };

  // Use the text_template from config if available
  const defaultTemplate = configBadge.text_template || (couponType === "PRODUCT"
    ? "Pague {percent}% com Pontos"
    : "Troque {points} pts por R$ {credit}");

  const template = config.text_template || defaultTemplate;

  const IconComponent = ICON_MAP[config.icon || "sparkles"] || Sparkles;

  const points = Math.floor(valueRescue);
  const credit = valueRescue.toFixed(2).replace(".", ",");
  const text = template
    .replace("{percent}", String(discountPercent))
    .replace("{points}", String(points))
    .replace("{credit}", credit);

  const sizeClasses = size === "sm"
    ? "text-[9px] px-1.5 py-0.5 gap-0.5"
    : "text-[10px] px-2 py-0.5 gap-0.5";

  const iconSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";

  return (
    <div
      className={`inline-flex items-center rounded-full font-bold ${sizeClasses} ${className}`}
      style={{ backgroundColor: config.bg_color || primaryColor, color: config.text_color }}
    >
      <IconComponent className={iconSize} />
      {text}
    </div>
  );
});

export default OfferBadge;
