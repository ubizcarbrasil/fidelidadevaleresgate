import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PreviewParams {
  branchId: string;
  brandId: string;
  onlyActive: boolean;
  minRides: number;
  initialPoints: number;
}

/**
 * Calcula quantos motoristas seriam afetados no próximo reset,
 * baseado nos critérios atuais (sem persistir nada).
 */
export function usePreviewReset(p: PreviewParams) {
  return useQuery({
    queryKey: ["duelo-preview-reset", p.branchId, p.onlyActive, p.minRides, p.initialPoints],
    enabled: !!p.branchId && !!p.brandId,
    queryFn: async () => {
      let q = supabase
        .from("customers")
        .select("id", { count: "exact" })
        .eq("branch_id", p.branchId)
        .eq("brand_id", p.brandId)
        .ilike("name", "%[MOTORISTA]%");
      if (p.onlyActive) q = q.eq("is_active", true);

      const { data, count, error } = await q.limit(5000);
      if (error) throw error;

      let elegiveis = count ?? data?.length ?? 0;

      if (p.minRides > 0 && data && data.length > 0) {
        const ids = data.map((d: any) => d.id);
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const { data: rides } = await supabase
          .from("machine_rides")
          .select("driver_customer_id")
          .in("driver_customer_id", ids)
          .gte("finalized_at", since.toISOString());
        const counts = new Map<string, number>();
        (rides ?? []).forEach((r: any) => {
          if (!r.driver_customer_id) return;
          counts.set(r.driver_customer_id, (counts.get(r.driver_customer_id) ?? 0) + 1);
        });
        elegiveis = ids.filter((id: string) => (counts.get(id) ?? 0) >= p.minRides).length;
      }

      return {
        elegiveis,
        totalDistribuido: elegiveis * (p.initialPoints || 0),
      };
    },
  });
}