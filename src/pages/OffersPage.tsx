import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import DataSkeleton from "@/components/DataSkeleton";
import EmptyState from "@/components/customer/EmptyState";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DataTableControls } from "@/components/DataTableControls";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useProductScope } from "@/features/city_onboarding/hooks/hook_escopo_produto";
import type { Database } from "@/integrations/supabase/types";

type OfferStatus = Database["public"]["Enums"]["offer_status"];
const STATUS_OPTIONS: OfferStatus[] = ["DRAFT", "PENDING", "APPROVED", "ACTIVE", "EXPIRED"];
const STATUS_LABELS: Record<OfferStatus, string> = { DRAFT: "Rascunho", PENDING: "Pendente", APPROVED: "Aprovada", ACTIVE: "Ativa", EXPIRED: "Expirada" };
const STATUS_COLORS: Record<OfferStatus, string> = { DRAFT: "secondary", PENDING: "outline", APPROVED: "default", ACTIVE: "default", EXPIRED: "destructive" } as any;

const PAGE_SIZE = 20;

interface OfferForm {
  title: string; description: string; brand_id: string; branch_id: string; store_id: string;
  value_rescue: string; min_purchase: string; status: OfferStatus; max_daily_redemptions: string;
}
const emptyForm: OfferForm = { title: "", description: "", brand_id: "", branch_id: "", store_id: "", value_rescue: "0", min_purchase: "0", status: "DRAFT", max_daily_redemptions: "" };

