import { useState } from "react";
import { useCrmAnalytics, CrmCustomer } from "@/hooks/useCrmAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserX, Flame, Snowflake, UserMinus, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type InactiveFilter = "30" | "60" | "90" | "all";

export default function CrmLostCustomersPage() {
  const { lostCustomers, atRiskCustomers, criticalScenario, isLoading } = useCrmAnalytics();
  const [filter, setFilter] = useState<InactiveFilter>("all");
  const navigate = useNavigate();

  const allInactive = [...atRiskCustomers, ...lostCustomers];

  const filtered = filter === "all"
    ? allInactive
    : allInactive.filter((c) => {
        if (filter === "30") return c.days_inactive >= 30 && c.days_inactive < 60;
        if (filter === "60") return c.days_inactive >= 60 && c.days_inactive < 90;
        return c.days_inactive >= 90;
      });

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório - Clientes Perdidos", 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [["Nome", "Dias Inativo", "Última Pontuação", "Último Resgate", "Pontos", "Status"]],
      body: filtered.map(c => [c.name, c.days_inactive, formatDate(c.last_earning_at), formatDate(c.last_redemption_at), c.points_balance, c.status === "lost" ? "Perdido" : "Em risco"]),
    });
    doc.save("clientes-perdidos.pdf");
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-[400px]" /></div>;
  }

  const buckets = [
    { label: "Morno (30-45d)", count: criticalScenario.warm.length, icon: Flame, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Frio (45-60d)", count: criticalScenario.cold.length, icon: Snowflake, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Perdido (60-90d)", count: criticalScenario.lost60.length, icon: UserMinus, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Crítico (90+d)", count: criticalScenario.lost90.length, icon: UserX, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/crm")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserX className="h-6 w-6 text-destructive" /> Clientes Perdidos & Em Risco
          </h2>
          <p className="text-sm text-muted-foreground">{allInactive.length} clientes sem atividade recente</p>
        </div>
      </div>

      {/* Bucket cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {buckets.map((b) => (
          <Card key={b.label}>
            <CardContent className="py-4 text-center">
              <b.icon className={`h-5 w-5 mx-auto mb-1 ${b.color}`} />
              <p className={`text-2xl font-bold ${b.color}`}>{b.count}</p>
              <p className="text-[10px] text-muted-foreground">{b.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={filter} onValueChange={(v) => setFilter(v as InactiveFilter)}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os inativos</SelectItem>
            <SelectItem value="30">30–59 dias (em risco)</SelectItem>
            <SelectItem value="60">60–89 dias (perdidos)</SelectItem>
            <SelectItem value="90">90+ dias (crítico)</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filtered.length} resultados</Badge>
        <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1.5 ml-auto">
          <Download className="h-3.5 w-3.5" /> Exportar PDF
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Nenhum cliente inativo encontrado neste filtro. 🎉</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Dias Inativo</TableHead>
                  <TableHead>Última Pontuação</TableHead>
                  <TableHead>Último Resgate</TableHead>
                  <TableHead>Saldo Pontos</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone || c.cpf || "—"}</p>
                    </TableCell>
                    <TableCell>
                      <span className={c.days_inactive >= 90 ? "text-destructive font-bold" : c.days_inactive >= 60 ? "text-destructive" : "text-amber-500"}>
                        {c.days_inactive} dias
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(c.last_earning_at)}</TableCell>
                    <TableCell className="text-sm">{formatDate(c.last_redemption_at)}</TableCell>
                    <TableCell className="text-sm font-medium">{c.points_balance}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "lost" ? "destructive" : "outline"} className="text-[10px]">
                        {c.status === "lost" ? "Perdido" : "Em risco"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
