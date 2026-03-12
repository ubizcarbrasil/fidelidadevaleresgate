import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTableControls } from "@/components/DataTableControls";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import type { Database } from "@/integrations/supabase/types";

type OfferStatus = Database["public"]["Enums"]["offer_status"];
const STATUS_OPTIONS: OfferStatus[] = ["DRAFT", "PENDING", "APPROVED", "ACTIVE", "EXPIRED"];
const STATUS_COLORS: Record<OfferStatus, string> = { DRAFT: "secondary", PENDING: "outline", APPROVED: "default", ACTIVE: "default", EXPIRED: "destructive" } as any;

const PAGE_SIZE = 20;

interface OfferForm {
  title: string; description: string; brand_id: string; branch_id: string; store_id: string;
  value_rescue: string; min_purchase: string; status: OfferStatus; max_daily_redemptions: string;
}
const emptyForm: OfferForm = { title: "", description: "", brand_id: "", branch_id: "", store_id: "", value_rescue: "0", min_purchase: "0", status: "DRAFT", max_daily_redemptions: "" };

export default function OffersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<OfferForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["offers", debouncedSearch, page],
    queryFn: async () => {
      let query = supabase.from("offers").select("*, brands(name), branches(name), stores(name)", { count: "exact" });
      if (debouncedSearch) query = query.ilike("title", `%${debouncedSearch}%`);
      const from = (page - 1) * PAGE_SIZE;
      const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { items: data, total: count || 0 };
    },
  });

  const { data: brands } = useQuery({ queryKey: ["brands-select"], queryFn: async () => { const { data } = await supabase.from("brands").select("id, name").order("name"); return data || []; } });
  const { data: branches } = useQuery({ queryKey: ["branches-select"], queryFn: async () => { const { data } = await supabase.from("branches").select("id, name, brand_id").order("name"); return data || []; } });
  const { data: stores } = useQuery({ queryKey: ["stores-select"], queryFn: async () => { const { data } = await supabase.from("stores").select("id, name, branch_id, brand_id").order("name"); return data || []; } });

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ofertas</h2>
          <p className="text-muted-foreground">Gerencie ofertas de resgate por cidade</p>
        </div>
        <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova Oferta</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Editar Oferta" : "Nova Oferta"}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Título</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Select value={form.brand_id} onValueChange={v => setForm(f => ({ ...f, brand_id: v, branch_id: "", store_id: "" }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
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
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Valor Resgate (R$)</Label><Input type="number" value={form.value_rescue} onChange={e => setForm(f => ({ ...f, value_rescue: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Compra Mín. (R$)</Label><Input type="number" value={form.min_purchase} onChange={e => setForm(f => ({ ...f, min_purchase: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Máx. Diário</Label><Input type="number" value={form.max_daily_redemptions} onChange={e => setForm(f => ({ ...f, max_daily_redemptions: e.target.value }))} placeholder="Ilimitado" /></div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as OfferStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={() => save.mutate()} disabled={!form.title || !form.brand_id || !form.branch_id || !form.store_id} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTableControls search={search} onSearchChange={setSearch} searchPlaceholder="Buscar oferta por título..." page={page} pageSize={PAGE_SIZE} totalCount={data?.total || 0} onPageChange={setPage} />

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
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!isLoading && data?.items?.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma oferta encontrada</TableCell></TableRow>}
              {data?.items?.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.title}</TableCell>
                  <TableCell>{(o.stores as any)?.name}</TableCell>
                  <TableCell>{(o.branches as any)?.name}</TableCell>
                  <TableCell>R$ {Number(o.value_rescue).toFixed(2)}</TableCell>
                  <TableCell><Badge variant={(STATUS_COLORS[o.status as OfferStatus] || "secondary") as any}>{o.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
