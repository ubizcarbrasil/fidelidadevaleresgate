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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ExternalLink, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import { DataTableControls } from "@/components/DataTableControls";
import { useDebounce } from "@/hooks/useDebounce";
import ImageUploadField from "@/components/ImageUploadField";
import { useBrandGuard } from "@/hooks/useBrandGuard";

const PAGE_SIZE = 20;

interface DealForm {
  title: string;
  description: string;
  brand_id: string;
  branch_id: string;
  price: string;
  original_price: string;
  affiliate_url: string;
  image_url: string;
  category: string;
  store_name: string;
  is_active: boolean;
  order_index: string;
}

const emptyForm = (brandId?: string): DealForm => ({
  title: "", description: "", brand_id: brandId || "", branch_id: "", price: "0",
  original_price: "", affiliate_url: "", image_url: "", category: "",
  store_name: "", is_active: true, order_index: "0",
});

export default function AffiliateDealsPage() {
  const qc = useQueryClient();
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<DealForm>(emptyForm(currentBrandId || undefined));
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data: brands } = useQuery({
    queryKey: ["brands-select", currentBrandId],
    queryFn: async () => {
      let q = supabase.from("brands").select("id, name").order("name");
      if (!isRootAdmin && currentBrandId) q = q.eq("id", currentBrandId);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: branches } = useQuery({
    queryKey: ["branches-select", currentBrandId],
    queryFn: async () => {
      let q = supabase.from("branches").select("id, name, brand_id").order("name");
      if (!isRootAdmin && currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data } = await q;
      return data || [];
    },
  });

  const filteredBranches = branches?.filter((b) => b.brand_id === form.brand_id) || [];

  const { data, isLoading } = useQuery({
    queryKey: ["affiliate-deals", debouncedSearch, page, currentBrandId],
    queryFn: async () => {
      let query = supabase.from("affiliate_deals").select("*, brands(name)", { count: "exact" });
      if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);
      if (debouncedSearch) query = query.ilike("title", `%${debouncedSearch}%`);
      const from = (page - 1) * PAGE_SIZE;
      const { data, error, count } = await query.order("order_index").range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { items: data, total: count || 0 };
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title,
        description: form.description || null,
        brand_id: form.brand_id,
        branch_id: form.branch_id || null,
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        affiliate_url: form.affiliate_url,
        image_url: form.image_url || null,
        category: form.category || null,
        store_name: form.store_name || null,
        is_active: form.is_active,
        order_index: Number(form.order_index),
      };
      if (editId) {
        const { error } = await supabase.from("affiliate_deals").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("affiliate_deals").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliate-deals"] });
      toast.success(editId ? "Achadinho atualizado!" : "Achadinho criado!");
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("affiliate_deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliate-deals"] });
      toast.success("Achadinho removido!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm(currentBrandId || undefined)); };

  const openEdit = (d: any) => {
    setEditId(d.id);
    setForm({
      title: d.title,
      description: d.description || "",
      brand_id: d.brand_id,
      branch_id: d.branch_id || "",
      price: String(d.price),
      original_price: d.original_price ? String(d.original_price) : "",
      affiliate_url: d.affiliate_url,
      image_url: d.image_url || "",
      category: d.category || "",
      store_name: d.store_name || "",
      is_active: d.is_active,
      order_index: String(d.order_index),
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Achadinhos</h2>
          <p className="text-muted-foreground">Gerencie ofertas de afiliados do marketplace</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Achadinho</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Achadinho" : "Novo Achadinho"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Fone Bluetooth Pro" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {isRootAdmin && (
                <div className="space-y-2">
                  <Label>Brand *</Label>
                  <Select value={form.brand_id} onValueChange={(v) => setForm((f) => ({ ...f, brand_id: v, branch_id: "" }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{brands?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                )}
                <div className="space-y-2">
                  <Label>Filial (opcional)</Label>
                  <Select value={form.branch_id} onValueChange={(v) => setForm((f) => ({ ...f, branch_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>{filteredBranches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Preço (R$) *</Label>
                  <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Preço Original</Label>
                  <Input type="number" min="0" step="0.01" value={form.original_price} onChange={(e) => setForm((f) => ({ ...f, original_price: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Ordem</Label>
                  <Input type="number" value={form.order_index} onChange={(e) => setForm((f) => ({ ...f, order_index: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL de Afiliado *</Label>
                <Input value={form.affiliate_url} onChange={(e) => setForm((f) => ({ ...f, affiliate_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Imagem</Label>
                <ImageUploadField
                  value={form.image_url}
                  onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                  folder="affiliate-deals"
                  label="Imagem do Achadinho"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Ex: Eletrônicos" />
                </div>
                <div className="space-y-2">
                  <Label>Nome da Loja</Label>
                  <Input value={form.store_name} onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value }))} placeholder="Ex: Amazon" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                <Label>Ativo</Label>
              </div>
              <Button onClick={() => save.mutate()} disabled={!form.title || !form.brand_id || !form.affiliate_url} className="w-full">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTableControls search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Buscar achadinho..." page={page} pageSize={PAGE_SIZE} totalCount={data?.total || 0} onPageChange={setPage} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Cliques</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              )}
              {!isLoading && data?.items?.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum achadinho encontrado</TableCell></TableRow>
              )}
              {data?.items?.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {d.image_url && <img src={d.image_url} alt="" className="h-8 w-8 rounded object-cover" />}
                      <span className="font-medium">{d.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.store_name || "—"}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">R$ {Number(d.price).toFixed(2)}</span>
                      {d.original_price && (
                        <span className="text-xs text-muted-foreground line-through ml-2">R$ {Number(d.original_price).toFixed(2)}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MousePointerClick className="h-3 w-3" />
                      {d.click_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.is_active ? "default" : "secondary"}>
                      {d.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={d.affiliate_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(d.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
