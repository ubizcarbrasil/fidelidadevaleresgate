import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscreve às mudanças em duelo_brackets e duelo_season_standings
 * para a temporada selecionada e invalida as queries do React Query
 * sempre que houver INSERT/UPDATE/DELETE — assim o quadro de mata-mata
 * e a tabela de classificação refletem o progresso em tempo real.
 *
 * Retorna `connected` para indicador visual de status.
 */
export function useRealtimeCampeonato(seasonId: string | null | undefined) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  useEffect(() => {
    if (!seasonId) {
      setConnected(false);
      return;
    }

    const canal = supabase
      .channel(`campeonato-duelo-${seasonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duelo_brackets",
          filter: `season_id=eq.${seasonId}`,
        },
        () => {
          setUltimaAtualizacao(new Date());
          qc.invalidateQueries({ queryKey: ["campeonato_confrontos", seasonId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duelo_season_standings",
          filter: `season_id=eq.${seasonId}`,
        },
        () => {
          setUltimaAtualizacao(new Date());
          qc.invalidateQueries({ queryKey: ["campeonato_classificacao", seasonId] });
        },
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(canal);
      setConnected(false);
    };
  }, [seasonId, qc]);

  return { connected, ultimaAtualizacao };
}