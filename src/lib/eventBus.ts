/**
 * Event Bus leve e tipado para comunicação entre módulos.
 * Todos os handlers executam em microtask (não-bloqueante).
 */

export interface AppEvents {
  EARNING_CREATED: { brandId: string; customerId: string; points: number; eventId: string };
  REDEMPTION_COMPLETED: { brandId: string; customerId: string; offerId: string };
  CONTACT_UPSERTED: { brandId: string; contactId: string; source: string };
  CAMPAIGN_SENT: { brandId: string; campaignId: string; recipientCount: number };
  VOUCHER_CREATED: { brandId: string; code: string };
  STORE_APPROVED: { brandId: string; storeId: string };
  CUSTOMER_CREATED: { brandId: string; customerId: string };

  // Duelos — Etapa 7
  DUEL_CHALLENGE_RECEIVED: { brandId: string; challengedCustomerId: string; challengerName: string; duelId: string };
  DUEL_CHALLENGE_ACCEPTED: { brandId: string; challengerCustomerId: string; challengedName: string; duelId: string };
  DUEL_CHALLENGE_DECLINED: { brandId: string; challengerCustomerId: string; challengedName: string; duelId: string };
  DUEL_STARTED: { brandId: string; customerIds: string[]; duelId: string };
  DUEL_LEAD_CHANGE: { brandId: string; trailingCustomerId: string; leaderName: string; duelId: string };
  DUEL_FINISHED: { brandId: string; customerIds: string[]; duelId: string; winnerId: string | null };
  DUEL_VICTORY: { brandId: string; winnerCustomerId: string; opponentName: string; duelId: string };
  DUEL_DEFEAT: { brandId: string; loserCustomerId: string; opponentName: string; duelId: string };
  RANKING_TOP10_ENTRY: { brandId: string; customerId: string; position: number };
  BELT_NEW_CHAMPION: { brandId: string; championCustomerId: string; branchId: string; record: number };
}

export type AppEventName = keyof AppEvents;

type Handler<T> = (data: T) => void;

class EventBus {
  private listeners = new Map<string, Set<Handler<any>>>();

  on<K extends AppEventName>(event: K, handler: Handler<AppEvents[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  emit<K extends AppEventName>(event: K, data: AppEvents[K]): void {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) return;

    queueMicrotask(() => {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (err) {
          console.error(`[EventBus] Error in handler for ${event}:`, err);
        }
      });
    });
  }

  /** Remove all listeners (useful for testing) */
  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
