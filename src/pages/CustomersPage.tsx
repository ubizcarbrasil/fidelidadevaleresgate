import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { DataTableControls } from "@/components/DataTableControls";
import CustomerLedgerDrawer from "@/components/CustomerLedgerDrawer";
import { useBrandGuard } from "@/hooks/useBrandGuard";

const PAGE_SIZE = 20;

interface CustomerForm { name: string; phone: string; brand_id: string; branch_id: string; cpf: string; email: string; }
const emptyForm: CustomerForm = { name: "", phone: "", brand_id: "", branch_id: "", cpf: "", email: "" };

export default function CustomersPage() {
  const qc = useQueryClient();
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [ledgerCustomer, setLedgerCustomer] = useState<any>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!isRootAdmin && currentBrandId && !form.brand_id) {
      setForm(f => ({ ...f, brand_id: currentBrandId }));
    }
  }, [isRootAdmin, currentBrandId]);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", debouncedSearch, page, currentBrandId],
    queryFn: async () => {
      let query = supabase.from("customers").select("*, brands(name), branches(name)", { count: "exact" }) as any;
      if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);
      if (debouncedSearch) query = query.or(`name.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%,cpf.ilike.%${debouncedSearch}%`);
      const from = (page - 1) * PAGE_SIZE;
      const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { items: data, total: count || 0 };
    },
  });

  const { data: brands } = useQuery({ queryKey: ["brands-select", currentBrandId], queryFn: async () => { let q = supabase.from("brands").select("id, name").order("name"); if (!isRootAdmin && currentBrandId) q = q.eq("id", currentBrandId); const { data } = await q; return data || []; } });
  const { data: branches } = useQuery({ queryKey: ["branches-select", currentBrandId], queryFn: async () => { let q = supabase.from("branches").select("id, name, brand_id").order("name"); if (!isRootAdmin && currentBrandId) q = q.eq("brand_id", currentBrandId); const { data } = await q; return data || []; } });
  const filteredBranches = branches?.filter(b => b.brand_id === form.brand_id) || [];

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = { name: form.name, phone: form.phone || null, brand_id: form.brand_id, branch_id: form.branch_id, cpf: form.cpf || null, email: form.email || null };
      if (editId) { const { error } = await (supabase as any).from("customers").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await (supabase as any).from("customers").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast.success(editId ? "Cliente atualizado!" : "Cliente criado!"); closeDialog(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (c: any) => { setEditId(c.id); setForm({ name: c.name, phone: c.phone || "", brand_id: c.brand_id, branch_id: c.branch_id, cpf: c.cpf || "", email: c.email || "" }); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">Gerencie clientes por filial</p>
        </div>
        <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Cliente</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div className="space-y-2"><Label>CPF</Label><Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" /></div>
              </div>
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" /></div>
              <div className="grid grid-cols-2 gap-4">
                {isRootAdmin && (
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Select value={form.brand_id} onValueChange={v => setForm(f => ({ ...f, brand_id: v, branch_id: "" }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                )}
                <div className="space-y-2">
                  <Label>Filial</Label>
                  <Select value={form.branch_id} onValueChange={v => setForm(f => ({ ...f, branch_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{filteredBranches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => save.mutate()} disabled={!form.name || !form.brand_id || !form.branch_id} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTableControls search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por nome, telefone ou CPF..." page={page} pageSize={PAGE_SIZE} totalCount={data?.total || 0} onPageChange={setPage} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead>Saldo (R$)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!isLoading && data?.items?.length === 0 && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>}
              {data?.items?.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone || "—"}</TableCell>
                  <TableCell>{c.cpf || "—"}</TableCell>
                  <TableCell>{c.email || "—"}</TableCell>
                  <TableCell>{(c.brands as any)?.name}</TableCell>
                  <TableCell>{(c.branches as any)?.name}</TableCell>
                  <TableCell>{c.points_balance}</TableCell>
                  <TableCell>R$ {Number(c.money_balance).toFixed(2)}</TableCell>
                  <TableCell><Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setLedgerCustomer(c)} title="Extrato"><ScrollText className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CustomerLedgerDrawer
        customer={ledgerCustomer}
        open={!!ledgerCustomer}
        onOpenChange={open => { if (!open) setLedgerCustomer(null); }}
      />
    </div>
  );
}
