import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NotificacaoMotorista {
  id: string;
  machine_ride_id: string;
  customer_name: string | null;
  driver_name: string | null;
  points_credited: number;
  ride_value: number;
  finalized_at: string;
  created_at: string;
  branch_id: string | null;
  status: "success" | "error";
  error_message?: string;
  error_details?: Record<string, unknown>;
}

export function useHistoricoNotificacoesMotorista(brandId: string | null) {
  return useQuery({
    queryKey: ["historico-notificacoes-motorista", brandId],
    enabled: !!brandId,
    queryFn: async (): Promise<NotificacaoMotorista[]> => {
      if (!brandId) return [];

      // Fetch successful notifications
      const { data: successes, error: errSucc } = await (supabase as any)
        .from("machine_ride_notifications")
        .select("id, machine_ride_id, customer_name, driver_name, points_credited, ride_value, finalized_at, created_at, branch_id")
        .eq("brand_id", brandId)
        .eq("notification_type", "DRIVER")
        .order("created_at", { ascending: false })
        .limit(100);

      if (errSucc) throw errSucc;

      // Fetch errors
      const { data: errors, error: errLog } = await (supabase as any)
        .from("error_logs")
        .select("id, message, metadata_json, created_at, brand_id")
        .eq("source", "notify-driver-points")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (errLog) throw errLog;

      const successRows: NotificacaoMotorista[] = (successes || []).map((s: any) => ({
        id: s.id,
        machine_ride_id: s.machine_ride_id,
        customer_name: s.customer_name,
        driver_name: s.driver_name,
        points_credited: s.points_credited,
        ride_value: s.ride_value,
        finalized_at: s.finalized_at,
        created_at: s.created_at,
        branch_id: s.branch_id,
        status: "success" as const,
      }));

      const errorRows: NotificacaoMotorista[] = (errors || []).map((e: any) => ({
        id: e.id,
        machine_ride_id: e.metadata_json?.machine_ride_id || "—",
        customer_name: null,
        driver_name: e.metadata_json?.driver_id ? `Motorista #${e.metadata_json.driver_id}` : null,
        points_credited: 0,
        ride_value: 0,
        finalized_at: e.created_at,
        created_at: e.created_at,
        branch_id: null,
        status: "error" as const,
        error_message: e.message,
        error_details: e.metadata_json,
      }));

      return [...successRows, ...errorRows].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    refetchInterval: 30_000,
  });
}
