import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";
import { useNavigate } from "react-router-dom";

interface TaskItem {
  label: string;
  count: number;
  icon: any;
  statusClass: string;
  statusLabel: string;
  href: string;
}

export default function TasksSection() {
  const navigate = useNavigate();
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  // Reaproveita a query do sidebar — evita 4 contagens duplicadas no boot.
  const badges = useSidebarBadges();
  const pendingRedemptions = badges["sidebar.resgates"];
  const pendingStores = badges["sidebar.parceiros"];
  const pendingRules = badges["sidebar.aprovar_regras"];

  const { data: pendingReports } = useQuery({
    queryKey: ["tasks-pending-reports-count", currentBrandId ?? "global"],
    queryFn: async () => {
      const { count } = await supabase.from("offer_reports").select("*", { count: "exact", head: true }).eq("status", "pending");
      return count || 0;
    },
    staleTime: 2 * 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const isLoading = !currentBrandId && !isRootAdmin;

  const tasks: TaskItem[] = [
    ...(pendingRedemptions && pendingRedemptions > 0 ? [{
      label: "Resgates pendentes de validação",
      count: pendingRedemptions,
      icon: Clock,
      statusClass: "saas-badge-warning",
      statusLabel: "Pendente",
      href: "/redemptions",
    }] : []),
    ...(pendingStores && pendingStores > 0 ? [{
      label: "Parceiros aguardando aprovação",
      count: pendingStores,
      icon: AlertTriangle,
      statusClass: "saas-badge-warning",
      statusLabel: "Pendente",
      href: "/stores",
    }] : []),
    ...(pendingRules && pendingRules > 0 ? [{
      label: "Regras de pontuação para aprovar",
      count: pendingRules,
      icon: Zap,
      statusClass: "saas-badge-info",
      statusLabel: "Em análise",
      href: "/approve-store-rules",
    }] : []),
    ...(pendingReports && pendingReports > 0 ? [{
      label: "Denúncias de ofertas pendentes",
      count: pendingReports,
      icon: AlertTriangle,
      statusClass: "saas-badge-warning",
      statusLabel: "Pendente",
      href: "/offer-governance",
    }] : []),
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 text-xs font-medium text-muted-foreground">Tarefa</th>
                <th className="text-center py-2.5 text-xs font-medium text-muted-foreground">Qtd</th>
                <th className="text-right py-2.5 text-xs font-medium text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-accent/20 transition-colors">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <t.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium">{t.label}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center">
                    <Badge variant="destructive" className="text-[10px] px-1.5">{t.count}</Badge>
                  </td>
                  <td className="py-2.5 text-right">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate(t.href)}>
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
