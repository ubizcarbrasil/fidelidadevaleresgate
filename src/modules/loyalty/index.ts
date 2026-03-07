/**
 * Loyalty Module — barrel export.
 */

// Types & business logic
export type {
  PointsRule,
  EarningPreview,
  EarningResult,
  RuleSnapshot,
  EarningSource,
  EarningStatus,
  LedgerEntryType,
} from "./types";

export {
  calculateEarning,
  clampStorePointsPerReal,
} from "./types";

// Services
export * as earningService from "./services/earningService";
export * as redemptionService from "./services/redemptionService";
