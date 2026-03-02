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
}

export default function OfferBadge({
  discountPercent,
  offerBadgeConfig,
  brandBadgeConfig,
  primaryColor,
  className = "",
  size = "md",
}: OfferBadgeProps) {
  if (discountPercent <= 0) return null;

  // Merge: offer override > brand default > hardcoded defaults
  const config: BadgeConfig = {
    ...{ bg_color: primaryColor, text_color: "#FFFFFF", text_template: "Pague {percent}% com Pontos", icon: "sparkles" },
    ...(brandBadgeConfig || {}),
    ...(offerBadgeConfig || {}),
  };

  const IconComponent = ICON_MAP[config.icon || "sparkles"] || Sparkles;
  const text = (config.text_template || "Pague {percent}% com Pontos").replace("{percent}", String(discountPercent));

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
