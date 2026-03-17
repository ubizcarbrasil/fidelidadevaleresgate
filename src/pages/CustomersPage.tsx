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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, ScrollText, UserCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DataTableControls } from "@/components/DataTableControls";
import CustomerLedgerDrawer from "@/components/CustomerLedgerDrawer";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { getTierInfo, CRM_SYNC_LABELS, TIERS } from "@/lib/tierUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

const PAGE_SIZE = 20;

interface CustomerForm { name: string; phone: string; brand_id: string; branch_id: string; cpf: string; email: string; }
const emptyForm: CustomerForm = { name: "", phone: "", brand_id: "", branch_id: "", cpf: "", email: "" };

export default function CustomersPage() {
  const qc = useQueryClient();
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const { search, debouncedSearch, page, setPage, onSearchChange } = useDebouncedSearch();
  const [ledgerCustomer, setLedgerCustomer] = useState<any>(null);
  const [tierFilter, setTierFilter] = useState<string>("");
  const [crmFilter, setCrmFilter] = useState<string>("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({ name: "", cpf: "", phone: "" });

  useEffect(() => {
    if (!isRootAdmin && currentBrandId && !form.brand_id) {
      setForm(f => ({ ...f, brand_id: currentBrandId }));
    }
  }, [isRootAdmin, currentBrandId]);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", debouncedSearch, page, currentBrandId, tierFilter, crmFilter],
    queryFn: async () => {
      let query = supabase.from("customers").select("*, brands(name), branches(name)", { count: "exact" }) as any;
      if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);
      if (debouncedSearch) query = query.or(`name.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%,cpf.ilike.%${debouncedSearch}%`);
      if (tierFilter) query = query.eq("customer_tier", tierFilter);
      if (crmFilter) query = query.eq("crm_sync_status", crmFilter);
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

  const syncToCrmMutation = useMutation({
    mutationFn: async () => {
      const brandId = currentBrandId;
      if (!brandId) throw new Error("Marca não selecionada");

      // Fallback branch for contacts without branch_id
      const defaultBranch = branches?.[0];
      if (!defaultBranch) throw new Error("Nenhuma filial cadastrada para esta marca");

      let pushedCount = 0;
      let importedCount = 0;

      // ── 1. Push: customers PENDING → crm_contacts (existing logic) ──
      const { data: pendingCustomers, error: pendErr } = await (supabase as any)
        .from("customers")
        .select("id, name, phone, cpf, email, brand_id, branch_id, ride_count")
        .eq("crm_sync_status", "PENDING")
        .eq("brand_id", brandId)
        .limit(200);
      if (pendErr) throw pendErr;

      for (const cust of pendingCustomers || []) {
        const { data: contact } = await supabase.from("crm_contacts").insert({
          brand_id: cust.brand_id,
          branch_id: cust.branch_id,
          customer_id: cust.id,
          name: cust.name,
          phone: cust.phone,
          cpf: cust.cpf,
          email: cust.email,
          ride_count: cust.ride_count || 0,
          source: "LOYALTY",
        } as any).select("id").single();

        if (contact) {
          await (supabase as any).from("customers").update({
            crm_contact_id: contact.id,
            crm_sync_status: "SYNCED",
          }).eq("id", cust.id);
          pushedCount++;
        }
      }

      // ── 2. Pull: crm_contacts órfãos → customers (NEW) ──
      const { data: orphanContacts, error: orphErr } = await supabase
        .from("crm_contacts")
        .select("id, name, phone, cpf, email, brand_id, branch_id, ride_count")
        .eq("brand_id", brandId)
        .is("customer_id", null)
        .eq("is_active", true)
        .limit(500);
      if (orphErr) throw orphErr;

      const tierFromRides = (rides: number): string => {
        if (rides >= 200) return "GALATICO";
        if (rides >= 150) return "LENDARIO";
        if (rides >= 100) return "DIAMANTE";
        if (rides >= 50) return "OURO";
        if (rides >= 20) return "PRATA";
        if (rides >= 5) return "BRONZE";
        return "INICIANTE";
      };

      for (const contact of orphanContacts || []) {
        const branchId = contact.branch_id || defaultBranch.id;
        const { data: newCust } = await (supabase as any).from("customers").insert({
          name: contact.name || "Contato CRM",
          phone: contact.phone || null,
          cpf: contact.cpf || null,
          email: contact.email || null,
          brand_id: contact.brand_id,
          branch_id: branchId,
          crm_contact_id: contact.id,
          crm_sync_status: "SYNCED",
          ride_count: contact.ride_count || 0,
          customer_tier: tierFromRides(contact.ride_count || 0),
        }).select("id").single();

        if (newCust) {
          await (supabase as any).from("crm_contacts").update({
            customer_id: newCust.id,
          }).eq("id", contact.id);
          importedCount++;
        }
      }

      return { pushedCount, importedCount };
    },
    onSuccess: ({ pushedCount, importedCount }) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      if (pushedCount === 0 && importedCount === 0) {
        toast.info("Tudo sincronizado! Nenhuma pendência encontrada.");
      } else {
        const parts: string[] = [];
        if (pushedCount > 0) parts.push(`${pushedCount} enviado(s) ao CRM`);
        if (importedCount > 0) parts.push(`${importedCount} importado(s) do CRM`);
        toast.success(`Sincronização concluída: ${parts.join(", ")}`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (c: any) => { setEditId(c.id); setForm({ name: c.name, phone: c.phone || "", brand_id: c.brand_id, branch_id: c.branch_id, cpf: c.cpf || "", email: c.email || "" }); setOpen(true); };

  const unidentifiedOnPage = data?.items?.filter((c: any) => c.name?.startsWith("Passageiro corrida #")) || [];
  const isUnidentified = (c: any) => c.name?.startsWith("Passageiro corrida #");

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleSelectAll = () => {
    if (unidentifiedOnPage.length === 0) return;
    const allSelected = unidentifiedOnPage.every((c: any) => selectedIds.has(c.id));
    if (allSelected) { setSelectedIds(prev => { const next = new Set(prev); unidentifiedOnPage.forEach((c: any) => next.delete(c.id)); return next; }); }
    else { setSelectedIds(prev => { const next = new Set(prev); unidentifiedOnPage.forEach((c: any) => next.add(c.id)); return next; }); }
  };

  const bulkIdentifyMutation = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) throw new Error("Nenhum cliente selecionado");
      const updates: Record<string, any> = {};
      if (bulkForm.name.trim()) updates.name = bulkForm.name.trim();
      if (bulkForm.cpf.trim()) updates.cpf = bulkForm.cpf.trim();
      if (bulkForm.phone.trim()) updates.phone = bulkForm.phone.trim();
      if (Object.keys(updates).length === 0) throw new Error("Preencha pelo menos um campo");
      const { error } = await (supabase as any).from("customers").update(updates).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast.success(`${selectedIds.size} cliente(s) atualizado(s)!`); setSelectedIds(new Set()); setBulkOpen(false); setBulkForm({ name: "", cpf: "", phone: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-sm text-muted-foreground">Gerencie clientes por filial</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => syncToCrmMutation.mutate()} disabled={syncToCrmMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncToCrmMutation.isPending ? "animate-spin" : ""}`} />
            {isMobile ? "CRM" : "Sincronizar CRM"}
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
              <UserCheck className="h-4 w-4 mr-1" />
              Identificar {selectedIds.size}
            </Button>
          )}
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />{isMobile ? "Novo" : "Novo Cliente"}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>CPF</Label><Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" /></div>
                </div>
                <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full sm:flex-1 sm:min-w-[200px]">
          <DataTableControls search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por nome, telefone ou CPF..." page={page} pageSize={PAGE_SIZE} totalCount={data?.total || 0} onPageChange={setPage} />
        </div>
        <div className="flex gap-2">
          <Select value={tierFilter} onValueChange={v => { setTierFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Tier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tiers</SelectItem>
              {TIERS.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={crmFilter} onValueChange={v => { setCrmFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status CRM" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="SYNCED">Sincronizado</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
              <SelectItem value="NONE">Sem CRM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading / Empty */}
      {isLoading && <p className="text-center py-8 text-muted-foreground">Carregando...</p>}
      {!isLoading && data?.items?.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</p>}

      {/* Mobile: Card list */}
      {isMobile ? (
        <div className="space-y-3">
          {data?.items?.map((c: any) => {
            const tier = getTierInfo(c.customer_tier || "INICIANTE");
            const crmStatus = CRM_SYNC_LABELS[c.crm_sync_status || "NONE"];
            return (
              <Card key={c.id} className={isUnidentified(c) ? "border-yellow-500/30" : ""}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isUnidentified(c) && <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} />}
                      <span className="font-medium truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLedgerCustomer(c)} title="Extrato"><ScrollText className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={`text-xs ${tier.color}`}>{tier.label}</Badge>
                    {crmStatus.label && <Badge variant="outline" className={`text-xs ${crmStatus.color}`}>{crmStatus.label}</Badge>}
                    <Badge variant={c.is_active ? "default" : "secondary"} className="text-xs">{c.is_active ? "Ativo" : "Inativo"}</Badge>
                    {isUnidentified(c) && <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700">Não identificado</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>Tel: {c.phone || "—"}</span>
                    <span>CPF: {c.cpf || "—"}</span>
                    <span>Corridas: {c.ride_count || 0}</span>
                    <span>Pontos: {c.points_balance}</span>
                    <span>Saldo: R$ {Number(c.money_balance).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Desktop: Table */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    {unidentifiedOnPage.length > 0 && (
                      <Checkbox checked={unidentifiedOnPage.length > 0 && unidentifiedOnPage.every((c: any) => selectedIds.has(c.id))} onCheckedChange={toggleSelectAll} />
                    )}
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>CRM</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Corridas</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Saldo (R$)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items?.map((c: any) => {
                  const tier = getTierInfo(c.customer_tier || "INICIANTE");
                  const crmStatus = CRM_SYNC_LABELS[c.crm_sync_status || "NONE"];
                  return (
                    <TableRow key={c.id} className={isUnidentified(c) ? "bg-yellow-500/5" : ""}>
                      <TableCell>
                        {isUnidentified(c) && <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} />}
                      </TableCell>
                      <TableCell className="font-medium">
                        {c.name}
                        {isUnidentified(c) && <Badge variant="outline" className="ml-2 text-xs border-yellow-400 text-yellow-700">Não identificado</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${tier.color}`}>{tier.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {crmStatus.label && <Badge variant="outline" className={`text-xs ${crmStatus.color}`}>{crmStatus.label}</Badge>}
                      </TableCell>
                      <TableCell>{c.phone || "—"}</TableCell>
                      <TableCell>{c.cpf || "—"}</TableCell>
                      <TableCell>{c.ride_count || 0}</TableCell>
                      <TableCell>{c.points_balance}</TableCell>
                      <TableCell>R$ {Number(c.money_balance).toFixed(2)}</TableCell>
                      <TableCell><Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Ativo" : "Inativo"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setLedgerCustomer(c)} title="Extrato"><ScrollText className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CustomerLedgerDrawer customer={ledgerCustomer} open={!!ledgerCustomer} onOpenChange={open => { if (!open) setLedgerCustomer(null); }} />

      <Dialog open={bulkOpen} onOpenChange={v => { if (!v) { setBulkOpen(false); setBulkForm({ name: "", cpf: "", phone: "" }); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Identificar {selectedIds.size} cliente(s)</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Preencha os dados que deseja atualizar. Campos vazios serão ignorados.</p>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Nome</Label><Input value={bulkForm.name} onChange={e => setBulkForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do cliente" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>CPF</Label><Input value={bulkForm.cpf} onChange={e => setBulkForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={bulkForm.phone} onChange={e => setBulkForm(f => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" /></div>
            </div>
            <Button className="w-full" disabled={!bulkForm.name.trim() && !bulkForm.cpf.trim() && !bulkForm.phone.trim()} onClick={() => bulkIdentifyMutation.mutate()}>
              <UserCheck className="h-4 w-4 mr-2" /> Salvar identificação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
