import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useAuth } from "@/contexts/AuthContext";
import { campaignService, CHANNEL_CONFIG } from "@/modules/crm";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Send, Clock, CheckCircle, XCircle, DollarSign, Megaphone } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  DRAFT: { label: "Rascunho", icon: Clock, color: "bg-gray-100 text-gray-700" },
  PENDING_APPROVAL: { label: "Aguardando Aprovação", icon: Clock, color: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Aprovada", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  PAYMENT_PENDING: { label: "Aguardando Pagamento", icon: DollarSign, color: "bg-yellow-100 text-yellow-700" },
  SCHEDULED: { label: "Agendada", icon: Clock, color: "bg-blue-100 text-blue-700" },
  SENDING: { label: "Enviando", icon: Send, color: "bg-indigo-100 text-indigo-700" },
  SENT: { label: "Enviada", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelada", icon: XCircle, color: "bg-red-100 text-red-700" },
};

export default function CrmCampaignsPage() {
  const { currentBrandId } = useBrandGuard();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<string>("PUSH");
  const [audienceId, setAudienceId] = useState<string>("");
  const [giftbackValue, setGiftbackValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [validityDays, setValidityDays] = useState("7");

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["crm-campaigns", currentBrandId],
    queryFn: () => campaignService.fetchCampaigns(currentBrandId!),
    enabled: !!currentBrandId,
  });

  const { data: audiences } = useQuery({
    queryKey: ["crm-audiences-select", currentBrandId],
    queryFn: () => campaignService.fetchAudiences(currentBrandId!),
    enabled: !!currentBrandId,
  });

  const selectedAudience = audiences?.find((a: any) => a.id === audienceId);
  const channelCfg = CHANNEL_CONFIG[channel as keyof typeof CHANNEL_CONFIG];
  const estimatedCost = (selectedAudience?.estimated_count || 0) * (channelCfg?.cost || 0);

  const createMutation = useMutation({
    mutationFn: () =>
      campaignService.createCampaign({
        brandId: currentBrandId!,
        audienceId,
        title,
        messageTemplate: message,
        channel,
        costPerSend: channelCfg?.cost || 0.03,
        totalCost: estimatedCost,
        totalRecipients: selectedAudience?.estimated_count || 0,
        offerConfig: {
          giftback_value: giftbackValue ? Number(giftbackValue) : null,
          min_purchase: minPurchase ? Number(minPurchase) : null,
          validity_days: Number(validityDays) || 7,
        },
        createdBy: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-campaigns"] });
      setShowCreate(false);
      resetForm();
      toast({ title: "Campanha enviada para aprovação" });
    },
    onError: () => toast({ title: "Erro ao criar campanha", variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => campaignService.approveCampaign(id, user?.id || ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-campaigns"] });
      toast({ title: "Campanha aprovada" });
    },
  });

  function resetForm() {
    setTitle(""); setMessage(""); setChannel("PUSH"); setAudienceId("");
    setGiftbackValue(""); setMinPurchase(""); setValidityDays("7");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Campanhas" description="Gerencie disparos em massa para seus contatos" />
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Campanha
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(campaigns || []).map((c: any) => {
            const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.DRAFT;
            const ch = CHANNEL_CONFIG[c.channel as keyof typeof CHANNEL_CONFIG];
            const StIcon = st.icon;
            return (
              <Card key={c.id}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{c.title}</h3>
                        <Badge variant="secondary" className={st.color}>
                          <StIcon className="h-3 w-3 mr-1" />
                          {st.label}
                        </Badge>
                        {ch && <Badge variant="secondary" className={ch.color}>{ch.label}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{c.message_template}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Público: {c.crm_audiences?.name || "—"}</span>
                        <span>Destinatários: {c.total_recipients}</span>
                        <span>Custo: R$ {Number(c.total_cost).toFixed(2)}</span>
                      </div>
                    </div>
                    {c.status === "PENDING_APPROVAL" && (
                      <Button size="sm" onClick={() => approveMutation.mutate(c.id)}>
                        Aprovar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {(campaigns || []).length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma campanha criada ainda</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Campanha de Disparo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label>Título da campanha</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Promoção de inverno" />
            </div>
            <div>
              <Label>Público alvo</Label>
              <Select value={audienceId} onValueChange={setAudienceId}>
                <SelectTrigger><SelectValue placeholder="Selecione um público" /></SelectTrigger>
                <SelectContent>
                  {(audiences || []).map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.name} ({a.estimated_count} contatos)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Canal de envio</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHATSAPP">WhatsApp — R$ 0,50/envio</SelectItem>
                  <SelectItem value="PUSH">Push — R$ 0,03/envio</SelectItem>
                  <SelectItem value="EMAIL">E-mail — R$ 0,03/envio</SelectItem>
                  <SelectItem value="IN_APP">In-App — R$ 0,01/envio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mensagem (use {"{nome}"}, {"{loja}"}, {"{valor}"})</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Olá {nome}! Aproveite {valor}% de desconto na {loja}..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Valor Giftback (%)</Label>
                <Input type="number" value={giftbackValue} onChange={(e) => setGiftbackValue(e.target.value)} placeholder="10" />
              </div>
              <div>
                <Label>Compra mínima (R$)</Label>
                <Input type="number" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} placeholder="50" />
              </div>
              <div>
                <Label>Validade (dias)</Label>
                <Input type="number" value={validityDays} onChange={(e) => setValidityDays(e.target.value)} />
              </div>
            </div>

            {selectedAudience && (
              <Card className="bg-muted/50">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Destinatários: <strong>{selectedAudience.estimated_count}</strong></span>
                    <span>Custo por envio: <strong>R$ {channelCfg?.cost.toFixed(2)}</strong></span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold">Custo total estimado:</span>
                    <span className="text-lg font-bold text-primary">R$ {estimatedCost.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!title || !audienceId || createMutation.isPending}>
              {createMutation.isPending ? "Enviando..." : "Solicitar Aprovação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
