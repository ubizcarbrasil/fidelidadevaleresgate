import { useCrmAnalytics } from "@/hooks/useCrmAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Crown, BarChart3, Users } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function CrmParetoPage() {
  const { paretoCustomers, paretoCount, paretoPercentage, paretoEarningsTotal, totalEarningsAll, allCustomers, isLoading } = useCrmAnalytics();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-[400px]" /></div>;
  }

  // Build cumulative distribution data
  const sorted = [...allCustomers].sort((a, b) => b.total_earnings - a.total_earnings);
  const cumulativeData = sorted.reduce<{ index: number; pctCustomers: number; pctEarnings: number }[]>((acc, c, i) => {
    const prevEarnings = acc.length > 0 ? acc[acc.length - 1].pctEarnings : 0;
    const pctEarnings = totalEarningsAll > 0 ? Math.round(((prevEarnings * totalEarningsAll / 100) + c.total_earnings) / totalEarningsAll * 100) : 0;
    if (i % Math.max(1, Math.floor(sorted.length / 30)) === 0 || i === sorted.length - 1) {
      acc.push({ index: i + 1, pctCustomers: Math.round(((i + 1) / sorted.length) * 100), pctEarnings });
    }
    return acc;
  }, []);

  const avgPareto = paretoCustomers.length > 0 ? Math.round(paretoCustomers.reduce((s, c) => s + c.total_earnings, 0) / paretoCustomers.length) : 0;

  const summaryCards = [
    { label: "Grupo Pareto (20%)", value: paretoCount, icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "% das Pontuações", value: `${paretoPercentage}%`, icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
    { label: "Freq. Média Pareto", value: avgPareto, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Total Base", value: allCustomers.length, icon: Users, color: "text-muted-foreground", bg: "bg-muted/50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/crm")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-500" /> Análise Pareto (80/20)
          </h2>
          <p className="text-sm text-muted-foreground">Os top {paretoCount} clientes geram {paretoPercentage}% das pontuações</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`h-10 w-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cumulativeData.length > 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição Acumulada</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="pctCustomers" tickFormatter={v => `${v}%`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} formatter={(v: any) => `${v}%`} labelFormatter={v => `Top ${v}% clientes`} />
                <Area type="monotone" dataKey="pctEarnings" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" name="% Pontuações" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" /> Top Clientes Pareto
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Pontuações</TableHead>
                <TableHead>Resgates</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paretoCustomers.slice(0, 50).map((c, i) => (
                <TableRow key={c.id}>
                  <TableCell className="font-bold text-amber-500">{i + 1}</TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.phone || "—"}</p>
                  </TableCell>
                  <TableCell className="font-bold">{c.total_earnings}</TableCell>
                  <TableCell>{c.total_redemptions}</TableCell>
                  <TableCell>{c.points_balance}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "lost" ? "destructive" : "secondary"} className="text-[10px]">
                      {c.status === "active" ? "Ativo" : c.status === "new" ? "Novo" : c.status === "at_risk" ? "Em risco" : "Perdido"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
