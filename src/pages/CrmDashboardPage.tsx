import { useCrmAnalytics } from "@/hooks/useCrmAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Users, UserX, Target, TrendingUp, Sparkles, AlertTriangle, UserPlus, Flame, Snowflake, UserMinus, ShoppingBag } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(142 76% 36%)", "hsl(38 92% 50%)"];

export default function CrmDashboardPage() {
  const { summary, lostCustomers, atRiskCustomers, potentialCustomers, monthlyData, criticalScenario, journeyStages, isLoading } = useCrmAnalytics();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold">CRM Estratégico</h2></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  const statusCards = [
    { label: "Ativos", value: summary.active + summary.newCustomers, icon: Users, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Em Risco", value: summary.atRisk, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Perdidos", value: summary.lost, icon: UserX, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Potenciais", value: potentialCustomers.length, icon: Target, color: "text-primary", bg: "bg-primary/10" },
  ];

  const pieData = [
    { name: "Ativos", value: summary.active + summary.newCustomers },
    { name: "Em Risco", value: summary.atRisk },
    { name: "Perdidos", value: summary.lost },
  ].filter(d => d.value > 0);

  const criticalCards = [
    { label: "Morno (30-45d)", count: criticalScenario.warm.length, icon: Flame, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Frio (45-60d)", count: criticalScenario.cold.length, icon: Snowflake, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Perdido (60-90d)", count: criticalScenario.lost60.length, icon: UserMinus, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Crítico (90+d)", count: criticalScenario.lost90.length, icon: UserX, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Sem conversão", count: criticalScenario.neverConverted.length, icon: ShoppingBag, color: "text-muted-foreground", bg: "bg-muted/50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">CRM Estratégico</h2>
          <Badge variant="secondary" className="gap-1 text-xs"><Sparkles className="h-3 w-3" /> Integrado</Badge>
        </div>
        <p className="text-muted-foreground text-sm">Diagnóstico completo da sua base de clientes com dados reais do programa de fidelidade.</p>
      </div>

      {/* Health Score */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="flex flex-col sm:flex-row items-center gap-6 py-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 w-full">
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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evolução Mensal (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                  <Bar dataKey="earnings" name="Pontuações" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="redemptions" name="Resgates" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="newCustomers" name="Novos Clientes" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12 text-sm">Sem dados suficientes</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12 text-sm">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Critical Scenario */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Cenário Crítico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
            {criticalCards.map((c) => (
              <div key={c.label} className={`rounded-xl ${c.bg} p-4 text-center`}>
                <c.icon className={`h-5 w-5 mx-auto mb-1 ${c.color}`} />
                <p className={`text-xl font-bold ${c.color}`}>{c.count}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{c.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Clientes CRM", desc: "Base completa com busca e filtros", icon: Users, url: "/crm/customers", color: "text-primary", border: "hover:border-primary/40" },
          { title: "Oportunidades", desc: `${potentialCustomers.length} oportunidades detectadas`, icon: Target, url: "/crm/opportunities", color: "text-green-500", border: "hover:border-green-500/40" },
          { title: "Análise Pareto", desc: "Top 20% dos clientes", icon: TrendingUp, url: "/crm/pareto", color: "text-amber-500", border: "hover:border-amber-500/40" },
          { title: "Jornada", desc: "Funil de engajamento", icon: Sparkles, url: "/crm/journey", color: "text-primary", border: "hover:border-primary/40" },
        ].map((card) => (
          <Card key={card.title} className={`cursor-pointer transition-colors ${card.border}`} onClick={() => navigate(card.url)}>
            <CardContent className="flex items-center gap-3 py-4">
              <card.icon className={`h-5 w-5 ${card.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm">{card.title}</h3>
                <p className="text-[11px] text-muted-foreground truncate">{card.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
