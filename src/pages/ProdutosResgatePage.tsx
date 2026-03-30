import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { DataTableControls } from "@/components/DataTableControls";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, Coins, CheckCircle2, Save, Trash2, Loader2, ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import ModalAdicionarResgatavel from "./produtos_resgate/components/ModalAdicionarResgatavel";
import BotaoRecalcularPontos from "./produtos_resgate/components/BotaoRecalcularPontos";

const PAGE_SIZE = 20;

export default function ProdutosResgatePage() {
  const qc = useQueryClient();
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const { search, debouncedSearch, page, setPage, onSearchChange } = useDebouncedSearch();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCosts, setEditingCosts] = useState<Record<string, string>>({});
  const [batchCost, setBatchCost] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [modalAberto, setModalAberto] = useState(false);

  // ── Query ──
  const { data, isLoading } = useQuery({
    queryKey: ["produtos-resgate", debouncedSearch, page, currentBrandId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("affiliate_deals")
        .select("id, title, image_url, price, original_price, is_active, is_redeemable, redeem_points_cost, store_name", { count: "exact" })
        .eq("is_redeemable", true);

      if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);
      if (debouncedSearch) query = query.ilike("title", `%${debouncedSearch}%`);
      if (statusFilter === "active") query = query.eq("is_active", true);
      if (statusFilter === "inactive") query = query.eq("is_active", false);

      const from = (page - 1) * PAGE_SIZE;
      const { data, error, count } = await query.order("title").range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { items: data ?? [], total: count ?? 0 };
    },
    enabled: !!currentBrandId,
  });

  // ── KPIs ──
  const { data: kpis } = useQuery({
    queryKey: ["produtos-resgate-kpis", currentBrandId],
    queryFn: async () => {
      const base = supabase
        .from("affiliate_deals")
        .select("id, is_active, redeem_points_cost", { count: "exact" })
        .eq("is_redeemable", true);

      const query = !isRootAdmin && currentBrandId ? base.eq("brand_id", currentBrandId) : base;
      const { data, count } = await query;

      const ativos = data?.filter((d) => d.is_active).length ?? 0;
      const costs = data?.map((d) => d.redeem_points_cost).filter(Boolean) as number[];
      const minCost = costs.length ? Math.min(...costs) : 0;
      const maxCost = costs.length ? Math.max(...costs) : 0;

      return { total: count ?? 0, ativos, minCost, maxCost };
    },
    enabled: !!currentBrandId,
  });

  const items = data?.items ?? [];
  const isEmptyNoSearch = !isLoading && !items.length && !debouncedSearch && statusFilter === "all";

  const handleStatusFilter = (filter: "all" | "active" | "inactive") => {
    setStatusFilter(filter);
    setPage(1);
  };
  // ── Mutations ──
  const updateDeal = useMutation({
    mutationFn: async (payload: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from("affiliate_deals")
        .update(payload.updates as any)
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produtos-resgate"] });
      qc.invalidateQueries({ queryKey: ["produtos-resgate-kpis"] });
    },
  });

  const batchUpdate = useMutation({
    mutationFn: async (payload: { ids: string[]; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from("affiliate_deals")
        .update(payload.updates as any)
        .in("id", payload.ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produtos-resgate"] });
      qc.invalidateQueries({ queryKey: ["produtos-resgate-kpis"] });
      qc.invalidateQueries({ queryKey: ["affiliate-deals"] });
      setSelectedIds(new Set());
      setBatchCost("");
    },
  });

  // ── Handlers ──
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const handleToggleRedeemable = (id: string, current: boolean) => {
    updateDeal.mutate(
      { id, updates: { is_redeemable: !current } },
      {
        onSuccess: () => toast.success(!current ? "Resgate ativado" : "Resgate desativado"),
        onError: (e: Error) => toast.error(e.message),
      }
    );
  };

  const handleSaveCost = (id: string) => {
    const val = editingCosts[id];
    if (val === undefined) return;
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 0) {
      toast.error("Valor inválido");
      return;
    }
    updateDeal.mutate(
      { id, updates: { redeem_points_cost: num } },
      {
        onSuccess: () => {
          toast.success("Custo atualizado");
          setEditingCosts((prev) => {
            const n = { ...prev };
            delete n[id];
            return n;
          });
        },
        onError: (e: Error) => toast.error(e.message),
      }
    );
  };

  const handleBatchSetCost = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return toast.error("Selecione ao menos um item");
    const num = parseInt(batchCost, 10);
    if (isNaN(num) || num < 0) return toast.error("Valor inválido");
    batchUpdate.mutate(
      { ids, updates: { redeem_points_cost: num } },
      { onSuccess: () => toast.success(`Custo atualizado em ${ids.length} itens`) }
    );
  };

  const handleBatchRemoveRedeem = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return toast.error("Selecione ao menos um item");
    batchUpdate.mutate(
      { ids, updates: { is_redeemable: false } },
      { onSuccess: () => toast.success(`Resgate desativado em ${ids.length} itens`) }
    );
  };

  const formatPrice = (val: number | null | undefined) => {
    if (val == null) return "—";
    return `R$ ${Number(val).toFixed(2).replace(".", ",")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Produtos de Resgate</h2>
          <p className="text-muted-foreground">Gerencie achadinhos disponíveis para resgate com pontos</p>
        </div>
        <Button onClick={() => setModalAberto(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Produtos
        </Button>
      </div>

      <ModalAdicionarResgatavel aberto={modalAberto} onFechar={() => setModalAberto(false)} />

      {/* Estado vazio global */}
      {isEmptyNoSearch && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Nenhum produto resgatável</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Ative produtos para resgate na página de Achadinhos usando o filtro "Não resgatáveis".
              </p>
            </div>
            <Button asChild>
              <Link to="/affiliate-deals">
                Ir para Achadinhos
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPIs + tabela apenas quando há dados ou busca ativa */}
      {!isEmptyNoSearch && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis?.total ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Resgatáveis</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis?.ativos ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis?.minCost ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Mín. Pontos</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis?.maxCost ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Máx. Pontos</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros de status */}
          <div className="flex items-center gap-2">
            {([
              { key: "all" as const, label: "Todos" },
              { key: "active" as const, label: "Ativos" },
              { key: "inactive" as const, label: "Inativos" },
            ]).map((f) => (
              <Button
                key={f.key}
                size="sm"
                variant={statusFilter === f.key ? "default" : "outline"}
                onClick={() => handleStatusFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* Batch actions */}
          {selectedIds.size > 0 && (
            <Card>
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Badge variant="secondary">{selectedIds.size} selecionado(s)</Badge>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Novo custo em pontos"
                    value={batchCost}
                    onChange={(e) => setBatchCost(e.target.value)}
                    className="w-48"
                  />
                  <Button size="sm" onClick={handleBatchSetCost} disabled={batchUpdate.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    Aplicar
                  </Button>
                </div>
                <Button size="sm" variant="destructive" onClick={handleBatchRemoveRedeem} disabled={batchUpdate.isPending}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Desativar Resgate
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Search + pagination */}
          <DataTableControls
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Buscar produto resgatável..."
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={data?.total ?? 0}
            onPageChange={setPage}
          />

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={items.length > 0 && selectedIds.size === items.length}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Preço Original</TableHead>
                    <TableHead>Custo em Pontos</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Resgatável</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !items.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum produto encontrado para essa busca
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((deal) => {
                    const isEditing = editingCosts[deal.id] !== undefined;
                    const costDisplay = deal.redeem_points_cost ?? "—";

                    return (
                      <TableRow key={deal.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(deal.id)}
                            onCheckedChange={() => toggleSelect(deal.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {deal.image_url && (
                              <img src={deal.image_url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate">{deal.title}</p>
                              {deal.store_name && (
                                <p className="text-xs text-muted-foreground">{deal.store_name}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatPrice(deal.price)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <Input
                                  type="number"
                                  min={0}
                                  value={editingCosts[deal.id]}
                                  onChange={(e) =>
                                    setEditingCosts((prev) => ({ ...prev, [deal.id]: e.target.value }))
                                  }
                                  className="w-24 h-8"
                                  autoFocus
                                  onKeyDown={(e) => e.key === "Enter" && handleSaveCost(deal.id)}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => handleSaveCost(deal.id)}
                                  disabled={updateDeal.isPending}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <button
                                className="text-sm font-medium hover:underline cursor-pointer flex items-center gap-1"
                                onClick={() =>
                                  setEditingCosts((prev) => ({
                                    ...prev,
                                    [deal.id]: String(deal.redeem_points_cost ?? 0),
                                  }))
                                }
                              >
                                <Coins className="h-3.5 w-3.5 text-amber-500" />
                                {costDisplay} pts
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={deal.is_active ? "default" : "secondary"}>
                            {deal.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={!!deal.is_redeemable}
                            onCheckedChange={() => handleToggleRedeemable(deal.id, !!deal.is_redeemable)}
                            disabled={updateDeal.isPending}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
