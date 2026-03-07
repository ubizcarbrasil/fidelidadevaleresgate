/**
 * Vouchers Module — Zod validation schemas.
 */
import { z } from "zod";

export const voucherCreateSchema = z.object({
  code: z.string().trim().min(4).max(16).regex(/^[A-Z0-9]+$/, "Código deve conter apenas letras maiúsculas e números"),
  branch_id: z.string().uuid(),
  brand_id: z.string().uuid(),
  store_id: z.string().uuid(),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().min(0, "Valor deve ser positivo"),
  expires_at: z.string().datetime("Data de expiração inválida"),
  status: z.enum(["ACTIVE", "INACTIVE", "EXPIRED"]).default("ACTIVE"),
});

export const voucherToggleSchema = z.object({
  id: z.string().uuid(),
  currentStatus: z.enum(["ACTIVE", "INACTIVE", "EXPIRED"]),
});

export type VoucherCreate = z.infer<typeof voucherCreateSchema>;
export type VoucherToggle = z.infer<typeof voucherToggleSchema>;
