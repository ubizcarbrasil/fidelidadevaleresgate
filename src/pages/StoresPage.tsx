import { useState, useEffect } from "react";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Settings, Check, X, Eye, Clock, FileText, Store } from "lucide-react";
import EmptyState from "@/components/customer/EmptyState";
import { toast } from "sonner";
import { DataTableControls } from "@/components/DataTableControls";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import ImageUploadField from "@/components/ImageUploadField";
import DataSkeleton from "@/components/DataSkeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PAGE_SIZE = 20;

interface StoreForm {
  name: string; slug: string; category: string; address: string; whatsapp: string;
  brand_id: string; branch_id: string; is_active: boolean; logo_url: string;
}
const emptyForm: StoreForm = { name: "", slug: "", category: "", address: "", whatsapp: "", brand_id: "", branch_id: "", is_active: true, logo_url: "" };

type StatusTab = "ALL" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export default function StoresPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<StoreForm>(emptyForm);
  const { search, debouncedSearch, page, setPage, onSearchChange } = useDebouncedSearch();
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL");

  // Approval detail dialog
  const [detailStore, setDetailStore] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);

  // Auto-set brand_id for non-root users
  useEffect(() => {
    if (!isRootAdmin && currentBrandId && !form.brand_id) {
      setForm(f => ({ ...f, brand_id: currentBrandId }));
    }
  }, [isRootAdmin, currentBrandId]);

  // Pending count for badge
  const { data: pendingCount } = useQuery({
    queryKey: ["stores-pending-count", currentBrandId],
    queryFn: async () => {
      let q = supabase.from("stores").select("id", { count: "exact", head: true }).eq("approval_status", "PENDING_APPROVAL" as any);
      if (!isRootAdmin && currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { count } = await q;
      return count || 0;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["stores", debouncedSearch, page, currentBrandId, statusTab],
    queryFn: async () => {
      let query = supabase.from("stores").select("*, brands(name), branches(name)", { count: "exact" });
      if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);
      if (debouncedSearch) query = query.ilike("name", `%${debouncedSearch}%`);
      if (statusTab !== "ALL") query = query.eq("approval_status", statusTab as any);
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
      const payload = { name: form.name, slug: form.slug, category: form.category || null, address: form.address || null, whatsapp: form.whatsapp || null, brand_id: form.brand_id, branch_id: form.branch_id, is_active: form.is_active, logo_url: form.logo_url || null };
      if (editId) { const { error } = await supabase.from("stores").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("stores").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stores"] }); toast.success(editId ? "Parceiro atualizado!" : "Parceiro criado!"); closeDialog(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("stores").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stores"] }); toast.success("Parceiro removido!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (s: any) => { setEditId(s.id); setForm({ name: s.name, slug: s.slug, category: s.category || "", address: s.address || "", whatsapp: s.whatsapp || "", brand_id: s.brand_id, branch_id: s.branch_id, is_active: s.is_active, logo_url: s.logo_url || "" }); setOpen(true); };

  // Approval actions
  const openDetail = async (store: any) => {
    setDetailStore(store);
    setRejectionReason("");
    const { data } = await supabase.from("store_documents").select("*").eq("store_id", store.id);
    setDocs(data || []);
  };

  const handleApprove = async () => {
    if (!detailStore) return;
    setProcessing(true);
    const { error } = await supabase
      .from("stores")
      .update({ approval_status: "APPROVED", approved_at: new Date().toISOString(), is_active: true })
      .eq("id", detailStore.id);
    if (error) { toast.error(error.message); }
    else { toast.success("Parceiro aprovado!"); setDetailStore(null); qc.invalidateQueries({ queryKey: ["stores"] }); qc.invalidateQueries({ queryKey: ["stores-pending-count"] }); }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!detailStore || !rejectionReason.trim()) { toast.error("Informe o motivo da rejeição"); return; }
    setProcessing(true);
    const { error } = await supabase
      .from("stores")
      .update({ approval_status: "REJECTED", rejection_reason: rejectionReason })
      .eq("id", detailStore.id);
    if (error) { toast.error(error.message); }
    else { toast.success("Parceiro rejeitado"); setDetailStore(null); qc.invalidateQueries({ queryKey: ["stores"] }); qc.invalidateQueries({ queryKey: ["stores-pending-count"] }); }
    setProcessing(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL": return <Badge variant="outline" className="border-yellow-400 text-yellow-700 bg-yellow-50"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "APPROVED": return <Badge variant="outline" className="border-green-400 text-green-700 bg-green-50"><Check className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case "REJECTED": return <Badge variant="outline" className="border-red-400 text-red-700 bg-red-50"><X className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case "DRAFT": return <Badge variant="secondary">Rascunho</Badge>;
      default: return <Badge variant="secondary">{status || "—"}</Badge>;
    }
  };

  const typeLabel = (t: string) => {
    switch (t) { case "RECEPTORA": return "Receptora"; case "EMISSORA": return "Emissora"; case "MISTA": return "Mista"; default: return t || ""; }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Parceiros</h2>
          <p className="text-muted-foreground">Gerencie e aprove os estabelecimentos parceiros</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild><Button className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />Novo Parceiro</Button></DialogTrigger>
          <DialogContent className="max-w-lg w-[calc(100vw-2rem)]">
            <DialogHeader><DialogTitle>{editId ? "Editar Parceiro" : "Novo Parceiro"}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Logo do Parceiro</Label>
                <ImageUploadField
                  value={form.logo_url}
                  onChange={url => setForm(f => ({ ...f, logo_url: url }))}
                  folder="stores/logos"
                  label="Logo"
                  aspectRatio={1}
                  previewClassName="h-16 w-16 rounded-xl object-cover"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Identificador</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /></div>
              </div>
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
                  <Label>Cidade</Label>
                  <Select value={form.branch_id} onValueChange={v => setForm(f => ({ ...f, branch_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{filteredBranches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
                <div className="space-y-2"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Endereço</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Ativo</Label></div>
              <Button onClick={() => save.mutate()} disabled={!form.name || !form.slug || !form.brand_id || !form.branch_id || save.isPending} className="w-full">{save.isPending ? "Salvando..." : "Salvar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status tabs */}
      <Tabs value={statusTab} onValueChange={v => { setStatusTab(v as StatusTab); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="ALL">Todos</TabsTrigger>
          <TabsTrigger value="PENDING_APPROVAL" className="gap-1.5">
            Pendentes
            {(pendingCount ?? 0) > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[10px] font-bold">
                {pendingCount! > 99 ? "99+" : pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="APPROVED">Aprovados</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejeitados</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTableControls search={search} onSearchChange={onSearchChange} searchPlaceholder="Buscar parceiro por nome..." page={page} pageSize={PAGE_SIZE} totalCount={data?.total || 0} onPageChange={setPage} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Aprovação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="p-0 border-0"><DataSkeleton variant="table-row" rows={5} /></TableCell></TableRow>}
              {!isLoading && data?.items?.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-0">
                  <EmptyState type="generic" title="Nenhum parceiro encontrado" description="Cadastre uma loja parceira para começar." />
                </TableCell></TableRow>
              )}
              {data?.items?.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {s.logo_url ? (
                        <img src={s.logo_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                          <Store className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      {s.name}
                    </div>
                  </TableCell>
                  <TableCell>{(s.brands as any)?.name}</TableCell>
                  <TableCell>{(s.branches as any)?.name}</TableCell>
                  <TableCell>{s.category || "—"}</TableCell>
                  <TableCell>{statusBadge(s.approval_status)}</TableCell>
                  <TableCell><Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    {s.approval_status === "PENDING_APPROVAL" && (
                      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => openDetail(s)}>
                        <Eye className="h-3.5 w-3.5" /> Revisar
                      </Button>
                    )}
                    <Button variant="default" size="sm" className="gap-1 text-xs" onClick={() => navigate(`/store-panel?storeId=${s.id}`)}>
                      <Settings className="h-3.5 w-3.5" /> Gerenciar
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>Tem certeza que deseja excluir o parceiro "{s.name}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove.mutate(s.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
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

      {/* Approval Detail Dialog */}
      <Dialog open={!!detailStore} onOpenChange={() => setDetailStore(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes do Cadastro
            </DialogTitle>
          </DialogHeader>

          {detailStore && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                  {detailStore.logo_url ? (
                    <img src={detailStore.logo_url} className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-lg">{detailStore.name}</p>
                  <p className="text-sm text-muted-foreground">{typeLabel(detailStore.store_type)} · {detailStore.category}</p>
                </div>
                {statusBadge(detailStore.approval_status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">CNPJ:</span> {detailStore.cnpj || "—"}</div>
                <div><span className="text-muted-foreground">Email:</span> {detailStore.email || "—"}</div>
                <div><span className="text-muted-foreground">Telefone:</span> {detailStore.phone || "—"}</div>
                <div><span className="text-muted-foreground">Segmento:</span> {detailStore.segment || "—"}</div>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Endereço:</span>
                <p>{detailStore.address || "—"}</p>
              </div>

              {detailStore.tags && detailStore.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {detailStore.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}

              {docs.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Documentos</p>
                  <div className="space-y-1.5">
                    {docs.map((doc: any) => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{doc.document_type.replace("_", " ")}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {detailStore.submitted_at && (
                <p className="text-xs text-muted-foreground">
                  Enviado em {format(new Date(detailStore.submitted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}

              {detailStore.approval_status === "PENDING_APPROVAL" && (
                <div>
                  <p className="text-sm font-semibold mb-1.5">Motivo da rejeição (se aplicável)</p>
                  <Textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Descreva o motivo..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          {detailStore?.approval_status === "PENDING_APPROVAL" && (
            <DialogFooter className="gap-2">
              <Button variant="destructive" onClick={handleReject} disabled={processing}>
                <X className="h-4 w-4 mr-1" /> Rejeitar
              </Button>
              <Button onClick={handleApprove} disabled={processing}>
                <Check className="h-4 w-4 mr-1" /> Aprovar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
