/**
 * CRM Module — Tipos compartilhados
 * Todos os tipos do módulo CRM ficam aqui para evitar acoplamento.
 */

export interface CrmContact {
  id: string;
  brand_id: string;
  branch_id: string | null;
  customer_id: string | null;
  external_id: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  cpf: string | null;
  gender: string | null;
  os_platform: string | null;
  source: string;
  latitude: number | null;
  longitude: number | null;
  tags_json: unknown;
  metadata_json: unknown;
  ride_count: number;
  first_ride_at: string | null;
  last_ride_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrmEvent {
  id: string;
  brand_id: string;
  contact_id: string;
  event_type: string;
  event_subtype: string | null;
  latitude: number | null;
  longitude: number | null;
  payload_json: unknown;
  created_at: string;
}

export interface TierConfig {
  id: string;
  name: string;
  min_events: number;
  max_events: number | null;
  color: string;
  icon: string;
  order_index: number;
}

export interface TierWithCount extends TierConfig {
  count: number;
}

export interface AudienceFilters {
  gender?: string;
  os_platform?: string;
  source?: string;
  min_events?: number;
  max_events?: number;
}

export interface CrmContactsQueryOptions {
  source?: string;
  gender?: string;
  os_platform?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ContactStats {
  total: number;
  bySource: Record<string, number>;
  byGender: Record<string, number>;
  byOS: Record<string, number>;
}

export interface EventStats {
  total: number;
  byType: Record<string, number>;
}

export const CRM_EVENT_TYPES = {
  // Mobility
  USER_REGISTERED: "USER_REGISTERED",
  RIDE_ESTIMATED: "RIDE_ESTIMATED",
  RIDE_REQUESTED: "RIDE_REQUESTED",
  RIDE_STARTED: "RIDE_STARTED",
  RIDE_COMPLETED: "RIDE_COMPLETED",
  RIDE_CANCELLED_PASSENGER: "RIDE_CANCELLED_PASSENGER",
  RIDE_CANCELLED_EXTERNAL: "RIDE_CANCELLED_EXTERNAL",
  RIDE_UNATTENDED: "RIDE_UNATTENDED",
  RIDE_RATED: "RIDE_RATED",
  // Loyalty
  EARNING: "EARNING",
  REDEMPTION: "REDEMPTION",
  OFFER_VIEW: "OFFER_VIEW",
  OFFER_CLICK: "OFFER_CLICK",
} as const;

export const CRM_SOURCES = {
  MOBILITY_APP: "MOBILITY_APP",
  LOYALTY: "LOYALTY",
  STORE_UPLOAD: "STORE_UPLOAD",
  MANUAL: "MANUAL",
} as const;

export const DEFAULT_TIERS: Omit<TierConfig, "id">[] = [
  { name: "Galático", min_events: 500, max_events: null, color: "#8b5cf6", icon: "Rocket", order_index: 0 },
  { name: "Lendário", min_events: 101, max_events: 499, color: "#f59e0b", icon: "Crown", order_index: 1 },
  { name: "Diamante", min_events: 51, max_events: 100, color: "#06b6d4", icon: "Diamond", order_index: 2 },
  { name: "Ouro", min_events: 31, max_events: 50, color: "#eab308", icon: "Medal", order_index: 3 },
  { name: "Prata", min_events: 11, max_events: 30, color: "#94a3b8", icon: "Award", order_index: 4 },
  { name: "Bronze", min_events: 1, max_events: 10, color: "#d97706", icon: "Star", order_index: 5 },
  { name: "Iniciante", min_events: 0, max_events: 0, color: "#9ca3af", icon: "User", order_index: 6 },
];

export const CHANNEL_CONFIG = {
  WHATSAPP: { label: "WhatsApp", cost: 0.50, color: "bg-green-100 text-green-700" },
  PUSH: { label: "Push", cost: 0.03, color: "bg-blue-100 text-blue-700" },
  EMAIL: { label: "E-mail", cost: 0.03, color: "bg-purple-100 text-purple-700" },
  IN_APP: { label: "In-App", cost: 0.01, color: "bg-amber-100 text-amber-700" },
} as const;

export const SOURCE_LABELS: Record<string, string> = {
  MOBILITY_APP: "App Mobilidade",
  LOYALTY: "Fidelidade",
  STORE_UPLOAD: "Upload Loja",
  MANUAL: "Manual",
};

export const SOURCE_COLORS: Record<string, string> = {
  MOBILITY_APP: "bg-blue-100 text-blue-700",
  LOYALTY: "bg-green-100 text-green-700",
  STORE_UPLOAD: "bg-amber-100 text-amber-700",
  MANUAL: "bg-gray-100 text-gray-700",
};
