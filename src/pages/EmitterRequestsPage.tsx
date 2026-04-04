import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, X, Clock, Zap, Store, Loader2, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EmitterRequestsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("PENDING");
  const [selected, setSelected] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["store_type_requests", "admin", filter],
    queryFn: async () => {
      let query = supabase
        .from("store_type_requests")
        .select("*, stores:store_id(name, logo_url, category, segment, store_type)")
        .order("requested_at", { ascending: false });

      if (filter !== "ALL") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "APPROVED" | "REJECTED" }) => {
      // Update request status
      const { error: reqError } = await supabase
        .from("store_type_requests")
        .update({
          status: action,
          resolved_at: new Date().toISOString(),
          rejection_reason: action === "REJECTED" ? rejectionReason : null,
        })
        .eq("id", id);
      if (reqError) throw reqError;

      // If approved, update the store's type
      if (action === "APPROVED" && selected) {
        const { error: storeError } = await supabase
          .from("stores")
          .update({ store_type: selected.requested_type })
          .eq("id", selected.store_id);
        if (storeError) throw storeError;
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["store_type_requests"] });
      toast({
        title: action === "APPROVED" ? "Solicitação aprovada!" : "Solicitação rejeitada",
        description: action === "APPROVED"
          ? "O parceiro agora pode emitir pontos."
          : "O parceiro foi notificado.",
      });
      setSelected(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({ title: "Erro ao processar", variant: "destructive" });
    },
  });

  const typeLabel = (t: string) => {
    switch (t) {
      case "RECEPTORA": return "Receptora";
      case "EMISSORA": return "Emissora";
      case "MISTA": return "Mista";
      default: return t;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "APPROVED": return <Badge variant="outline" className="border-green-400 text-green-700 bg-green-50"><Check className="h-3 w-3 mr-1" />Aprovada</Badge>;
      case "REJECTED": return <Badge variant="outline" className="border-red-400 text-red-700 bg-red-50"><X className="h-3 w-3 mr-1" />Rejeitada</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Solicitações de Emissor" description="Parceiros solicitando ativação como Emissor de pontos." />

      <div className="flex flex-wrap gap-2">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f === "PENDING" ? "Pendentes" : f === "APPROVED" ? "Aprovadas" : f === "REJECTED" ? "Rejeitadas" : "Todas"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : !requests?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma solicitação encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req: any) => {
            const store = req.stores;
            return (
              <div
                key={req.id}
                onClick={() => { setSelected(req); setRejectionReason(""); }}
                className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  {store?.logo_url ? (
                    <img src={store.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{store?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {typeLabel(req.current_type)} → {typeLabel(req.requested_type)}
                  </p>
                </div>
                {statusBadge(req.status)}
                <span className="text-xs text-muted-foreground shrink-0">
                  {format(new Date(req.requested_at), "dd/MM/yy", { locale: ptBR })}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes da Solicitação
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                  {selected.stores?.logo_url ? (
                    <img src={selected.stores.logo_url} className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-bold">{selected.stores?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selected.stores?.category} · {selected.stores?.segment}
                  </p>
                </div>
                {statusBadge(selected.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo atual:</span>
                  <p className="font-medium">{typeLabel(selected.current_type)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo solicitado:</span>
                  <p className="font-medium text-amber-700">{typeLabel(selected.requested_type)}</p>
                </div>
              </div>

              {selected.reason && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Justificativa:</span>
                  <p className="mt-0.5 bg-muted/50 rounded-lg p-2.5">{selected.reason}</p>
                </div>
              )}

              {selected.status === "PENDING" && (
                <div>
                  <p className="text-sm font-medium mb-1.5">Motivo da rejeição (se aplicável)</p>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Descreva o motivo..."
                    rows={3}
                  />
                </div>
              )}

              {selected.status === "REJECTED" && selected.rejection_reason && (
                <div className="text-sm bg-destructive/10 text-destructive rounded-lg p-2.5">
                  <p className="font-medium">Motivo da rejeição:</p>
                  <p className="mt-0.5">{selected.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          {selected?.status === "PENDING" && (
            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                onClick={() => resolveMutation.mutate({ id: selected.id, action: "REJECTED" })}
                disabled={resolveMutation.isPending}
              >
                {resolveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                Rejeitar
              </Button>
              <Button
                onClick={() => resolveMutation.mutate({ id: selected.id, action: "APPROVED" })}
                disabled={resolveMutation.isPending}
              >
                {resolveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                Aprovar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
