import { useState } from "react";
import { useCrmAnalytics } from "@/hooks/useCrmAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Target, Zap, UserPlus } from "lucide-react";

export default function CrmPotentialCustomersPage() {
  const { potentialCustomers, highFrequency, newCustomers, isLoading } = useCrmAnalytics();
  const [tab, setTab] = useState("potential");
  const navigate = useNavigate();

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const lists = {
    potential: potentialCustomers,
    frequency: highFrequency,
    new: newCustomers,
  };

  const current = lists[tab as keyof typeof lists] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/crm")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" /> Clientes Potenciais
          </h2>
          <p className="text-sm text-muted-foreground">Identifique oportunidades de crescimento na sua base</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="potential" className="gap-1.5">
            <Target className="h-3.5 w-3.5" /> Pontos sem Resgate ({potentialCustomers.length})
          </TabsTrigger>
          <TabsTrigger value="frequency" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Alta Frequência ({highFrequency.length})
          </TabsTrigger>
          <TabsTrigger value="new" className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Novos ({newCustomers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <Card>
            <CardContent className="p-0">
              {current.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">Nenhum cliente encontrado nesta categoria.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      {tab === "potential" && <TableHead>Saldo Pontos</TableHead>}
                      {tab === "frequency" && <TableHead>Total Pontuações</TableHead>}
                      {tab === "new" && <TableHead>Cadastro</TableHead>}
                      <TableHead>Total Resgates</TableHead>
                      <TableHead>Dias Inativo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {current.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.phone || c.cpf || "—"}</p>
                          </div>
                        </TableCell>
                        {tab === "potential" && <TableCell className="font-bold text-primary">{c.points_balance}</TableCell>}
                        {tab === "frequency" && <TableCell className="font-bold">{c.total_earnings}</TableCell>}
                        {tab === "new" && <TableCell className="text-sm">{formatDate(c.created_at)}</TableCell>}
                        <TableCell className="text-sm">{c.total_redemptions}</TableCell>
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
