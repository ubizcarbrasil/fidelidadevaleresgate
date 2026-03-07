/**
 * @deprecated Use `@/modules/crm` instead.
 * This file re-exports from the CRM module for backward compatibility.
 */
export {
  useTierConfig,
  useTierDistribution,
} from "@/modules/crm/hooks/useTierStats";

export type { TierConfig, TierWithCount } from "@/modules/crm/types";
