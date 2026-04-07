/**
 * Hook de escuta Realtime para desafios recebidos.
 * Detecta INSERTs na tabela driver_duels onde o motorista logado é o desafiado.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useDuelParticipation } from "./hook_duelos";

export interface DesafioRecebido {
  duelId: string;
  challengerId: string;
  challengerName: string | null;
  startAt: string;
  endAt: string;
  pointsBet: number;
}

export function useEscutaDesafiosRecebidos() {
  const [desafioPendente, setDesafioPendente] = useState<DesafioRecebido | null>(null);
  const queryClient = useQueryClient();
  const { participant } = useDuelParticipation();

  const fecharPopup = useCallback(() => setDesafioPendente(null), []);

  useEffect(() => {
    if (!participant?.id) return;

    const channel = supabase
      .channel(`desafios-recebidos-${participant.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "driver_duels",
          filter: `challenged_id=eq.${participant.id}`,
        },
        async (payload) => {
          const row = payload.new as any;
          if (row.status !== "pending") return;

          // Invalidate duels query so list refreshes
          queryClient.invalidateQueries({ queryKey: ["driver-duels"] });

          // Fetch challenger name
          let challengerName: string | null = null;
          try {
            const { data } = await supabase
              .from("driver_duel_participants")
              .select("public_nickname, customers(name)")
              .eq("id", row.challenger_id)
              .single();
            if (data) {
              challengerName =
                data.public_nickname ||
                (data.customers as any)?.name?.replace(/\s*\[MOTORISTA\]\s*/gi, "").trim() ||
                "Adversário";
            }
          } catch {
            challengerName = "Adversário";
          }

          setDesafioPendente({
            duelId: row.id,
            challengerId: row.challenger_id,
            challengerName,
            startAt: row.start_at,
            endAt: row.end_at,
            pointsBet: row.challenger_points_bet || 0,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [participant?.id, queryClient]);

  return { desafioPendente, fecharPopup };
}
