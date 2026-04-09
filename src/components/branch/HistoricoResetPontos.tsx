import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPoints } from "@/lib/formatPoints";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Users, Car, User, UserCheck } from "lucide-react";

interface Props {
  branchId: string;
}

interface ResetEvent {
  timestamp: string;
  scope: string;
  affectedCount: number;
  totalPoints: number;
}

function parseScopeFromReason(reason: string): { label: string; icon: React.ReactNode } {
  if (reason.includes("todos")) return { label: "Todos", icon: <Users className="h-3.5 w-3.5" /> };
  if (reason.includes("motoristas")) return { label: "Motoristas", icon: <Car className="h-3.5 w-3.5" /> };
  if (reason.includes("clientes")) return { label: "Clientes", icon: <User className="h-3.5 w-3.5" /> };
  if (reason.includes("específico") || reason.includes("CPF")) return { label: "Específico", icon: <UserCheck className="h-3.5 w-3.5" /> };
  return { label: "Reset", icon: <Users className="h-3.5 w-3.5" /> };
}

export default function HistoricoResetPontos({ branchId }: Props) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["reset-history", branchId],
    queryFn: async () => {
      if (!branchId) return [];

      const { data, error } = await supabase
        .from("points_ledger")
        .select("created_at, points_amount, reason")
        .eq("branch_id", branchId)
        .eq("reference_type", "BRANCH_RESET")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Group by timestamp (within 5-second windows = same batch)
      const grouped: ResetEvent[] = [];
      let currentGroup: { timestamp: string; reason: string; count: number; total: number } | null = null;

      for (const row of data) {
        const ts = new Date(row.created_at).getTime();
        if (currentGroup && Math.abs(ts - new Date(currentGroup.timestamp).getTime()) < 5000) {
          currentGroup.count++;
          currentGroup.total += Number(row.points_amount || 0);
        } else {
          if (currentGroup) {
            grouped.push({
              timestamp: currentGroup.timestamp,
              scope: currentGroup.reason,
              affectedCount: currentGroup.count,
              totalPoints: currentGroup.total,
            });
          }
          currentGroup = {
            timestamp: row.created_at,
            reason: row.reason || "",
            count: 1,
            total: Number(row.points_amount || 0),
          };
        }
      }
      if (currentGroup) {
        grouped.push({
          timestamp: currentGroup.timestamp,
          scope: currentGroup.reason,
          affectedCount: currentGroup.count,
          totalPoints: currentGroup.total,
        });
      }

      return grouped.slice(0, 20);
    },
    enabled: !!branchId,
  });

  if (isLoading) {
    return <p className="text-xs text-muted-foreground py-2">Carregando histórico...</p>;
  }

  if (events.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2 text-center">
        Nenhum reset realizado nesta cidade.
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {events.map((evt, i) => {
        const { label, icon } = parseScopeFromReason(evt.scope);
        return (
          <div
            key={i}
            className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30 text-sm"
          >
            <div className="h-7 w-7 rounded-md bg-destructive/10 flex items-center justify-center shrink-0 text-destructive">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{label}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(evt.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-destructive">
                -{formatPoints(evt.totalPoints)} pts
              </p>
              <p className="text-[10px] text-muted-foreground">
                {evt.affectedCount} registro(s)
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
