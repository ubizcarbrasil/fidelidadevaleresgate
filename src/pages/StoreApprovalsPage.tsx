import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, X, Eye, Clock, Store, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBrandGuard } from "@/hooks/useBrandGuard";

interface StoreSubmission {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  category: string;
  segment: string;
  store_type: string;
  address: string;
  approval_status: string;
  submitted_at: string;
  logo_url: string | null;
  owner_user_id: string;
  tags: string[];
}

export default function StoreApprovalsPage() {
  const { user } = useAuth();
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const [stores, setStores] = useState<StoreSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING_APPROVAL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<StoreSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);

  const fetchStores = async () => {
    setLoading(true);
    let query = supabase
      .from("stores")
      .select("id, name, cnpj, email, phone, category, segment, store_type, address, approval_status, submitted_at, logo_url, owner_user_id, tags")
      .neq("approval_status", "DRAFT" as any)
      .order("submitted_at", { ascending: false });

    if (filter !== "ALL") {
      query = query.eq("approval_status", filter as any);
    }

    const { data } = await query;
    setStores((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchStores(); }, [filter]);

  const openDetail = async (store: StoreSubmission) => {
    setSelected(store);
    setRejectionReason("");
    const { data } = await supabase
      .from("store_documents")
      .select("*")
      .eq("store_id", store.id);
    setDocs(data || []);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setProcessing(true);
    const { error } = await supabase
      .from("stores")
      .update({ approval_status: "APPROVED", approved_at: new Date().toISOString(), is_active: true })
      .eq("id", selected.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      // store_admin role is auto-assigned by DB trigger (trg_auto_assign_store_admin)
      toast({ title: "Parceiro aprovado!" });
      setSelected(null);
      fetchStores();
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selected || !rejectionReason.trim()) {
      toast({ title: "Informe o motivo da rejeição", variant: "destructive" });
      return;
    }
    setProcessing(true);
    const { error } = await supabase
      .from("stores")
      .update({ approval_status: "REJECTED", rejection_reason: rejectionReason })
      .eq("id", selected.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Parceiro rejeitado" });
      setSelected(null);
      fetchStores();
    }
    setProcessing(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL": return <Badge variant="outline" className="border-yellow-400 text-yellow-700 bg-yellow-50"><Clock className="h-3 w-3 mr-1" />Em análise</Badge>;
      case "APPROVED": return <Badge variant="outline" className="border-green-400 text-green-700 bg-green-50"><Check className="h-3 w-3 mr-1" />Aprovada</Badge>;
      case "REJECTED": return <Badge variant="outline" className="border-red-400 text-red-700 bg-red-50"><X className="h-3 w-3 mr-1" />Rejeitada</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const typeLabel = (t: string) => {
    switch (t) { case "RECEPTORA": return "Receptora"; case "EMISSORA": return "Emissora"; case "MISTA": return "Mista"; default: return t; }
  };

  const filtered = stores.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.cnpj || "").includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aprovação de Parceiros</h1>
        <p className="text-sm text-muted-foreground">Revise e aprove cadastros de estabelecimentos</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {["PENDING_APPROVAL", "APPROVED", "REJECTED", "ALL"].map(f => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "PENDING_APPROVAL" ? "Pendentes" :
             f === "APPROVED" ? "Aprovadas" :
             f === "REJECTED" ? "Rejeitadas" : "Todas"}
          </Button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou CNPJ" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-64" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum parceiro encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(store => (
            <div
              key={store.id}
              onClick={() => openDetail(store)}
              className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {store.logo_url ? (
                  <img src={store.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Store className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{store.name}</p>
                <p className="text-xs text-muted-foreground">{store.category} · {typeLabel(store.store_type)} · {store.cnpj}</p>
              </div>
              {statusBadge(store.approval_status)}
              {store.submitted_at && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {format(new Date(store.submitted_at), "dd/MM/yy", { locale: ptBR })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes do Cadastro
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                  {selected.logo_url ? (
                    <img src={selected.logo_url} className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-lg">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">{typeLabel(selected.store_type)} · {selected.category}</p>
                </div>
                {statusBadge(selected.approval_status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">CNPJ:</span> {selected.cnpj || "—"}</div>
                <div><span className="text-muted-foreground">Email:</span> {selected.email || "—"}</div>
                <div><span className="text-muted-foreground">Telefone:</span> {selected.phone || "—"}</div>
                <div><span className="text-muted-foreground">Segmento:</span> {selected.segment || "—"}</div>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Endereço:</span>
                <p>{selected.address || "—"}</p>
              </div>

              {selected.tags && selected.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selected.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Documents */}
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

              {/* Rejection reason input */}
              {selected.approval_status === "PENDING_APPROVAL" && (
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

          {selected?.approval_status === "PENDING_APPROVAL" && (
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
