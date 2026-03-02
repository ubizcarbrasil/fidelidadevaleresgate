import type { BadgeConfig } from "@/hooks/useBrandTheme";

export interface ScaledValue {
  min_purchase: number;
  credit_value: number;
}

export interface SpecificDay {
  weekday: number; // 0=Dom, 1=Seg, ... 6=Sab
  start_time: string; // "09:00"
  end_time: string;   // "18:00"
}

export interface StoreVoucherData {
  coupon_category: string;
  taxonomy_segment_id: string;
  coupon_type: "STORE" | "PRODUCT";
  product_id: string;
  discount_percent: number;
  discount_fixed: number;
  discount_mode: "PERCENT" | "FIXED";
  min_purchase: number;
  scaled_values: ScaledValue[];
  requires_scheduling: boolean;
  scheduling_advance_hours: number;
  is_cumulative: boolean;
  specific_days: SpecificDay[];
  has_specific_days: boolean;
  validity_start: string;
  validity_end: string;
  max_total_uses: number | null;
  unlimited_total: boolean;
  max_uses_per_customer: number | null;
  unlimited_per_customer: boolean;
  interval_between_uses_days: number | null;
  no_interval: boolean;
  terms_accepted: boolean;
  redemption_type: "PRESENCIAL" | "SITE" | "WHATSAPP";
  redemption_branch_id: string;
  title: string;
  description: string;
  image_url: string;
  product_price: number;
  badge_config: BadgeConfig | null;
}

export const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const CATEGORY_OPTIONS = [
  "Alimentação", "Beleza & Estética", "Saúde", "Moda", "Serviços",
  "Educação", "Entretenimento", "Automotivo", "Pet", "Casa & Decoração", "Outro"
];

export const initialStoreVoucherData: StoreVoucherData = {
  coupon_category: "",
  taxonomy_segment_id: "",
  coupon_type: "STORE",
  product_id: "",
  discount_percent: 20,
  discount_fixed: 0,
  discount_mode: "PERCENT",
  min_purchase: 100,
  scaled_values: [],
  requires_scheduling: false,
  scheduling_advance_hours: 24,
  is_cumulative: true,
  specific_days: [],
  has_specific_days: false,
  validity_start: "",
  validity_end: "",
  max_total_uses: null,
  unlimited_total: true,
  max_uses_per_customer: null,
  unlimited_per_customer: true,
  interval_between_uses_days: null,
  no_interval: true,
  terms_accepted: false,
  redemption_type: "PRESENCIAL",
  redemption_branch_id: "",
  title: "",
  description: "",
  image_url: "",
  product_price: 0,
  badge_config: null,
};
