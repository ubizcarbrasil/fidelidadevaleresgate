/**
 * Event Bus leve e tipado para comunicação entre módulos.
 * Todos os handlers executam em microtask (não-bloqueante).
 *
 * Uso:
 *   import { eventBus } from "@/lib/eventBus";
 *   eventBus.emit("EARNING_CREATED", { brandId, points });
 *   const unsub = eventBus.on("EARNING_CREATED", (data) => { ... });
 *   unsub(); // cleanup
 */

export interface AppEvents {
  EARNING_CREATED: { brandId: string; customerId: string; points: number; eventId: string };
  REDEMPTION_COMPLETED: { brandId: string; customerId: string; offerId: string };
  CONTACT_UPSERTED: { brandId: string; contactId: string; source: string };
  CAMPAIGN_SENT: { brandId: string; campaignId: string; recipientCount: number };
  VOUCHER_CREATED: { brandId: string; code: string };
  STORE_APPROVED: { brandId: string; storeId: string };
  CUSTOMER_CREATED: { brandId: string; customerId: string };
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

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  emit<K extends AppEventName>(event: K, data: AppEvents[K]): void {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) return;

    // Execute in microtask to avoid blocking
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
