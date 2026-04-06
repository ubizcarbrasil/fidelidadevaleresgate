/**
 * Hook centralizado de escuta de eventos de duelo.
 * Preparado para futuras ações (badges, sons, animações).
 * Atualmente loga eventos para debug.
 */
import { useEffect } from "react";
import { eventBus, type AppEventName } from "@/lib/eventBus";

const EVENTOS_DUELO: AppEventName[] = [
  "DUEL_CHALLENGE_RECEIVED",
  "DUEL_CHALLENGE_ACCEPTED",
  "DUEL_CHALLENGE_DECLINED",
  "DUEL_STARTED",
  "DUEL_LEAD_CHANGE",
  "DUEL_FINISHED",
  "DUEL_VICTORY",
  "DUEL_DEFEAT",
  "RANKING_TOP10_ENTRY",
  "BELT_NEW_CHAMPION",
];

export function useListenerNotificacoesDuelo() {
  useEffect(() => {
    const unsubscribers = EVENTOS_DUELO.map((evento) =>
      eventBus.on(evento, (data) => {
        console.debug(`[DuelEvent] ${evento}`, data);
        // Futuro: tocar som, mostrar badge, animação de confete, etc.
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);
}
