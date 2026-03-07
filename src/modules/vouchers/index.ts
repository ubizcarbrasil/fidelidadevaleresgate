/**
 * Vouchers Module — barrel export.
 */
export type {
  Voucher,
  VoucherInsert,
  DiscountType,
  VoucherStatus,
  VoucherWizardPayload,
} from "./types";

export {
  STATUS_LABELS,
  STATUS_VARIANTS,
  generateVoucherCode,
  isValidCode,
  calculateDiscount,
  isVoucherActive,
} from "./types";

export * as voucherService from "./services/voucherService";
