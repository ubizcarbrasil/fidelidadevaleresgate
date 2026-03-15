import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Zap, Clock, Check, X, Loader2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Props {
  store: any;
  onUpgraded?: () => void;
}

export default function EmitterUpgradeCard({ store, onUpgraded }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [requestedType, setRequestedType] = useState<"EMISSORA" | "MISTA">("MISTA");
  const [reason, setReason] = useState("");

  const { data: pendingRequest, isLoading } = useQuery({
    queryKey: ["store_type_requests", store.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_type_requests")
        .select("*")
        .eq("store_id", store.id)
        .order("requested_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("store_type_requests").insert({
        store_id: store.id,
        brand_id: store.brand_id,
        requested_type: requestedType,
        current_type: store.store_type,
        reason: reason.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store_type_requests", store.id] });
      toast({ title: "Solicitação enviada!", description: "Aguarde a aprovação do administrador." });
      setOpen(false);
      setReason("");
    },
    onError: () => {
      toast({ title: "Erro ao enviar", variant: "destructive" });
    },
  });

  // Don't show if already EMISSORA or MISTA
  if (store.store_type !== "RECEPTORA") return null;

  const hasPending = pendingRequest?.status === "PENDING";
  const wasRejected = pendingRequest?.status === "REJECTED";

  return (
    <>
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-warning/8 to-warning/3">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-warning" />
            Tornar-se Emissor de Pontos
          </CardTitle>
          <CardDescription className="text-xs">
            Emissores podem pontuar clientes e oferecer um programa de fidelidade próprio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : hasPending ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-warning/40 text-warning bg-warning/10">
                <Clock className="h-3 w-3 mr-1" /> Aguardando aprovação
              </Badge>
            </div>
          ) : (
            <div className="space-y-2">
              {wasRejected && (
                <div className="text-xs text-destructive bg-destructive/10 rounded-lg p-2">
                  <p className="font-medium">Última solicitação rejeitada</p>
                  {pendingRequest?.rejection_reason && (
                    <p className="mt-0.5 opacity-80">{pendingRequest.rejection_reason}</p>
                  )}
                </div>
              )}
              <Button size="sm" onClick={() => setOpen(true)} className="w-full">
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Solicitar Ativação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-warning" />
              Solicitar Ativação como Emissor
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Tipo desejado</Label>
              <RadioGroup value={requestedType} onValueChange={(v) => setRequestedType(v as any)}>
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="MISTA" id="mista" className="mt-0.5" />
                  <Label htmlFor="mista" className="cursor-pointer">
                    <p className="font-medium text-sm">Mista</p>
                    <p className="text-xs text-muted-foreground">Recebe resgates e emite pontos</p>
                  </Label>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="EMISSORA" id="emissora" className="mt-0.5" />
                  <Label htmlFor="emissora" className="cursor-pointer">
                    <p className="font-medium text-sm">Emissora</p>
                    <p className="text-xs text-muted-foreground">Apenas emite pontos para clientes</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Justificativa (opcional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explique por que deseja emitir pontos..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
