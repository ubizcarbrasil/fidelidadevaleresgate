import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import type { RelatorioCidadeRow } from "../types/tipos_relatorio_corridas";

export function useRelatorioCorridas() {
  const { currentBrandId } = useBrandGuard();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["relatorio-corridas-cidades", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return [];
      const { data, error } = await supabase.rpc("get_rides_report_by_branch", {
        p_brand_id: currentBrandId,
      } as any);
      if (error) throw error;
      return (data as unknown as RelatorioCidadeRow[]) || [];
    },
    enabled: !!currentBrandId,
  });

  const totais = rows.reduce(
    (acc, r) => ({
      rides: acc.rides + r.total_rides,
      value: acc.value + r.total_ride_value,
      driverPts: acc.driverPts + r.total_driver_points,
      clientPts: acc.clientPts + r.total_client_points,
      drivers: acc.drivers + r.total_drivers,
      currentMonth: acc.currentMonth + r.rides_current_month,
      prevMonth: acc.prevMonth + r.rides_prev_month,
    }),
    { rides: 0, value: 0, driverPts: 0, clientPts: 0, drivers: 0, currentMonth: 0, prevMonth: 0 },
  );

  return { rows, isLoading, totais, currentBrandId };
}
