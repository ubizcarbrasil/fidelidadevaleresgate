/**
 * Customers Module — barrel export.
 */
export type { Customer, CustomerInsert, CustomerForm } from "./types";

export {
  EMPTY_CUSTOMER_FORM,
  formatBalance,
  isValidCustomerForm,
  resolveCustomerName,
} from "./types";

export * as customerService from "./services/customerService";
