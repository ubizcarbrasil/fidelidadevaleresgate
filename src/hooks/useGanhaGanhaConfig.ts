import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export interface GanhaGanhaConfig {
  id: string;
  brand_id: string;
  is_active: boolean;
  fee_per_point_earned: number;
  fee_per_point_redeemed: number;
  fee_mode: "UNIFORM" | "CUSTOM";
}

export function useGanhaGanhaConfig() {
  const { currentBrandId } = useBrandGuard();

  const { data: config, isLoading, refetch } = useQuery({
    queryKey: ["ganha-ganha-config", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ganha_ganha_config")
        .select("*")
        .eq("brand_id", currentBrandId!)
        .maybeSingle();
      if (error) throw error;
      return data as GanhaGanhaConfig | null;
    },
    enabled: !!currentBrandId,
  });

  return { config, isLoading, refetch, isActive: config?.is_active ?? false };
}
