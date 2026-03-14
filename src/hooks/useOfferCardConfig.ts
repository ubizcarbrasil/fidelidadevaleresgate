import { useBrand } from "@/contexts/BrandContext";
import type { BadgeConfig } from "@/hooks/useBrandTheme";

export interface OfferTypeCardConfig {
  title_template: string;
  subtitle_template: string;
  detail_template: string;
  badge: BadgeConfig;
}

export interface OfferCardConfig {
  store: OfferTypeCardConfig;
  product: OfferTypeCardConfig;
  emitter: OfferTypeCardConfig;
}

export const DEFAULT_CONFIG: OfferCardConfig = {
  store: {
    title_template: "CRÉDITO DE R$ {credit}",
    subtitle_template: "{points} pontos por R$ {credit}",
    detail_template: "{points} pontos por R$ {credit} em créditos na compra mínima de R$ {min}",
    badge: { bg_color: "", text_color: "#FFFFFF", text_template: "Troque {points} pts por R$ {credit}", icon: "sparkles" },
  },
  product: {
    title_template: "PAGUE {percent}% COM PONTOS",
    subtitle_template: "{points} pts = R$ {credit}",
    detail_template: "{points} pts = R$ {credit} na compra mínima de R$ {min}",
    badge: { bg_color: "", text_color: "#FFFFFF", text_template: "Pague {percent}% com Pontos", icon: "sparkles" },
  },
  emitter: {
    title_template: "{points_per_real}x pontos por real",
    subtitle_template: "Compre e acumule pontos",
    detail_template: "",
    badge: { bg_color: "", text_color: "#FFFFFF", text_template: "{points_per_real} pts", icon: "star" },
  },
};

export interface FormatData {
  credit?: number;
  points?: number;
  percent?: number;
  min?: number;
  points_per_real?: number;
  store_name?: string;
}

function applyTemplate(template: string, data: FormatData): string {
  return template
    .replace(/\{credit\}/g, data.credit != null ? data.credit.toFixed(2).replace(".", ",") : "0,00")
    .replace(/\{points\}/g, String(data.points ?? 0))
    .replace(/\{percent\}/g, String(data.percent ?? 0))
    .replace(/\{min\}/g, data.min != null ? data.min.toFixed(2).replace(".", ",") : "0,00")
    .replace(/\{points_per_real\}/g, String(data.points_per_real ?? 0))
    .replace(/\{store_name\}/g, data.store_name ?? "");
}

type OfferType = "store" | "product" | "emitter";

export function useOfferCardConfig() {
  const { brand } = useBrand();

  const settings = brand?.brand_settings_json as Record<string, unknown> | null;
  const saved = settings?.offer_card_config as Partial<OfferCardConfig> | undefined;

  const config: OfferCardConfig = {
    store: { ...DEFAULT_CONFIG.store, ...(saved?.store || {}) },
    product: { ...DEFAULT_CONFIG.product, ...(saved?.product || {}) },
    emitter: { ...DEFAULT_CONFIG.emitter, ...(saved?.emitter || {}) },
  };

  const formatTitle = (type: OfferType, data: FormatData) =>
    applyTemplate(config[type].title_template || DEFAULT_CONFIG[type].title_template, data);

  const formatSubtitle = (type: OfferType, data: FormatData) =>
    applyTemplate(config[type].subtitle_template || DEFAULT_CONFIG[type].subtitle_template, data);

  const formatDetail = (type: OfferType, data: FormatData) =>
    applyTemplate(config[type].detail_template || DEFAULT_CONFIG[type].detail_template, data);

  const getBadgeConfig = (type: OfferType): BadgeConfig => config[type].badge;

  return { config, formatTitle, formatSubtitle, formatDetail, getBadgeConfig };
}
