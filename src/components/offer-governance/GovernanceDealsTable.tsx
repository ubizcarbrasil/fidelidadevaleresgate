import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchGovernanceDeals, bulkArchiveDeals, bulkDeactivateDeals, bulkUpdateDealStatus,
  STATUS_LABELS, type SourceSystem, type GovernanceDealFilters,
} from "@/lib/api/offerGovernance";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Archive, Power, RefreshCw, Search } from "lucide-react";

interface Props {
  brandId: string;
  origin: SourceSystem;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  suspected_outdated: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  user_reported: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  removed_from_source: "bg-red-500/15 text-red-400 border-red-500/30",
  sync_error: "bg-destructive/15 text-destructive border-destructive/30",
  archived: "bg-muted text-muted-foreground border-border",
  inactive: "bg-muted text-muted-foreground border-border",
};

export default function GovernanceDealsTable({ brandId, origin }: Props) {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("all");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const filters: GovernanceDealFilters = {
    brandId,
    origin,
    status: statusFiltro !== "all" ? statusFiltro : undefined,
    search: busca || undefined,
  };

  const { data: deals, isLoading } = useQuery({
    queryKey: ["governance-deals", filters],
    queryFn: () => fetchGovernanceDeals(filters),
  });

  const toggleSelecionado = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    if (!deals) return;
    if (selecionados.size === deals.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(deals.map((d: any) => d.id)));
    }
  };

  const handleBulkAction = async (action: "archive" | "deactivate" | "reactivate") => {
    const ids = Array.from(selecionados);
    if (ids.length === 0) return toast.error("Selecione pelo menos uma oferta");

    try {
      if (action === "archive") await bulkArchiveDeals(ids);
      else if (action === "deactivate") await bulkDeactivateDeals(ids);
      else await bulkUpdateDealStatus(ids, "active", true);

      toast.success(`${ids.length} ofertas atualizadas`);
      setSelecionados(new Set());
      queryClient.invalidateQueries({ queryKey: ["governance"] });
    } catch {
      toast.error("Erro ao executar ação em massa");
    }
  };

  const formatPreco = (val: number | null) =>
    val != null ? Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar oferta..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ações em massa */}
      {selecionados.size > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <span className="text-sm text-muted-foreground">{selecionados.size} selecionada(s)</span>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction("deactivate")}>
            <Power className="h-3.5 w-3.5 mr-1" /> Desativar
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction("archive")}>
            <Archive className="h-3.5 w-3.5 mr-1" /> Arquivar
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction("reactivate")}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reativar
          </Button>
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={!!deals?.length && selecionados.size === deals.length}
                  onCheckedChange={toggleTodos}
                />
              </TableHead>
              <TableHead>Oferta</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Loja</TableHead>
              <TableHead>Última Sync</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
              ))
            ) : !deals?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma oferta encontrada
                </TableCell>
              </TableRow>
            ) : (
              deals.map((deal: any) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <Checkbox
                      checked={selecionados.has(deal.id)}
                      onCheckedChange={() => toggleSelecionado(deal.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 max-w-[300px]">
                      {deal.image_url && (
                        <img src={deal.image_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                      )}
                      <span className="truncate text-sm font-medium">{deal.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatPreco(deal.price)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[deal.current_status] || ""}>
                      {STATUS_LABELS[deal.current_status] || deal.current_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{deal.store_name || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {deal.last_synced_at ? new Date(deal.last_synced_at).toLocaleString("pt-BR") : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
