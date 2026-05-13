import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  listarConfrontosDaRodada,
  listarRodadasDoTier,
} from "../services/servico_tabela_duelos";

const STALE = 60_000;
const REFETCH = 30_000;

export function useRodadasDoTier(
  seasonId?: string | null,
  tierId?: string | null,
  driverId?: string | null,
) {
  return useQuery({
    queryKey: ["tabela-duelos-rodadas", seasonId, tierId, driverId],
    enabled: !!seasonId && !!driverId,
    staleTime: STALE,
    queryFn: () => listarRodadasDoTier(seasonId!, tierId ?? null, driverId!),
  });
}

export function useConfrontosDaRodada(
  seasonId?: string | null,
  tierId?: string | null,
  round?: string | null,
  driverId?: string | null,
) {
  const qc = useQueryClient();
  const queryKey = [
    "tabela-duelos-confrontos",
    seasonId,
    tierId,
    round,
    driverId,
  ];

  const query = useQuery({
    queryKey,
    enabled: !!seasonId && !!round && !!driverId,
    staleTime: STALE,
    refetchInterval: REFETCH,
    queryFn: () =>
      listarConfrontosDaRodada(seasonId!, tierId ?? null, round!, driverId!),
  });

  useEffect(() => {
    if (!seasonId || !tierId) return;
    const channel = supabase
      .channel(`duelo:matches:${seasonId}:${tierId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "campeonato_brackets",
          filter: `tier_id=eq.${tierId}`,
        },
        () => qc.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonId, tierId, round, driverId]);

  return query;
}