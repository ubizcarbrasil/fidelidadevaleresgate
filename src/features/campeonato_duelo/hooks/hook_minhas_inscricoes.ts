import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MinhaInscricao {
  id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  season_name: string | null;
}

export function useMinhasInscricoes(driverId?: string | null) {
  return useQuery({
    queryKey: ["campeonato-minhas-inscricoes", driverId],
    enabled: !!driverId,
    staleTime: 60_000,
    queryFn: async (): Promise<MinhaInscricao[]> => {
      const { data, error } = await (supabase as any)
        .from("duelo_season_enrollments")
        .select("id, status, created_at, season:duelo_seasons(name)")
        .eq("driver_id", driverId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return ((data ?? []) as any[]).map((row) => ({
        id: row.id,
        status: row.status,
        created_at: row.created_at,
        season_name: row.season?.name ?? null,
      }));
    },
  });
}