/**
 * Customers Module — types & business logic.
 */
import type { Database } from "@/integrations/supabase/types";

export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];

export interface CustomerForm {
  name: string;
  phone: string;
  brand_id: string;
  branch_id: string;
}

export const EMPTY_CUSTOMER_FORM: CustomerForm = {
  name: "",
  phone: "",
  brand_id: "",
  branch_id: "",
};

/**
 * Formats a customer's balance for display.
 */
export function formatBalance(value: number): string {
  return `R$ ${Number(value).toFixed(2)}`;
}

/**
 * Validates the minimum required fields for customer creation.
 */
export function isValidCustomerForm(form: CustomerForm): boolean {
  return form.name.trim().length > 0 && !!form.brand_id && !!form.branch_id;
}

/**
 * Builds display name from user metadata, with fallback.
 */
export function resolveCustomerName(
  fullName?: string | null,
  email?: string | null
): string {
  if (fullName && fullName.trim()) return fullName.trim();
  if (email) return email.split("@")[0];
  return "Cliente";
}
