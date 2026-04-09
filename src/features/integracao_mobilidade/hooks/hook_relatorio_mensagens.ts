import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResumoMensagens {
  total: number;
  enviadas: number;
  falhas: number;
  ignoradas: number;
  taxaSucesso: number;
}

export interface EnvioPorDia {
  dia: string;
  enviadas: number;
  falhas: number;
  ignoradas: number;
}

export interface EnvioPorEvento {
  evento: string;
  total: number;
}

export function useRelatorioMensagens(brandId: string) {
  const resumoQuery = useQuery({
    queryKey: ["driver-message-logs-resumo", brandId],
    queryFn: async (): Promise<ResumoMensagens> => {
      const { data, error } = await supabase
        .from("driver_message_logs")
        .select("status")
        .eq("brand_id", brandId);

      if (error) throw error;
      const rows = data || [];

      const enviadas = rows.filter((r) => r.status === "sent").length;
      const falhas = rows.filter((r) => r.status === "failed").length;
      const ignoradas = rows.filter((r) => r.status === "skipped").length;
      const total = rows.length;

      return {
        total,
        enviadas,
        falhas,
        ignoradas,
        taxaSucesso: total > 0 ? Math.round((enviadas / total) * 100) : 0,
      };
    },
    enabled: !!brandId,
  });

  const porDiaQuery = useQuery({
    queryKey: ["driver-message-logs-por-dia", brandId],
    queryFn: async (): Promise<EnvioPorDia[]> => {
      const { data, error } = await supabase
        .from("driver_message_logs")
        .select("status, created_at")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const map = new Map<string, { enviadas: number; falhas: number; ignoradas: number }>();
      for (const row of data || []) {
        const dia = row.created_at?.slice(0, 10) || "unknown";
        const entry = map.get(dia) || { enviadas: 0, falhas: 0, ignoradas: 0 };
        if (row.status === "sent") entry.enviadas++;
        else if (row.status === "failed") entry.falhas++;
        else if (row.status === "skipped") entry.ignoradas++;
        map.set(dia, entry);
      }

      return Array.from(map.entries()).map(([dia, v]) => ({ dia, ...v }));
    },
    enabled: !!brandId,
  });

  const porEventoQuery = useQuery({
    queryKey: ["driver-message-logs-por-evento", brandId],
    queryFn: async (): Promise<EnvioPorEvento[]> => {
      const { data, error } = await supabase
        .from("driver_message_logs")
        .select("event_type")
        .eq("brand_id", brandId);

      if (error) throw error;

      const map = new Map<string, number>();
      for (const row of data || []) {
        const evento = row.event_type || "DESCONHECIDO";
        map.set(evento, (map.get(evento) || 0) + 1);
      }

      return Array.from(map.entries())
        .map(([evento, total]) => ({ evento, total }))
        .sort((a, b) => b.total - a.total);
    },
    enabled: !!brandId,
  });

  return {
    resumo: resumoQuery.data,
    porDia: porDiaQuery.data || [],
    porEvento: porEventoQuery.data || [],
    isLoading: resumoQuery.isLoading || porDiaQuery.isLoading || porEventoQuery.isLoading,
  };
}
