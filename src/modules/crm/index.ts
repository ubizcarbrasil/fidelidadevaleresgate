/**
 * CRM Module — barrel export.
 *
 * Todas as exportações públicas do módulo CRM passam por aqui.
 * Importar:  import { useCrmContacts, CRM_EVENT_TYPES } from "@/modules/crm";
 */

// Types & Constants
export type {
  CrmContact,
  CrmEvent,
  TierConfig,
  TierWithCount,
  AudienceFilters,
  CrmContactsQueryOptions,
  ContactStats,
  EventStats,
} from "./types";

export {
  CRM_EVENT_TYPES,
  CRM_SOURCES,
  DEFAULT_TIERS,
  CHANNEL_CONFIG,
  SOURCE_LABELS,
  SOURCE_COLORS,
} from "./types";

// Hooks (interface pública para componentes React)
export {
  useCrmContacts,
  useCrmContactEvents,
  useCrmContactStats,
  useCrmEventStats,
} from "./hooks/useCrmContacts";

export {
  useTierConfig,
  useTierDistribution,
} from "./hooks/useTierStats";

// Services (para uso direto em mutations ou edge functions)
export * as contactService from "./services/contactService";
export * as tierService from "./services/tierService";
export * as campaignService from "./services/campaignService";
