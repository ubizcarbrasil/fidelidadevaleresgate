/**
 * Loyalty Module — Zod validation schemas.
 */
import { z } from "zod";

export const earningRequestSchema = z.object({
  brand_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  store_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  purchase_value: z.number().positive("Valor de compra deve ser positivo"),
  receipt_code: z.string().trim().max(50).nullable().optional(),
  source: z.enum(["PDV", "API", "IMPORT", "MANUAL"]).default("PDV"),
  created_by_user_id: z.string().uuid(),
});

export const ledgerEntrySchema = z.object({
  brand_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  entry_type: z.enum(["CREDIT", "DEBIT"]),
  points_amount: z.number().int().min(0),
  money_amount: z.number().min(0),
  reason: z.string().trim().min(1).max(255),
  reference_type: z.string().max(50).nullable().optional(),
  reference_id: z.string().uuid().nullable().optional(),
  created_by_user_id: z.string().uuid(),
});

export type EarningRequest = z.infer<typeof earningRequestSchema>;
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;
