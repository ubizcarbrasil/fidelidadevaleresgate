import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Send, Save, Check, Loader2, CheckCircle, MapPin, MessageSquare,
} from "lucide-react";
import type { Integration, Branch } from "../hooks/hook_integracoes";

interface Props {
  brandId: string;
  integrations: Integration[];
  activeIntegrations: Integration[];
  branches: Branch[];
  getBranchName: (id: string | null) => string;
}

export function AbaNotificacoes({
  brandId,
  integrations,
  activeIntegrations,
  branches,
  getBranchName,
}: Props) {
  const queryClient = useQueryClient();

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramSaved, setTelegramSaved] = useState(false);
  const [driverMessageEnabled, setDriverMessageEnabled] = useState(false);

  const selectedIntegration = selectedBranchId
    ? integrations.find((i) => i.branch_id === selectedBranchId && i.is_active)
    : null;

  useEffect(() => {
    if (selectedIntegration) {
      setTelegramChatId((selectedIntegration as any)?.telegram_chat_id || "");
      setDriverMessageEnabled((selectedIntegration as any)?.driver_message_enabled ?? false);
    }
  }, [selectedIntegration?.id]);

  const saveTelegramMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIntegration?.id) throw new Error("Integration not found");
      const { error } = await (supabase as any)
        .from("machine_integrations")
        .update({ telegram_chat_id: telegramChatId || null })
        .eq("id", selectedIntegration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setTelegramSaved(true);
      setTimeout(() => setTelegramSaved(false), 2000);
      toast({ title: "Chat ID do Telegram salvo!" });
      queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const testTelegramMutation = useMutation({
    mutationFn: async () => {
      if (!telegramChatId.trim()) throw new Error("Chat ID vazio");
      const branchName = getBranchName(selectedIntegration?.branch_id || null);
      const { data, error } = await supabase.functions.invoke("send-telegram-ride-notification", {
        body: {
          chat_id: telegramChatId.trim(),
          customer_name: "Teste de Conexão",
          customer_phone: "(00) 00000-0000",
          city_name: branchName,
          ride_value: 25.50,
          points_credited: 25,
          finalized_at: new Date().toISOString(),
          machine_ride_id: "TESTE-000",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "✅ Mensagem de teste enviada!", description: "Verifique o chat do Telegram." });
    },
    onError: (err: any) => {
      toast({ title: "Erro no envio de teste", description: err.message || "Verifique o Chat ID.", variant: "destructive" });
    },
  });

  const handleToggleDriverMessage = (val: boolean) => {
    setDriverMessageEnabled(val);
    if (!selectedIntegration?.id) return;
    (supabase as any)
      .from("machine_integrations")
      .update({ driver_message_enabled: val })
      .eq("id", selectedIntegration.id)
      .then(({ error }: any) => {
        if (error) {
          toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
          setDriverMessageEnabled(!val);
        } else {
          toast({ title: val ? "Notificação ativada" : "Notificação desativada" });
          queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
        }
      });
  };

  if (activeIntegrations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Send className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhuma cidade ativa.</p>
          <p className="text-xs mt-1">Ative uma cidade na aba "Pontuar Motorista" para configurar notificações.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Explicação da aba */}
      <Alert className="border-primary/20 bg-primary/5">
        <MessageSquare className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Notificações</strong> — Configure como os motoristas são notificados a cada corrida finalizada.
          Usa as <strong>credenciais da cidade</strong> (cadastradas na aba Motorista) para enviar mensagens no app TaxiMachine. Telegram usa bot próprio, sem credenciais da TaxiMachine.
        </AlertDescription>
      </Alert>

      {/* Seletor de cidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-primary" />
            Selecionar cidade
          </CardTitle>
          <CardDescription>Escolha a cidade para configurar as notificações. Cada cidade tem suas próprias configurações.</CardDescription>
        </CardHeader>
        <CardContent className="max-w-md">
          <Select value={selectedBranchId || ""} onValueChange={setSelectedBranchId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a cidade..." />
            </SelectTrigger>
            <SelectContent>
              {activeIntegrations.map((integ) => (
                <SelectItem key={integ.id} value={integ.branch_id || ""}>
                  {getBranchName(integ.branch_id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedIntegration && (
        <>
          {/* Notificação no app */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Send className="h-4 w-4 text-primary" />
                Notificação ao motorista no app
              </CardTitle>
              <CardDescription>
                Envia uma mensagem automática no app TaxiMachine para o motorista usando as <strong>credenciais da cidade</strong> cadastradas na aba Motorista.
                Informa pontos ganhos, valor da corrida e saldo atualizado a cada corrida finalizada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Notificação ativada</Label>
                <Switch checked={driverMessageEnabled} onCheckedChange={handleToggleDriverMessage} />
              </div>
              {driverMessageEnabled && (
                <Alert className="border-primary/30 bg-primary/5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-xs">
                    Motoristas receberão uma mensagem no app com: pontos ganhos, valor da corrida e saldo atualizado.
                  </AlertDescription>
                </Alert>
              )}
              {!driverMessageEnabled && (
                <p className="text-xs text-muted-foreground">
                  As notificações estão desativadas para esta cidade. Ative para que os motoristas sejam notificados automaticamente.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Telegram */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Send className="h-4 w-4 text-primary" />
                Telegram — Alertas em grupo
              </CardTitle>
              <CardDescription>
                Receba um alerta no Telegram a cada corrida finalizada com pontuação. Ideal para acompanhar em tempo real.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-w-lg">
              <div className="flex items-center gap-2">
                <Input
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="-1001234567890"
                />
                <Button variant="outline" size="icon" onClick={() => saveTelegramMutation.mutate()} disabled={saveTelegramMutation.isPending}>
                  {telegramSaved ? <Check className="h-4 w-4 text-primary" /> : saveTelegramMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!telegramChatId.trim() || testTelegramMutation.isPending}
                  onClick={() => testTelegramMutation.mutate()}
                >
                  {testTelegramMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                  Testar
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Como configurar:</strong></p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Crie um bot no Telegram falando com <strong>@BotFather</strong></li>
                  <li>Adicione o bot ao grupo desejado</li>
                  <li>Use <strong>@userinfobot</strong> no grupo para obter o Chat ID</li>
                  <li>Cole o Chat ID acima e clique em "Testar"</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
