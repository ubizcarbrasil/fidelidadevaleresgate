/**
 * @deprecated Use `@/modules/crm` instead.
 * This file re-exports from the CRM module for backward compatibility.
 */
export {
  useCrmContacts,
  useCrmContactEvents,
  useCrmContactStats,
  useCrmEventStats,
} from "@/modules/crm/hooks/useCrmContacts";

export type { CrmContact, CrmEvent } from "@/modules/crm/types";
