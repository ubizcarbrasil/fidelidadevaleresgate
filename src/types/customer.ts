/**
 * Shared types for customer-facing pages.
 */
import type { Tables } from "@/integrations/supabase/types";

export type OfferRow = Tables<"offers">;

export interface OfferWithStore extends OfferRow {
  stores?: { name: string; logo_url: string | null; taxonomy_segment_id?: string | null } | null;
}

export interface StoreInfo {
  name?: string;
  logo_url?: string | null;
  address?: string;
  whatsapp?: string;
  site_url?: string;
  instagram?: string;
}

export interface OfferInfo {
  title?: string;
  image_url?: string | null;
  value_rescue?: number;
  discount_percent?: number;
  coupon_type?: string;
  redemption_type?: string;
  terms_text?: string;
  min_purchase?: number;
  start_at?: string | null;
  end_at?: string | null;
  is_cumulative?: boolean;
  allowed_weekdays?: number[];
  allowed_hours?: string | null;
  stores?: StoreInfo | null;
}

export interface RedemptionWithOffer {
  id: string;
  created_at: string;
  token: string;
  status: string;
  expires_at?: string | null;
  purchase_value?: number | null;
  credit_value_applied?: number | null;
  customer_cpf?: string | null;
  offer_snapshot_json?: Record<string, unknown> | null;
  offer_id?: string;
  customer_id?: string;
  brand_id?: string;
  branch_id?: string;
  used_at?: string | null;
  offers?: OfferInfo | null;
  branches?: { name: string } | null;
}

/**
 * Lightweight types for navigation context.
 * Components pass partial objects — these define the minimum contract.
 * Using Record<string, unknown> intersection to accept any object with at least `id`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NavOffer extends Record<string, unknown> {
  id: string;
  title?: string;
  image_url?: string | null;
  store_id?: string;
  stores?: { name: string; logo_url: string | null } | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NavStore extends Record<string, unknown> {
  id: string;
  name?: string;
  logo_url?: string | null;
}
