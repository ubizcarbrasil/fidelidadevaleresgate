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
import { Plus, Send, Clock, CheckCircle, Megaphone } from "lucide-react";

const CHANNEL_OPTIONS = [
  { value: "WHATSAPP", label: "WhatsApp — R$ 0,50/envio" },
  { value: "PUSH", label: "Push — R$ 0,03/envio" },
  { value: "EMAIL", label: "E-mail — R$ 0,03/envio" },
];

const COST_MAP: Record<string, number> = { WHATSAPP: 0.50, PUSH: 0.03, EMAIL: 0.03 };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  PENDING_APPROVAL: "Aguardando Aprovação",
  APPROVED: "Aprovada",
  SCHEDULED: "Agendada",
  SENT: "Enviada",
  CANCELLED: "Cancelada",
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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>← Voltar</Button>
          <h2 className="font-semibold">Nova Solicitação de Campanha</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Promoção de verão" />
          </div>
          <div>
            <Label>Público alvo</Label>
            <Select value={audienceId} onValueChange={setAudienceId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {(audiences || []).map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name} ({a.estimated_count})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Canal</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mensagem</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Olá {nome}!" rows={3} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Giftback (%)</Label>
              <Input type="number" value={giftback} onChange={(e) => setGiftback(e.target.value)} />
            </div>
            <div>
              <Label>Compra mín (R$)</Label>
              <Input type="number" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} />
            </div>
            <div>
              <Label>Validade (dias)</Label>
              <Input type="number" value={validityDays} onChange={(e) => setValidityDays(e.target.value)} />
            </div>
          </div>

          {selectedAudience && (
            <Card className="bg-muted/50">
              <CardContent className="pt-3 pb-3 text-sm">
                <div className="flex justify-between">
                  <span>{selectedAudience.estimated_count} destinatários × R$ {costPerSend.toFixed(2)}</span>
                  <span className="font-bold text-primary">R$ {totalCost.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!title || !audienceId || createMutation.isPending}>
            {createMutation.isPending ? "Enviando..." : "Solicitar Aprovação"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Minhas Campanhas</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nova
        </Button>
      </div>

      {(campaigns || []).map((c: any) => (
        <Card key={c.id}>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.channel} · {c.total_recipients} destinatários · R$ {Number(c.total_cost).toFixed(2)}</p>
              </div>
              <Badge variant="secondary">{STATUS_LABELS[c.status] || c.status}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}

      {(campaigns || []).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma campanha criada</p>
          <p className="text-xs">Solicite campanhas para divulgar suas ofertas</p>
        </div>
      )}
    </div>
  );
}
