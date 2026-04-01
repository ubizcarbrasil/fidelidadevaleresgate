import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPoints } from "@/lib/formatPoints";
import { Car, Users, Coins, ShoppingBag, Wallet } from "lucide-react";

interface Props {
  branchId: string;
}

export default function BranchDashboardSection({ branchId }: Props) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["branch-dashboard-stats", branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_branch_dashboard_stats", { p_branch_id: branchId } as any);
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return {
        total_rides: Number(row?.total_rides ?? 0),
        total_drivers: Number(row?.total_drivers ?? 0),
        total_points_distributed: Number(row?.total_points_distributed ?? 0),
        total_redemptions: Number(row?.total_redemptions ?? 0),
        wallet_balance: Number(row?.wallet_balance ?? 0),
      };
    },
    enabled: !!branchId,
  });

  // Ranking motoristas da cidade
  const { data: ranking } = useQuery({
    queryKey: ["branch-driver-ranking", branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from("machine_rides" as any)
        .select("driver_name, driver_points_credited")
        .eq("branch_id", branchId)
        .eq("ride_status", "FINALIZED")
        .gt("driver_points_credited", 0)
        .order("driver_points_credited", { ascending: false })
        .limit(500);

      if (!data) return [];

      const byDriver: Record<string, number> = {};
      for (const r of data as any[]) {
        const name = r.driver_name || "Motorista";
        byDriver[name] = (byDriver[name] || 0) + Number(r.driver_points_credited || 0);
      }

      return Object.entries(byDriver)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, points], i) => ({ position: i + 1, name, points }));
    },
    enabled: !!branchId,
  });

  const kpis = [
    { label: "Corridas Realizadas", value: stats?.total_rides, icon: Car, color: "text-blue-500" },
    { label: "Motoristas Ativos", value: stats?.total_drivers, icon: Users, color: "text-green-500" },
    { label: "Pontos Distribuídos", value: stats?.total_points_distributed, icon: Coins, color: "text-amber-500", format: true },
    { label: "Pedidos de Resgate", value: stats?.total_redemptions, icon: ShoppingBag, color: "text-purple-500" },
    { label: "Saldo Carteira", value: stats?.wallet_balance, icon: Wallet, color: "text-primary", format: true },
  ];

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3 px-4">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="flex items-center gap-2">
                  <kpi.icon className={`h-5 w-5 ${kpi.color} shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground truncate">{kpi.label}</p>
                    <p className="text-lg font-bold">
                      {kpi.format ? formatPoints(kpi.value ?? 0) : (kpi.value ?? 0).toLocaleString("pt-BR")}
                      {kpi.format && <span className="text-xs font-normal text-muted-foreground ml-1">pts</span>}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ranking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">🏆 Ranking Motoristas da Cidade</CardTitle>
        </CardHeader>
        <CardContent>
          {!ranking || ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum motorista pontuado ainda.</p>
          ) : (
            <div className="divide-y divide-border">
              {ranking.map((r) => (
                <div key={r.name} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground w-6">{r.position}º</span>
                    <span className="text-sm font-medium truncate">{r.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{formatPoints(r.points)} pts</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
