import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listarEventosTemporada } from "../services/servico_log_eventos";

const CHAVE_LOG = "campeonato_log_eventos";

export function useLogEventosTemporada(seasonId: string | null | undefined, limite = 200) {
  const qc = useQueryClient();

  // Realtime: invalida quando novo evento entra
  useEffect(() => {
    if (!seasonId) return;
    const canal = supabase
      .channel(`log-eventos-${seasonId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "duelo_match_events",
        },
        () => {
          qc.invalidateQueries({ queryKey: [CHAVE_LOG, seasonId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [seasonId, qc]);

  return useQuery({
    queryKey: [CHAVE_LOG, seasonId, limite],
    queryFn: () => listarEventosTemporada(seasonId!, limite),
    enabled: !!seasonId,
    staleTime: 10_000,
  });
}