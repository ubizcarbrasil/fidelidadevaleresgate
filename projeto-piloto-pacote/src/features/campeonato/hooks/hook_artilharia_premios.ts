import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type JanelaArtilhariaKey = "24h" | "7d" | "15d" | "30d";

export interface PremioArtilhariaRow {
  window_key: JanelaArtilhariaKey;
  position: number;
  prize_kind: "points" | "item" | null;
  prize_value: string | null;
  description: string | null;
}

export function useArtilhariaPremios(seasonId: string | null) {
  return useQuery({
    queryKey: ["campeonato-artilharia-premios", seasonId],
    enabled: !!seasonId,
    staleTime: 60_000,
    queryFn: async (): Promise<PremioArtilhariaRow[]> => {
      const { data, error } = await supabase
        .from("campeonato_artilharia_window_prizes")
        .select("window_key, position, prize_kind, prize_value, description")
        .eq("season_id", seasonId!)
        .order("window_key", { ascending: true })
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PremioArtilhariaRow[];
    },
  });
}

export function formatarPremio(p: PremioArtilhariaRow): string {
  const valor = (p.prize_value ?? "").trim();
  const desc = (p.description ?? "").trim();
  if (valor && p.prize_kind === "points") return `${valor} pts`;
  if (valor && desc) return `${valor} — ${desc}`;
  return valor || desc || "Prêmio";
}
