import { useCrmAnalytics } from "@/hooks/useCrmAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Users, UserX, Target, TrendingUp, Sparkles, AlertTriangle, UserPlus } from "lucide-react";

export default function CrmDashboardPage() {
  const { summary, lostCustomers, atRiskCustomers, potentialCustomers, isLoading } = useCrmAnalytics();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold">CRM Estratégico</h2></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  const statusCards = [
    { label: "Ativos", value: summary.active + summary.newCustomers, icon: Users, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Em Risco", value: summary.atRisk, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Perdidos", value: summary.lost, icon: UserX, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Potenciais", value: potentialCustomers.length, icon: Target, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-2xl font-bold tracking-tight">CRM Estratégico</h2>
          <Badge variant="secondary" className="gap-1 text-xs"><Sparkles className="h-3 w-3" /> Integrado</Badge>
        </div>
        <p className="text-muted-foreground text-sm">Diagnóstico completo da sua base de clientes com dados reais do programa de fidelidade.</p>
      </div>

      {/* Health Score */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="flex items-center gap-6 py-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Saúde do Negócio</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-extrabold">{summary.healthScore}</span>
              <span className="text-muted-foreground text-sm mb-1">/100</span>
            </div>
            <Progress value={summary.healthScore} className="h-2" />
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Total de Clientes</p>
            <p className="text-2xl font-bold">{summary.total}</p>
            <p className="text-xs text-muted-foreground">Pts médio: {summary.avgPointsBalance}</p>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`h-12 w-12 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* At Risk */}
      {atRiskCustomers.length > 0 && (
        <Card className="border-amber-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Clientes em Risco ({atRiskCustomers.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {atRiskCustomers.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.days_inactive} dias sem atividade</p>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[10px]">Em risco</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Action Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer hover:border-destructive/40 transition-colors" onClick={() => navigate("/crm/lost")}>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <UserX className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">Clientes Perdidos</h3>
              <p className="text-xs text-muted-foreground">{summary.lost} clientes sem atividade há mais de 60 dias</p>
            </div>
            <Button size="sm" variant="outline">Ver lista</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/crm/potential")}>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">Clientes Potenciais</h3>
              <p className="text-xs text-muted-foreground">{potentialCustomers.length} clientes com pontos acumulados sem resgatar</p>
            </div>
            <Button size="sm" variant="outline">Ver lista</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
