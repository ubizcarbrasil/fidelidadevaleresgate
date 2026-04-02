import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BarChart3, Download, Users, Car, Coins } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BranchReportsPage() {
  const { currentBranchId } = useBrandGuard();
  const [exporting, setExporting] = useState<string | null>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["branch-reports-summary", currentBranchId],
    queryFn: async () => {
      if (!currentBranchId) return null;
      const { data } = await supabase.rpc("get_branch_dashboard_stats_v2", { p_branch_id: currentBranchId } as any);
      return data as any;
    },
    enabled: !!currentBranchId,
  });

  const exportMotoristas = async () => {
    if (!currentBranchId) return;
    setExporting("motoristas");
    try {
      const { data } = await supabase
        .from("customers")
        .select("name, cpf, phone, email, points_balance, is_active, created_at")
        .eq("branch_id", currentBranchId)
        .ilike("name", "%[MOTORISTA]%")
        .order("name")
        .limit(5000);
      if (!data || data.length === 0) { toast.info("Nenhum motorista encontrado."); return; }
      downloadCsv("motoristas.csv", ["Nome", "CPF", "Telefone", "Email", "Saldo Pontos", "Ativo", "Cadastro"], data.map((d: any) => [d.name, d.cpf || "", d.phone || "", d.email || "", String(d.points_balance), d.is_active ? "Sim" : "Não", new Date(d.created_at).toLocaleDateString("pt-BR")]));
      toast.success("Exportação concluída!");
    } catch { toast.error("Erro ao exportar."); } finally { setExporting(null); }
  };

  const exportCorridas = async () => {
    if (!currentBranchId) return;
    setExporting("corridas");
    try {
      const { data } = await supabase
        .from("machine_rides" as any)
        .select("driver_name, passenger_name, ride_value, driver_points_credited, finalized_at")
        .eq("branch_id", currentBranchId)
        .eq("ride_status", "FINALIZED")
        .order("finalized_at", { ascending: false })
        .limit(5000);
      if (!data || data.length === 0) { toast.info("Nenhuma corrida encontrada."); return; }
      downloadCsv("corridas.csv", ["Motorista", "Passageiro", "Valor", "Pontos", "Data"], (data as any[]).map((d) => [d.driver_name || "", d.passenger_name || "", String(d.ride_value || 0), String(d.driver_points_credited || 0), new Date(d.finalized_at).toLocaleDateString("pt-BR")]));
      toast.success("Exportação concluída!");
    } catch { toast.error("Erro ao exportar."); } finally { setExporting(null); }
  };

  const exportPedidos = async () => {
    if (!currentBranchId) return;
    setExporting("pedidos");
    try {
      const { data } = await supabase
        .from("product_redemption_orders")
        .select("customer_name, customer_cpf, points_spent, status, created_at")
        .eq("branch_id", currentBranchId)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (!data || data.length === 0) { toast.info("Nenhum pedido encontrado."); return; }
      downloadCsv("pedidos_resgate.csv", ["Cliente", "CPF", "Pontos", "Status", "Data"], data.map((d) => [d.customer_name || "", d.customer_cpf || "", String(d.points_spent), d.status, new Date(d.created_at).toLocaleDateString("pt-BR")]));
      toast.success("Exportação concluída!");
    } catch { toast.error("Erro ao exportar."); } finally { setExporting(null); }
  };

  if (!currentBranchId) {
    return <div className="p-6 text-center text-muted-foreground">Nenhuma cidade vinculada.</div>;
  }

  const reports = [
    { key: "motoristas", label: "Motoristas", icon: Users, description: "Lista de motoristas cadastrados com saldo e status.", action: exportMotoristas },
    { key: "corridas", label: "Corridas", icon: Car, description: "Corridas finalizadas com pontuação gerada.", action: exportCorridas },
    { key: "pedidos", label: "Pedidos de Resgate", icon: Coins, description: "Todos os pedidos de resgate da cidade.", action: exportPedidos },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Relatórios da Cidade</h1>
          <p className="text-xs text-muted-foreground">Exporte dados da sua operação em CSV</p>
        </div>
      </div>

      {/* Summary */}
      {isLoading ? (
        <Skeleton className="h-20 w-full rounded-lg" />
      ) : stats && (
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div><p className="text-lg font-bold">{Number(stats.drivers_total || 0).toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Motoristas</p></div>
              <div><p className="text-lg font-bold">{Number(stats.rides_total || 0).toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Corridas</p></div>
              <div><p className="text-lg font-bold">{formatPoints(Number(stats.points_total || 0))}</p><p className="text-xs text-muted-foreground">Pontos Distribuídos</p></div>
              <div><p className="text-lg font-bold">{Number(stats.redemptions_total || 0).toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Resgates</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <r.icon className="h-4 w-4 text-primary" /> {r.label}
              </CardTitle>
              <CardDescription className="text-xs">{r.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full gap-2" onClick={r.action} disabled={exporting === r.key}>
                <Download className="h-4 w-4" /> {exporting === r.key ? "Exportando..." : "Exportar CSV"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
