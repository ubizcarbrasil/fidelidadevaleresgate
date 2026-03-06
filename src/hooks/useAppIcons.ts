import { useBrand } from "@/contexts/BrandContext";
import { icons } from "lucide-react";

export interface AppIconConfig {
  type: "lucide" | "custom";
  name: string;
  url?: string;
}

export type AppIconKey =
  | "nav_home" | "nav_offers" | "nav_redemptions" | "nav_wallet" | "nav_profile"
  | "quick_ofertas" | "quick_cupons" | "quick_parceiros" | "quick_pontos" | "quick_presentes" | "quick_achadinhos";

const DEFAULTS: Record<AppIconKey, string> = {
  nav_home: "Home",
  nav_offers: "Tag",
  nav_redemptions: "Ticket",
  nav_wallet: "Wallet",
  nav_profile: "UserCircle",
  quick_ofertas: "Tag",
  quick_cupons: "Percent",
  quick_parceiros: "Store",
  quick_pontos: "Coins",
  quick_presentes: "Gift",
  quick_achadinhos: "Sparkles",
};

export function useAppIcons() {
  const { brand } = useBrand();
  const settings = (brand?.brand_settings_json as any) || {};
  const appIcons: Record<string, AppIconConfig> = settings.app_icons || {};

  function getIcon(key: AppIconKey): AppIconConfig {
    if (appIcons[key]) return appIcons[key];
    return { type: "lucide", name: DEFAULTS[key] };
  }

  function getLucideComponent(key: AppIconKey) {
    const cfg = getIcon(key);
    if (cfg.type === "lucide") {
      return icons[cfg.name as keyof typeof icons] || icons[DEFAULTS[key] as keyof typeof icons];
    }
    return null;
  }

  function getCustomUrl(key: AppIconKey): string | null {
    const cfg = getIcon(key);
    return cfg.type === "custom" ? cfg.url || null : null;
  }

  return { getIcon, getLucideComponent, getCustomUrl, appIcons };
}
