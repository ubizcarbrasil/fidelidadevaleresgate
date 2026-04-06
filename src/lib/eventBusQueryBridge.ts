/**
 * Event Bus → React Query Bridge
 * Escuta eventos do eventBus e invalida queries automaticamente.
 *
 * Inicialize uma vez no App:
 *   import { initEventBusQueryBridge } from "@/lib/eventBusQueryBridge";
 *   initEventBusQueryBridge(queryClient);
 */
import type { QueryClient } from "@tanstack/react-query";
import { eventBus, type AppEventName } from "./eventBus";
import { queryKeys } from "./queryKeys";

const DUEL_INVALIDATIONS = [["driver-duels"], ["duel-participant"]] as const;

const EVENT_INVALIDATION_MAP: Record<AppEventName, readonly (readonly string[])[]> = {
  EARNING_CREATED: [
    queryKeys.loyalty.earnings.all,
    queryKeys.loyalty.ledger.all,
    queryKeys.customers.all,
    queryKeys.dashboard.all,
  ],
  REDEMPTION_COMPLETED: [
    queryKeys.customers.all,
    queryKeys.dashboard.all,
  ],
  CONTACT_UPSERTED: [
    queryKeys.crm.contacts.all,
    queryKeys.crm.all,
  ],
  CAMPAIGN_SENT: [
    queryKeys.crm.campaigns.all,
  ],
  VOUCHER_CREATED: [
    queryKeys.vouchers.all,
  ],
  STORE_APPROVED: [
    queryKeys.stores.all,
    queryKeys.dashboard.all,
  ],
  CUSTOMER_CREATED: [
    queryKeys.customers.all,
    queryKeys.dashboard.all,
  ],
  // Duelos
  DUEL_CHALLENGE_RECEIVED: DUEL_INVALIDATIONS,
  DUEL_CHALLENGE_ACCEPTED: DUEL_INVALIDATIONS,
  DUEL_CHALLENGE_DECLINED: DUEL_INVALIDATIONS,
  DUEL_STARTED: DUEL_INVALIDATIONS,
  DUEL_LEAD_CHANGE: DUEL_INVALIDATIONS,
  DUEL_FINISHED: DUEL_INVALIDATIONS,
  DUEL_VICTORY: DUEL_INVALIDATIONS,
  DUEL_DEFEAT: DUEL_INVALIDATIONS,
  RANKING_TOP10_ENTRY: [],
  BELT_NEW_CHAMPION: [],
};

let initialized = false;

export function initEventBusQueryBridge(queryClient: QueryClient): () => void {
  if (initialized) return () => {};
  initialized = true;

  const unsubscribers: (() => void)[] = [];

  for (const [event, keys] of Object.entries(EVENT_INVALIDATION_MAP)) {
    const unsub = eventBus.on(event as AppEventName, () => {
      keys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: queryKey as string[] });
      });
    });
    unsubscribers.push(unsub);
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
    initialized = false;
  };
}
