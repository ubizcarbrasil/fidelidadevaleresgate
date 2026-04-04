import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Megaphone, ArrowLeft } from "lucide-react";

const CHANNEL_OPTIONS = [
  { value: "WHATSAPP", label: "WhatsApp — R$ 0,50/envio" },
  { value: "PUSH", label: "Push — R$ 0,03/envio" },
  { value: "EMAIL", label: "E-mail — R$ 0,03/envio" },
];

const COST_MAP: Record<string, number> = { WHATSAPP: 0.50, PUSH: 0.03, EMAIL: 0.03 };

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Rascunho", className: "bg-muted/60 text-muted-foreground" },
  PENDING_APPROVAL: { label: "Aguardando", className: "bg-warning/15 text-warning" },
  APPROVED: { label: "Aprovada", className: "bg-success/15 text-success" },
  SCHEDULED: { label: "Agendada", className: "bg-primary/15 text-primary" },
  SENT: { label: "Enviada", className: "bg-success/15 text-success" },
  CANCELLED: { label: "Cancelada", className: "bg-destructive/15 text-destructive" },
};

export default function StoreCampaignTab({ store }: { store: any }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState("PUSH");
  const [giftback, setGiftback] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [validityDays, setValidityDays] = useState("7");

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["store-campaigns", store.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_campaigns")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: audiences } = useQuery({
    queryKey: ["store-audiences", store.brand_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_audiences")
        .select("id, name, estimated_count")
        .eq("brand_id", store.brand_id)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const [audienceId, setAudienceId] = useState("");
  const selectedAudience = audiences?.find(a => a.id === audienceId);
  const costPerSend = COST_MAP[channel] || 0.03;
  const totalCost = (selectedAudience?.estimated_count || 0) * costPerSend;

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("crm_campaigns").insert({
        brand_id: store.brand_id,
        store_id: store.id,
        audience_id: audienceId || null,
        title,
        message_template: message,
        channel,
        cost_per_send: costPerSend,
        total_cost: totalCost,
        total_recipients: selectedAudience?.estimated_count || 0,
        status: "PENDING_APPROVAL",
        offer_config_json: {
          giftback_value: giftback ? Number(giftback) : null,
          min_purchase: minPurchase ? Number(minPurchase) : null,
          validity_days: Number(validityDays) || 7,
          store_name: store.name,
        },
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-campaigns"] });
      setShowForm(false);
      setTitle(""); setMessage(""); setChannel("PUSH"); setAudienceId("");
      setGiftback(""); setMinPurchase(""); setValidityDays("7");
      toast({ title: "Campanha enviada para aprovação do empreendedor" });
    },
    onError: () => toast({ title: "Erro ao criar campanha", variant: "destructive" }),
  });

  if (showForm) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="rounded-xl gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <h2 className="font-semibold">Nova Campanha</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Promoção de verão" className="rounded-xl" />
          </div>
          <div>
            <Label className="text-xs">Público alvo</Label>
            <Select value={audienceId} onValueChange={setAudienceId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {(audiences || []).map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name} ({a.estimated_count})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Canal</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Mensagem</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Olá {nome}!" rows={3} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[10px]">Giftback (%)</Label>
              <Input type="number" value={giftback} onChange={(e) => setGiftback(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-[10px]">Compra mín (R$)</Label>
              <Input type="number" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-[10px]">Validade (dias)</Label>
              <Input type="number" value={validityDays} onChange={(e) => setValidityDays(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          {selectedAudience && (
            <Card className="rounded-2xl border-0 shadow-sm glow-primary bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="pt-3 pb-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{selectedAudience.estimated_count} destinatários × R$ {costPerSend.toFixed(2)}</span>
                  <span className="font-bold text-lg text-primary">R$ {totalCost.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            onClick={() => createMutation.mutate()}
            disabled={!title || !audienceId || createMutation.isPending}
          >
            {createMutation.isPending ? "Enviando..." : "Solicitar Aprovação"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Minhas Campanhas</h2>
          <p className="text-xs text-muted-foreground">Solicite e acompanhe campanhas</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="rounded-xl gap-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
          <Plus className="h-4 w-4" /> Nova
        </Button>
      </div>

      {(campaigns || []).map((c: any) => {
        const status = STATUS_CONFIG[c.status] || { label: c.status, className: "bg-muted/60 text-muted-foreground" };
        return (
          <Card key={c.id} className="rounded-2xl border-0 shadow-sm kpi-card-gradient hover-scale">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.channel} · {c.total_recipients} destinatários · R$ {Number(c.total_cost).toFixed(2)}</p>
                </div>
                <Badge className={`text-[10px] rounded-full border-0 ${status.className}`}>{status.label}</Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {(campaigns || []).length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="h-8 w-8 opacity-30" />
          </div>
          <p className="font-semibold text-sm">Nenhuma campanha criada</p>
          <p className="text-xs mt-1">Solicite campanhas para divulgar suas ofertas</p>
        </div>
      )}
    </div>
  );
}
