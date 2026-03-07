import { useState } from "react";
import { useCrmAnalytics } from "@/hooks/useCrmAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Target, Zap, UserPlus, Crown } from "lucide-react";

export default function CrmPotentialCustomersPage() {
  const { potentialCustomers, highFrequency, newCustomers, paretoCustomers, isLoading } = useCrmAnalytics();
  const [tab, setTab] = useState("potential");
  const navigate = useNavigate();

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-[400px]" /></div>;
  }

  const tabs = [
    { key: "potential", label: "Pontos sem Resgate", icon: Target, count: potentialCustomers.length, customers: potentialCustomers },
    { key: "frequency", label: "Alta Frequência", icon: Zap, count: highFrequency.length, customers: highFrequency },
    { key: "new", label: "Novos", icon: UserPlus, count: newCustomers.length, customers: newCustomers },
    { key: "pareto", label: "Pareto Top 20%", icon: Crown, count: paretoCustomers.length, customers: paretoCustomers },
  ];

  const currentTab = tabs.find(t => t.key === tab) || tabs[0];

  const metrics = [
    { label: "Sem Resgate", value: potentialCustomers.length, color: "text-primary" },
    { label: "Alta Freq.", value: highFrequency.length, color: "text-amber-500" },
    { label: "Novos", value: newCustomers.length, color: "text-green-500" },
    { label: "Pareto", value: paretoCustomers.length, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/crm")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" /> Clientes Potenciais
          </h2>
          <p className="text-sm text-muted-foreground">Identifique oportunidades de crescimento na sua base</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {metrics.map(m => (
          <Card key={m.label}>
            <CardContent className="py-3 text-center">
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {tabs.map(t => (
            <TabsTrigger key={t.key} value={t.key} className="gap-1.5">
              <t.icon className="h-3.5 w-3.5" /> {t.label} ({t.count})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab}>
          <Card>
            <CardContent className="p-0">
              {currentTab.customers.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">Nenhum cliente encontrado nesta categoria.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Pontos</TableHead>
                      <TableHead>Pontuações</TableHead>
                      <TableHead>Resgates</TableHead>
                      <TableHead>Dias Inativo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTab.customers.slice(0, 50).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.phone || c.cpf || "—"}</p>
                        </TableCell>
                        <TableCell className="font-bold text-primary">{c.points_balance}</TableCell>
                        <TableCell>{c.total_earnings}</TableCell>
                        <TableCell>{c.total_redemptions}</TableCell>
                        <TableCell className="text-sm">{c.days_inactive} dias</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {c.status === "new" ? "Novo" : c.status === "active" ? "Ativo" : c.status === "at_risk" ? "Em risco" : "Perdido"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
