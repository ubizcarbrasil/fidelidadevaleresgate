/**
 * Vouchers Module — types & business logic.
 */
import type { Database } from "@/integrations/supabase/types";

export type Voucher = Database["public"]["Tables"]["coupons"]["Row"];
export type VoucherInsert = Database["public"]["Tables"]["coupons"]["Insert"];

export type DiscountType = "PERCENT" | "FIXED";
export type VoucherStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

export interface VoucherWizardPayload {
  code: string;
  title: string;
  description: string | null;
  discount_type: DiscountType;
  discount_percent: number;
  discount_fixed_value: number;
  branch_id: string;
  max_uses: number;
  max_uses_per_customer: number;
  min_purchase: number;
  start_at: string | null;
  expires_at: string | null;
  campaign: string | null;
  target_audience: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  terms: string | null;
  is_public: boolean;
  created_by: string | undefined;
}

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativo",
  EXPIRED: "Expirado",
  INACTIVE: "Inativo",
};

export const STATUS_VARIANTS: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  ACTIVE: "default",
  EXPIRED: "secondary",
  INACTIVE: "destructive",
};

/**
 * Generates a random voucher code (8 chars, no ambiguous characters).
 */
export function generateVoucherCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Validates a voucher code format.
 */
export function isValidCode(code: string): boolean {
  return /^[A-Z0-9]{4,16}$/.test(code);
}

/**
 * Calculates the discount amount for a given purchase.
 */
export function calculateDiscount(
  purchaseValue: number,
  type: DiscountType,
  discountPercent: number,
  discountFixed: number
): number {
  if (purchaseValue <= 0) return 0;
  if (type === "PERCENT") {
    const pct = Math.min(Math.max(discountPercent, 0), 100);
    return Math.round(purchaseValue * (pct / 100) * 100) / 100;
  }
  return Math.min(discountFixed, purchaseValue);
}

/**
 * Checks if a voucher is currently valid based on dates.
 */
export function isVoucherActive(
  status: string,
  startAt: string | null,
  expiresAt: string | null,
  now = new Date()
): boolean {
  if (status !== "ACTIVE") return false;
  if (startAt && new Date(startAt) > now) return false;
  if (expiresAt && new Date(expiresAt) < now) return false;
  return true;
}
