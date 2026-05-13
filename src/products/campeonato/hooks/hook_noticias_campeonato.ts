import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NoticiaCampeonatoEvento =
  | "season_created"
  | "phase_changed"
  | "knockout_started"
  | "champion_crowned"
  | "tier_seeded";

export interface NoticiaCampeonato {
  id: string;
  event_type: NoticiaCampeonatoEvento;
  payload: any;
  created_at: string;
}

const EVENTOS: NoticiaCampeonatoEvento[] = [
  "season_created",
  "phase_changed",
  "knockout_started",
  "champion_crowned",
  "tier_seeded",
];

export function useNoticiasCampeonato(seasonId?: string | null) {
  return useQuery({
    queryKey: ["campeonato-noticias", seasonId],
    enabled: !!seasonId,
    staleTime: 120_000,
    queryFn: async (): Promise<NoticiaCampeonato[]> => {
      const { data, error } = await (supabase as any)
        .from("campeonato_attempts_log")
        .select("id, event_type, payload, created_at")
        .eq("season_id", seasonId)
        .in("event_type", EVENTOS)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as NoticiaCampeonato[];
    },
  });
}