export default function OffersPage() {
  const qc = useQueryClient();
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const escopoProduto = useProductScope();
  const temAudienciaCliente = escopoProduto.hasAudience("cliente");
  const temAudienciaMotorista = escopoProduto.hasAudience("motorista");
  const mostrarFiltroPublico = temAudienciaCliente && temAudienciaMotorista;
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<OfferForm>(emptyForm);
  const { search, debouncedSearch, page, setPage, onSearchChange } = useDebouncedSearch();
  const [filtroMotorista, setFiltroMotorista] = useState<string>("all");

  useEffect(() => {
    if (!isRootAdmin && currentBrandId && !form.brand_id) {
      setForm(f => ({ ...f, brand_id: currentBrandId }));
    }
  }, [isRootAdmin, currentBrandId]);

  const { data, isLoading } = useQuery({
    queryKey: ["offers", debouncedSearch, page, currentBrandId, filtroMotorista],
    enabled: !!currentBrandId || isRootAdmin,
    queryFn: async () => {
      let query = supabase.from("offers").select("*, brands(name), branches(name), stores(name)", { count: "exact" });
      if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);
      if (debouncedSearch) query = query.ilike("title", `%${debouncedSearch}%`);
      if (filtroMotorista === "driver_only") query = query.eq("driver_only", true);
      else if (filtroMotorista === "customer_only") query = query.eq("driver_only", false);
      const from = (page - 1) * PAGE_SIZE;
      const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { items: data, total: count || 0 };
    },
  });

  const { data: brands } = useQuery({ queryKey: ["brands-select", currentBrandId], queryFn: async () => { let q = supabase.from("brands").select("id, name").order("name"); if (!isRootAdmin && currentBrandId) q = q.eq("id", currentBrandId); const { data } = await q; return data || []; } });
  const { data: branches } = useQuery({ queryKey: ["branches-select", currentBrandId], queryFn: async () => { let q = supabase.from("branches").select("id, name, brand_id").order("name"); if (!isRootAdmin && currentBrandId) q = q.eq("brand_id", currentBrandId); const { data } = await q; return data || []; } });
  const { data: stores } = useQuery({ queryKey: ["stores-select", currentBrandId], queryFn: async () => { let q = supabase.from("stores").select("id, name, branch_id, brand_id").order("name"); if (!isRootAdmin && currentBrandId) q = q.eq("brand_id", currentBrandId); const { data } = await q; return data || []; } });

  const filteredBranches = branches?.filter(b => b.brand_id === form.brand_id) || [];
  const filteredStores = stores?.filter(s => s.branch_id === form.branch_id && s.brand_id === form.brand_id) || [];

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title, description: form.description || null, brand_id: form.brand_id, branch_id: form.branch_id, store_id: form.store_id,
        value_rescue: Number(form.value_rescue), min_purchase: Number(form.min_purchase), status: form.status,
        max_daily_redemptions: form.max_daily_redemptions ? Number(form.max_daily_redemptions) : null,
      };
      if (editId) { const { error } = await supabase.from("offers").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("offers").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offers"] }); toast.success(editId ? "Oferta atualizada!" : "Oferta criada!"); closeDialog(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("offers").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offers"] }); toast.success("Oferta removida!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (o: any) => {
    setEditId(o.id);
    setForm({ title: o.title, description: o.description || "", brand_id: o.brand_id, branch_id: o.branch_id, store_id: o.store_id, value_rescue: String(o.value_rescue), min_purchase: String(o.min_purchase), status: o.status, max_daily_redemptions: o.max_daily_redemptions ? String(o.max_daily_redemptions) : "" });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Ofertas</h2>
          <p className="text-muted-foreground">Gerencie ofertas de resgate por cidade</p>
        </div>
        <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild><Button className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />Nova Oferta</Button></DialogTrigger>
          <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] p-0 gap-0 flex flex-col">
            <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
              <DialogTitle>{editId ? "Editar Oferta" : "Nova Oferta"}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="space-y-2"><Label>Título</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {isRootAdmin && (
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Select value={form.brand_id} onValueChange={v => setForm(f => ({ ...f, brand_id: v, branch_id: "", store_id: "" }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                )}
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Select value={form.branch_id} onValueChange={v => setForm(f => ({ ...f, branch_id: v, store_id: "" }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{filteredBranches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Parceiro</Label>
                  <Select value={form.store_id} onValueChange={v => setForm(f => ({ ...f, store_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{filteredStores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Valor Resgate (R$)</Label><Input type="number" value={form.value_rescue} onChange={e => setForm(f => ({ ...f, value_rescue: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Compra Mín. (R$)</Label><Input type="number" value={form.min_purchase} onChange={e => setForm(f => ({ ...f, min_purchase: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Máx. Diário</Label><Input type="number" value={form.max_daily_redemptions} onChange={e => setForm(f => ({ ...f, max_daily_redemptions: e.target.value }))} placeholder="Ilimitado" /></div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as OfferStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="px-6 py-4 border-t shrink-0 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button variant="outline" onClick={closeDialog} className="w-full sm:w-auto">
                Voltar
              </Button>
              <Button
                onClick={() => save.mutate()}
                disabled={!form.title || !form.brand_id || !form.branch_id || !form.store_id || save.isPending}
                className="w-full sm:w-auto"
              >
                {save.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1 w-full">
          <DataTableControls search={search} onSearchChange={onSearchChange} searchPlaceholder="Buscar oferta por título..." page={page} pageSize={PAGE_SIZE} totalCount={data?.total || 0} onPageChange={setPage} />
        </div>
        {mostrarFiltroPublico && (
          <Select value={filtroMotorista} onValueChange={setFiltroMotorista}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Público" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ofertas</SelectItem>
              <SelectItem value="driver_only">🚗 Exclusivo Motorista</SelectItem>
              <SelectItem value="customer_only">👤 Apenas Clientes</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <DataSkeleton variant="table-row" rows={5} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items?.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-0">
                    <EmptyState type="offers" />
                  </TableCell></TableRow>
                )}
                {data?.items?.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {o.title}
                        {o.driver_only && (
                          <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 bg-primary/5 text-primary border-primary/20">
                            <Truck className="h-3 w-3" /> Motorista
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{(o.stores as any)?.name}</TableCell>
                    <TableCell>{(o.branches as any)?.name}</TableCell>
                    <TableCell>R$ {Number(o.value_rescue).toFixed(2)}</TableCell>
                    <TableCell><Badge variant={(STATUS_COLORS[o.status as OfferStatus] || "secondary") as any}>{STATUS_LABELS[o.status as OfferStatus] || o.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>Tem certeza que deseja excluir a oferta "{o.title}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove.mutate(o.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
