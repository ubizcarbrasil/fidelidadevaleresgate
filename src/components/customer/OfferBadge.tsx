import { Sparkles, Tag, Star, Percent, Zap, Gift, Heart, Award } from "lucide-react";
import type { BadgeConfig } from "@/hooks/useBrandTheme";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
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
  /** Per-offer override config (from badge_config_json) */
  offerBadgeConfig?: BadgeConfig | null;
  /** Brand-level default config (from brand_settings_json.badge_config) */
  brandBadgeConfig?: BadgeConfig | null;
  /** Fallback primary color */
  primaryColor: string;
  className?: string;
  size?: "sm" | "md";
  /** Offer type: PRODUCT or STORE */
  couponType?: string;
  /** Credit value (value_rescue) */
  valueRescue?: number;
  /** Minimum purchase amount */
  minPurchase?: number;
}

export default function OfferBadge({
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
  if (discountPercent <= 0 && valueRescue <= 0) return null;

  // Merge: offer override > brand default > hardcoded defaults
  const defaultTemplate = couponType === "PRODUCT"
    ? "Pague {percent}% com Pontos"
    : "Troque {points} pts por R$ {credit}";

  const config: BadgeConfig = {
    ...{ bg_color: primaryColor, text_color: "#FFFFFF", text_template: defaultTemplate, icon: "sparkles" },
    ...(brandBadgeConfig || {}),
    ...(offerBadgeConfig || {}),
  };

  const IconComponent = ICON_MAP[config.icon || "sparkles"] || Sparkles;

  // Build text based on coupon type
  const points = Math.floor(valueRescue);
  const credit = valueRescue.toFixed(2).replace(".", ",");
  const text = (config.text_template || defaultTemplate)
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
      style={{ backgroundColor: config.bg_color, color: config.text_color }}
    >
      <IconComponent className={iconSize} />
      {text}
    </div>
  );
}
