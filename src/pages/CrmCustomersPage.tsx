import { useState, useMemo } from "react";
import { useCrmAnalytics, CrmCustomer } from "@/hooks/useCrmAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Search, Download, ArrowUpDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  at_risk: "Em risco",
  lost: "Perdido",
  new: "Novo",
};

type SortKey = "name" | "points_balance" | "days_inactive" | "total_earnings" | "total_redemptions";

export default function CrmCustomersPage() {
  const { allCustomers, isLoading } = useCrmAnalytics();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedCustomer, setSelectedCustomer] = useState<CrmCustomer | null>(null);

  const filtered = useMemo(() => {
    let list = allCustomers;
    if (statusFilter !== "all") list = list.filter(c => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.phone?.includes(q) || c.cpf?.includes(q));
    }
    list = [...list].sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? (Number(av) - Number(bv)) : (Number(bv) - Number(av));
    });
    return list;
  }, [allCustomers, statusFilter, search, sortBy, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("asc"); }
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório CRM - Clientes", 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [["Nome", "Status", "Pontos", "Dias Inativo", "Pontuações", "Resgates"]],
      body: filtered.map(c => [c.name, STATUS_LABELS[c.status], c.points_balance, c.days_inactive, c.total_earnings, c.total_redemptions]),
    });
    doc.save("crm-clientes.pdf");
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-[400px]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/crm")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Clientes CRM
          </h2>
          <p className="text-sm text-muted-foreground">{allCustomers.length} clientes na base</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, telefone ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="new">Novos</SelectItem>
            <SelectItem value="at_risk">Em risco</SelectItem>
            <SelectItem value="lost">Perdidos</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> Exportar PDF
        </Button>
        <Badge variant="secondary">{filtered.length} resultados</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Nenhum cliente encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                    <span className="flex items-center gap-1">Cliente <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("points_balance")}>
                    <span className="flex items-center gap-1">Pontos <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("total_earnings")}>
                    <span className="flex items-center gap-1">Pontuações <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("total_redemptions")}>
                    <span className="flex items-center gap-1">Resgates <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("days_inactive")}>
                    <span className="flex items-center gap-1">Dias Inativo <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((c) => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedCustomer(c)}>
                    <TableCell>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone || c.cpf || "—"}</p>
                    </TableCell>
                    <TableCell className="font-medium">{c.points_balance}</TableCell>
                    <TableCell>{c.total_earnings}</TableCell>
                    <TableCell>{c.total_redemptions}</TableCell>
                    <TableCell>
                      <span className={c.days_inactive >= 60 ? "text-destructive font-bold" : c.days_inactive >= 30 ? "text-amber-500" : ""}>{c.days_inactive}d</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "lost" ? "destructive" : c.status === "at_risk" ? "outline" : "secondary"} className="text-[10px]">
                        {STATUS_LABELS[c.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filtered.length > 100 && <p className="text-xs text-muted-foreground text-center py-3">Mostrando 100 de {filtered.length}. Use os filtros para refinar.</p>}
        </CardContent>
      </Card>

      {/* Customer Detail Drawer */}
      <Sheet open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedCustomer && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedCustomer.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Pontos</p>
                    <p className="text-lg font-bold text-primary">{selectedCustomer.points_balance}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Saldo R$</p>
                    <p className="text-lg font-bold">R$ {selectedCustomer.money_balance.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Total Pontuações</p>
                    <p className="text-lg font-bold">{selectedCustomer.total_earnings}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Total Resgates</p>
                    <p className="text-lg font-bold">{selectedCustomer.total_redemptions}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Telefone</span><span>{selectedCustomer.phone || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">CPF</span><span>{selectedCustomer.cpf || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cadastro</span><span>{formatDate(selectedCustomer.created_at)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Última Pontuação</span><span>{formatDate(selectedCustomer.last_earning_at)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Último Resgate</span><span>{formatDate(selectedCustomer.last_redemption_at)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Dias Inativo</span><span className={selectedCustomer.days_inactive >= 60 ? "text-destructive font-bold" : ""}>{selectedCustomer.days_inactive} dias</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><Badge variant={selectedCustomer.status === "lost" ? "destructive" : "secondary"} className="text-[10px]">{STATUS_LABELS[selectedCustomer.status]}</Badge></div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
