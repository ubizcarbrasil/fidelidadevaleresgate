/**
 * Hook stub para buscar conquistas do motorista.
 * Preparado para ser montado em telas futuras de perfil/medalhas.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Achievement } from "./tipos_gamificacao_futura";

export function useConquistasMotorista(customerId: string | undefined) {
  return useQuery<Achievement[]>({
    queryKey: ["driver-achievements", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driver_achievements")
        .select("*")
        .eq("customer_id", customerId!)
        .order("achieved_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        customerId: row.customer_id,
        achievementKey: row.achievement_key,
        achievementLabel: row.achievement_label,
        iconName: row.icon_name ?? "Trophy",
        achievedAt: row.achieved_at,
        metadataJson: (row.metadata_json as Record<string, unknown>) ?? {},
      }));
    },
  });
}
