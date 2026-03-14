import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Car, CheckCircle, XCircle, Loader2, Activity, Clock, Hash, Coins,
  Eye, EyeOff, Copy, Check, Radio, ExternalLink, Save, Link2, KeyRound,
} from "lucide-react";

/* ── Status labels ── */
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  P: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-700 border-yellow-300" },
  A: { label: "Aceita", color: "bg-blue-500/10 text-blue-700 border-blue-300" },
  S: { label: "Em andamento", color: "bg-indigo-500/10 text-indigo-700 border-indigo-300" },
  F: { label: "Finalizada", color: "bg-primary/10 text-primary border-primary/30" },
  C: { label: "Cancelada", color: "bg-destructive/10 text-destructive border-destructive/30" },
  N: { label: "Negada", color: "bg-destructive/10 text-destructive border-destructive/30" },
};

type RideEvent = {
  id: string;
  brand_id: string;
  machine_ride_id: string;
  status_code: string;
  raw_payload: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
};

/* ══════════════════════════════════════════════════════════════════ */

export default function MachineIntegrationPage() {
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();

  const [apiKey, setApiKey] = useState("");
  const [basicUser, setBasicUser] = useState("");
  const [basicPass, setBasicPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("");
  const [callbackSaved, setCallbackSaved] = useState(false);
  const [liveEvents, setLiveEvents] = useState<RideEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const webhookUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/machine-webhook`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  /* ── Query: integration row ── */
  const { data: integration, isLoading } = useQuery({
    queryKey: ["machine-integration", currentBrandId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("machine_integrations")
        .select("*")
        .eq("brand_id", currentBrandId!)
        .maybeSingle();
      if (error) throw error;
      return data as {
        id: string; brand_id: string; api_key: string;
        basic_auth_user: string; basic_auth_password: string;
        webhook_registered: boolean; is_active: boolean;
        last_webhook_at: string | null; last_ride_processed_at: string | null;
        total_rides: number; total_points: number;
        callback_url: string | null; created_at: string; updated_at: string;
      } | null;
    },
    enabled: !!currentBrandId,
  });

  useEffect(() => {
    if (integration?.callback_url !== undefined) setCallbackUrl(integration.callback_url || "");
  }, [integration?.callback_url]);

  /* ── Initial events ── */
  useEffect(() => {
    if (!currentBrandId) return;
    (supabase as any)
      .from("machine_ride_events").select("*")
      .eq("brand_id", currentBrandId)
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }: { data: RideEvent[] | null }) => { if (data) setLiveEvents(data); });
  }, [currentBrandId]);

  /* ── Realtime ── */
  useEffect(() => {
    if (!currentBrandId) return;
    const channel = supabase
      .channel(`ride-events-${currentBrandId}`)
      .on("postgres_changes" as any, {
        event: "INSERT", schema: "public", table: "machine_ride_events",
        filter: `brand_id=eq.${currentBrandId}`,
      }, (payload: any) => {
        const ev = payload.new as RideEvent;
        setLiveEvents((prev) => [ev, ...prev].slice(0, 100));
        if (ev.status_code === "F") {
          toast({ title: "🎯 Pontuação creditada!", description: `Corrida #${ev.machine_ride_id} finalizada` });
          queryClient.invalidateQueries({ queryKey: ["machine-integration", currentBrandId] });
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentBrandId, queryClient]);

  /* ── Mutations ── */
  const activateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("register-machine-webhook", {
        body: { brand_id: currentBrandId, api_key: apiKey, basic_auth_user: basicUser, basic_auth_password: basicPass },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Integração ativada!",
        description: data.webhook_registered
          ? "Webhook registrado com sucesso."
          : "Integração ativada, mas o registro automático falhou. Tente novamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["machine-integration"] });
      setApiKey(""); setBasicUser(""); setBasicPass("");
    },
    onError: (err: any) => {
      toast({ title: "Erro ao ativar", description: err.message || "Falha ao ativar.", variant: "destructive" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("register-machine-webhook", {
        body: { brand_id: currentBrandId, action: "deactivate" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Integração desativada" });
      queryClient.invalidateQueries({ queryKey: ["machine-integration"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const saveCallbackMutation = useMutation({
    mutationFn: async () => {
      if (!integration?.id) throw new Error("Integration not found");
      const { error } = await (supabase as any)
        .from("machine_integrations")
        .update({ callback_url: callbackUrl || null })
        .eq("id", integration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setCallbackSaved(true);
      setTimeout(() => setCallbackSaved(false), 2000);
      toast({ title: "URL de retorno salva!" });
      queryClient.invalidateQueries({ queryKey: ["machine-integration"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const isActive = integration?.is_active;

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div className="space-y-6">
      <PageHeader
        title="Integração de Mobilidade"
        description="Conecte sua plataforma de corridas para pontuar clientes automaticamente"
      />

      {/* ─── ACTIVE: Status Dashboard ─── */}
      {isActive && integration && (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
            <StatusCard icon={Activity} label="Status">
              <Badge className="bg-primary text-primary-foreground">Ativo</Badge>
            </StatusCard>
            <StatusCard icon={Clock} label="Último evento">
              <span className="text-sm font-medium">
                {integration.last_webhook_at ? new Date(integration.last_webhook_at).toLocaleString("pt-BR") : "—"}
              </span>
            </StatusCard>
            <StatusCard icon={Car} label="Última corrida">
              <span className="text-sm font-medium">
                {integration.last_ride_processed_at ? new Date(integration.last_ride_processed_at).toLocaleString("pt-BR") : "—"}
              </span>
            </StatusCard>
            <StatusCard icon={Hash} label="Corridas">
              <span className="text-2xl font-bold">{integration.total_rides}</span>
            </StatusCard>
            <StatusCard icon={Coins} label="Pontos gerados">
              <span className="text-2xl font-bold">{integration.total_points}</span>
            </StatusCard>
          </div>

          {/* Active info + deactivate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-primary" />
                Integração ativa
              </CardTitle>
              <CardDescription>
                Corridas finalizadas geram pontos automaticamente. Regra: <strong>R$ 1 = 1 ponto</strong> (arredondado para baixo).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Credenciais configuradas</span>
              </div>
              {integration.webhook_registered ? (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Webhook registrado na plataforma</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span>Webhook não registrado — tente desativar e reativar</span>
                </div>
              )}
              <Button
                variant="destructive" size="sm"
                onClick={() => deactivateMutation.mutate()}
                disabled={deactivateMutation.isPending}
              >
                {deactivateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Desativar integração
              </Button>
            </CardContent>
          </Card>

          {/* Callback URL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-4 w-4" />
                URL de retorno (opcional)
              </CardTitle>
              <CardDescription>
                Quando um cliente for pontuado, enviaremos os dados da pontuação para esta URL via POST.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 max-w-lg">
                <Input
                  value={callbackUrl}
                  onChange={(e) => setCallbackUrl(e.target.value)}
                  placeholder="https://seu-sistema.com/webhook/pontuacao"
                  type="url"
                />
                <Button variant="outline" size="icon" onClick={() => saveCallbackMutation.mutate()} disabled={saveCallbackMutation.isPending}>
                  {callbackSaved ? <Check className="h-4 w-4 text-primary" /> : saveCallbackMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Realtime Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Radio className="h-4 w-4 text-primary animate-pulse" />
                Eventos em tempo real
              </CardTitle>
              <CardDescription>Corridas recebidas ao vivo. Finalizadas com pontuação são destacadas.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                {liveEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                    <Radio className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">Aguardando eventos...</p>
                    <p className="text-xs">Os eventos aparecerão aqui em tempo real.</p>
                  </div>
                ) : (
                  <div className="space-y-2" ref={scrollRef}>
                    {liveEvents.map((ev) => {
                      const st = STATUS_LABELS[ev.status_code] || { label: ev.status_code, color: "bg-muted text-muted-foreground" };
                      const isFinalized = ev.status_code === "F";
                      const payload = ev.raw_payload as Record<string, unknown>;
                      return (
                        <div key={ev.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${isFinalized ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                          <Badge variant="outline" className={`text-xs shrink-0 ${st.color}`}>{st.label}</Badge>
                          <span className="font-mono text-xs text-muted-foreground shrink-0">#{ev.machine_ride_id}</span>
                          {isFinalized && payload?.ride_value !== undefined && (
                            <span className="text-xs font-medium text-primary shrink-0">
                              R$ {Number(payload.ride_value || 0).toFixed(2)} → {Math.floor(Number(payload.ride_value || 0))} pts
                            </span>
                          )}
                          <span className="ml-auto text-xs text-muted-foreground shrink-0">
                            {new Date(ev.created_at).toLocaleTimeString("pt-BR")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      {/* ─── INACTIVE: Activation modes ─── */}
      {!isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Escolha como ativar
            </CardTitle>
            <CardDescription>
              Selecione o método de conexão que melhor se encaixa na sua plataforma de mobilidade.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Link2 className="h-4 w-4" />
                  Por URL (simples)
                </TabsTrigger>
                <TabsTrigger value="credentials" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <KeyRound className="h-4 w-4" />
                  Por credenciais
                </TabsTrigger>
              </TabsList>

              {/* ── Tab: URL ── */}
              <TabsContent value="url" className="space-y-4 mt-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <h3 className="font-semibold text-sm">Como funciona</h3>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Copie a URL abaixo.</li>
                    <li>Acesse a plataforma da sua empresa de mobilidade.</li>
                    <li>Cole a URL no campo de <strong>webhook</strong> ou <strong>notificações</strong>.</li>
                    <li>Inclua o campo <code className="bg-muted px-1 rounded text-xs">brand_id</code> no corpo (body) de cada requisição enviada — informe o ID da sua marca.</li>
                    <li>Pronto! Cada corrida finalizada vai gerar pontos para o passageiro (<strong>R$ 1 = 1 ponto</strong>).</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">URL para copiar e colar</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all border border-border">
                      {webhookUrl}
                    </code>
                    <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                      {copiedUrl ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong>Dica:</strong> Se a plataforma pedir autenticação, use o header{" "}
                    <code className="bg-muted px-1 rounded">x-api-secret</code> com a chave de acesso configurada na aba "Por credenciais".
                  </p>
                </div>
              </TabsContent>

              {/* ── Tab: Credentials ── */}
              <TabsContent value="credentials" className="space-y-4 mt-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <h3 className="font-semibold text-sm">Como funciona</h3>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Obtenha suas credenciais no painel da sua plataforma de mobilidade (ex: TaxiMachine).</li>
                    <li>Preencha os 3 campos abaixo: <strong>chave de acesso</strong>, <strong>usuário</strong> e <strong>senha</strong>.</li>
                    <li>Clique em "Ativar integração".</li>
                    <li>O sistema vai registrar automaticamente o webhook na plataforma e começar a receber corridas.</li>
                    <li>Cada corrida finalizada credita pontos ao passageiro (<strong>R$ 1 = 1 ponto</strong>).</li>
                  </ol>
                </div>

                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="api_key">Chave de acesso</Label>
                    <div className="relative">
                      <Input
                        id="api_key"
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Sua chave fornecida pela plataforma"
                      />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowApiKey(!showApiKey)}>
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basic_user">Usuário</Label>
                    <Input id="basic_user" value={basicUser} onChange={(e) => setBasicUser(e.target.value)} placeholder="Usuário de autenticação" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basic_pass">Senha</Label>
                    <div className="relative">
                      <Input id="basic_pass" type={showPass ? "text" : "password"} value={basicPass} onChange={(e) => setBasicPass(e.target.value)} placeholder="Senha de autenticação" />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending || !apiKey || !basicUser || !basicPass}>
                    {activateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Ativar integração
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── Small helper component ── */
function StatusCard({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-4 flex flex-col items-center gap-1">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
        {children}
      </CardContent>
    </Card>
  );
}
