import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useBrand } from "@/contexts/BrandContext";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { DataTableControls } from "@/components/DataTableControls";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Package, Coins, CheckCircle2, Save, Trash2, Loader2, ArrowRight, Plus, Users, Pencil, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import ModalAdicionarResgatavel from "./produtos_resgate/components/ModalAdicionarResgatavel";
import BotaoRecalcularPontos from "./produtos_resgate/components/BotaoRecalcularPontos";
import ModalEditarResgatavel from "./produtos_resgate/components/ModalEditarResgatavel";
import { formatPoints } from "@/lib/formatPoints";
import { useIsMobile } from "@/hooks/use-mobile";

const PAGE_SIZE = 20;

export default function ProdutosResgatePage() {
  const qc = useQueryClient();
  const { currentBrandId, currentBranchId, consoleScope, isRootAdmin } = useBrandGuard();
  const { brand } = useBrand();
  const { search, debouncedSearch, page, setPage, onSearchChange } = useDebouncedSearch();
  const isMobile = useIsMobile();

  const isBranchScope = consoleScope === "BRANCH" && !!currentBranchId;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCosts, setEditingCosts] = useState<Record<string, string>>({});
  const [batchCost, setBatchCost] = useState("");
  const [batchRedeemableBy, setBatchRedeemableBy] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<any>(null);

  // Query dedicada para brand_settings_json (brand pode ser null no admin)
  const { data: brandSettings } = useQuery({
    queryKey: ["brand-settings", currentBrandId],
    queryFn: async () => {
      const { data } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", currentBrandId!)
        .single();
      return (data?.brand_settings_json as Record<string, any>) ?? {};
    },
    enabled: !!currentBrandId,
  });

  const mirrorDriver = brandSettings?.customer_redeem_mirror_driver === true;
  const customerRedeemRows = (brandSettings?.customer_redeem_rows as number) ?? 1;

  const updateRowsMutation = useMutation({
    mutationFn: async (rows: number) => {
      if (!currentBrandId) throw new Error("Marca não identificada");
      const { data: brandData } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", currentBrandId)
        .single();
      const current = (brandData?.brand_settings_json as Record<string, any>) ?? {};
      const { error } = await supabase
        .from("brands")
        .update({ brand_settings_json: { ...current, customer_redeem_rows: rows } } as any)
        .eq("id", currentBrandId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-settings", currentBrandId] });
      toast.success("Linhas de resgate atualizadas");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Query ──
  const { data, isLoading } = useQuery({
    queryKey: ["produtos-resgate", debouncedSearch, page, currentBrandId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("affiliate_deals")
        .select("id, title, image_url, price, original_price, is_active, is_redeemable, redeem_points_cost, store_name, redeemable_by, custom_points_per_real", { count: "exact" })
        .eq("is_redeemable", true);

      if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);
      // Isolamento por cidade para branch_admin
      if (isBranchScope) query = query.eq("branch_id", currentBranchId!);
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

      let query = !isRootAdmin && currentBrandId ? base.eq("brand_id", currentBrandId) : base;
      if (isBranchScope) query = query.eq("branch_id", currentBranchId!);
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

  const handleBatchSetRedeemableBy = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return toast.error("Selecione ao menos um item");
    if (!batchRedeemableBy) return toast.error("Selecione um público-alvo");
    batchUpdate.mutate(
      { ids, updates: { redeemable_by: batchRedeemableBy } },
      { onSuccess: () => { toast.success(`Público atualizado em ${ids.length} itens`); setBatchRedeemableBy(""); } }
    );
  };

  const handleChangeRedeemableBy = (id: string, value: string) => {
    updateDeal.mutate(
      { id, updates: { redeemable_by: value } },
      { onSuccess: () => toast.success("Público atualizado"), onError: (e: Error) => toast.error(e.message) }
    );
  };

  const toggleMirrorMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!currentBrandId) throw new Error("Marca não identificada");
      const { data: brandData } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", currentBrandId)
        .single();
      const current = (brandData?.brand_settings_json as Record<string, any>) ?? {};
      const { error } = await supabase
        .from("brands")
        .update({ brand_settings_json: { ...current, customer_redeem_mirror_driver: enabled } } as any)
        .eq("id", currentBrandId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-settings", currentBrandId] });
      toast.success("Configuração de espelhamento atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const formatPrice = (val: number | null | undefined) => {
    if (val == null) return "—";
    return `R$ ${Number(val).toFixed(2).replace(".", ",")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Produtos de Resgate</h2>
          <p className="text-sm text-muted-foreground">Gerencie achadinhos disponíveis para resgate com pontos</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <BotaoRecalcularPontos />
          <Button onClick={() => setModalAberto(true)} className="flex-1 sm:flex-initial">
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Adicionar Produtos</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>
        </div>
      </div>

      <ModalAdicionarResgatavel aberto={modalAberto} onFechar={() => setModalAberto(false)} />
      <ModalEditarResgatavel
        produto={produtoEditando}
        aberto={!!produtoEditando}
        onFechar={() => setProdutoEditando(null)}
      />

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
                  <p className="text-2xl font-bold">{formatPoints(kpis?.minCost ?? 0)}</p>
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
                  <p className="text-2xl font-bold">{formatPoints(kpis?.maxCost ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">Máx. Pontos</p>
                </div>
              </CardContent>
            </Card>
          </div>

           {/* Filtros de status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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

            {/* Toggle espelhamento motorista → cliente */}
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Espelhar produtos do motorista para cliente</label>
              <Switch
                checked={mirrorDriver}
                onCheckedChange={(v) => toggleMirrorMutation.mutate(v)}
                disabled={toggleMirrorMutation.isPending}
              />
            </div>
          </div>

          {/* Configuração de linhas para resgate do cliente */}
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium">Linhas de "Resgatar com Pontos" (Cliente)</p>
                <p className="text-xs text-muted-foreground">Quantas linhas de produtos aparecerão na seção de resgate do app do cliente</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={customerRedeemRows <= 1 || updateRowsMutation.isPending}
                  onClick={() => updateRowsMutation.mutate(customerRedeemRows - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-bold w-8 text-center">{customerRedeemRows}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={customerRedeemRows >= 5 || updateRowsMutation.isPending}
                  onClick={() => updateRowsMutation.mutate(customerRedeemRows + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Batch actions */}
          {selectedIds.size > 0 && (
            <Card>
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                <Badge variant="secondary">{selectedIds.size} selecionado(s)</Badge>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Custo em pontos"
                    value={batchCost}
                    onChange={(e) => setBatchCost(e.target.value)}
                    className="w-40"
                  />
                  <Button size="sm" onClick={handleBatchSetCost} disabled={batchUpdate.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    Aplicar
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={batchRedeemableBy} onValueChange={setBatchRedeemableBy}>
                    <SelectTrigger className="w-36 h-9">
                      <SelectValue placeholder="Público-alvo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="driver">Motorista</SelectItem>
                      <SelectItem value="customer">Cliente</SelectItem>
                      <SelectItem value="both">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleBatchSetRedeemableBy} disabled={batchUpdate.isPending}>
                    <Users className="h-4 w-4 mr-1" />
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

          {/* Table / Cards */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !items.length ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum produto encontrado para essa busca
            </p>
          ) : isMobile ? (
            /* ── Mobile Card View ── */
            <div className="space-y-3">
              {items.map((deal) => {
                const isEditing = editingCosts[deal.id] !== undefined;
                const costDisplay = deal.redeem_points_cost != null ? formatPoints(deal.redeem_points_cost) : "—";
                return (
                  <Card key={deal.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIds.has(deal.id)}
                          onCheckedChange={() => toggleSelect(deal.id)}
                          className="mt-1"
                        />
                        {deal.image_url && (
                          <img src={deal.image_url} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2">{deal.title}</p>
                          {deal.store_name && (
                            <p className="text-xs text-muted-foreground mt-0.5">{deal.store_name}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">{formatPrice(deal.price)}</span>
                            <Badge variant={deal.is_active ? "default" : "secondary"} className="text-[10px]">
                              {deal.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                            <Select value={(deal as any).redeemable_by ?? "driver"} onValueChange={(v) => handleChangeRedeemableBy(deal.id, v)}>
                              <SelectTrigger className="h-7 w-[90px] text-[10px] px-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="driver">Motorista</SelectItem>
                                <SelectItem value="customer">Cliente</SelectItem>
                                <SelectItem value="both">Ambos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
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
                                className="w-20 h-8 text-sm"
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && handleSaveCost(deal.id)}
                              />
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveCost(deal.id)} disabled={updateDeal.isPending}>
                                <Save className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <button
                              className="text-sm font-medium flex items-center gap-1"
                              onClick={() => setEditingCosts((prev) => ({ ...prev, [deal.id]: String(deal.redeem_points_cost ?? 0) }))}
                            >
                              <Coins className="h-3.5 w-3.5 text-amber-500" />
                              {costDisplay} pts
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => setProdutoEditando(deal)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Editar
                          </Button>
                          <span className="text-xs text-muted-foreground">Resgatável</span>
                          <Switch
                            checked={!!deal.is_redeemable}
                            onCheckedChange={() => handleToggleRedeemable(deal.id, !!deal.is_redeemable)}
                            disabled={updateDeal.isPending}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* ── Desktop Table View ── */
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
                      <TableHead>Público</TableHead>
                      <TableHead>Resgatável</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((deal) => {
                      const isEditing = editingCosts[deal.id] !== undefined;
                      const costDisplay = deal.redeem_points_cost != null ? formatPoints(deal.redeem_points_cost) : "—";
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
                            <Select value={(deal as any).redeemable_by ?? "driver"} onValueChange={(v) => handleChangeRedeemableBy(deal.id, v)}>
                              <SelectTrigger className="h-8 w-[110px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="driver">Motorista</SelectItem>
                                <SelectItem value="customer">Cliente</SelectItem>
                                <SelectItem value="both">Ambos</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={!!deal.is_redeemable}
                              onCheckedChange={() => handleToggleRedeemable(deal.id, !!deal.is_redeemable)}
                              disabled={updateDeal.isPending}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setProdutoEditando(deal)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
